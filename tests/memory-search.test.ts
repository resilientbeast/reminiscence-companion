import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_POLICY } from "../lib/contracts.ts";
import { savedSnapshotSchema } from "../lib/saved-session-contracts.ts";
import type { SavedSession } from "../lib/saved-session-contracts.ts";
import { deriveSessionMemory } from "../lib/session-memory.ts";
import { createEntityLookup } from "../lib/entity-lookup.ts";
import { QlooClient, RunBudget, normalizeEntity } from "../lib/qloo.ts";

const id = (n: number) => `00000000-0000-4000-8000-${n.toString(16).padStart(12, "0")}`.toUpperCase();
const anchor = (n: number) => ({ id: id(n), name: `Synthetic favourite ${n}`, kind: "artist" as const, blurb: "Synthetic source" });
function saved(n: number, overrides = {}): SavedSession {
  const snapshot = savedSnapshotSchema.parse({ version: 1, anchors: [anchor(1)], kinds: ["artist"], policy: DEFAULT_POLICY, eraFrom: "", eraTo: "", positiveIds: [], rejectedIds: [], accepted: [], feedback: {}, names: {}, phase: "finished", ...overrides });
  return { id: id(n + 9000), title: "Synthetic session", updatedAt: `2026-10-${String(n).padStart(2, "0")}T00:00:00.000Z`, activityCount: snapshot.accepted.length, minutes: 0, phase: snapshot.phase, revision: 1, snapshot };
}

test("new sessions inherit saved favourites, observed feedback, exclusions and settings without accepting activities", () => {
  const history = saved(1, { positiveIds: [id(2)], rejectedIds: [id(3)], feedback: { [id(2)]: "Worked well", [id(3)]: "Not for them" }, names: { [id(2)]: "Synthetic hit", [id(3)]: "Synthetic miss" }, kinds: ["film"], eraFrom: "1940", eraTo: "1979", policy: { ...DEFAULT_POLICY, movieRatings: "G" } });
  const memory = deriveSessionMemory([history]);
  assert.equal(memory.sourceSessions, 1);
  assert.deepEqual(memory.snapshot.anchors.map(a => a.id), [id(1)]);
  assert.deepEqual(memory.snapshot.positiveIds, [id(2)]);
  assert.deepEqual(memory.snapshot.rejectedIds, [id(3)]);
  assert.equal(memory.snapshot.feedback[id(2)], "Worked well");
  assert.equal(memory.snapshot.policy.movieRatings, "G");
  assert.equal(memory.snapshot.eraTo, "1979");
  assert.deepEqual(memory.snapshot.accepted, []);
  assert.equal(memory.snapshot.phase, "building");
});
test("the most recently saved decision resolves conflicting feedback and deleted history stops contributing", () => {
  const older = saved(1);
  const rejected = saved(2, { anchors: [], rejectedIds: [id(1)], feedback: { [id(1)]: "Not for them" } });
  assert.deepEqual(deriveSessionMemory([rejected, older]).snapshot.anchors, []);
  assert.deepEqual(deriveSessionMemory([rejected, older]).snapshot.rejectedIds, [id(1)]);
  const reconfirmed = saved(3);
  const memory = deriveSessionMemory([reconfirmed, rejected, older]);
  assert.deepEqual(memory.snapshot.anchors.map(a => a.id), [id(1)]);
  assert.deepEqual(memory.snapshot.rejectedIds, []);
  assert.deepEqual(deriveSessionMemory([older]).snapshot.anchors.map(a => a.id), [id(1)]);
  assert.deepEqual(deriveSessionMemory([]).snapshot.anchors, []);
});
test("remembered signals remain within API limits across twenty saved sessions", () => {
  const history = Array.from({ length: 20 }, (_, index) => saved(index + 1, { anchors: [anchor(index + 1)], positiveIds: Array.from({ length: 12 }, (_, j) => id(100 + index * 12 + j)), rejectedIds: Array.from({ length: 100 }, (_, j) => id(1000 + index * 100 + j)) }));
  const memory = deriveSessionMemory(history);
  assert.equal(memory.snapshot.anchors.length, 6);
  assert.equal(memory.snapshot.positiveIds.length, 12);
  assert.equal(memory.snapshot.rejectedIds.length, 100);
  assert.ok(Object.keys(memory.snapshot.names).length <= 120);
  assert.equal(savedSnapshotSchema.safeParse(memory.snapshot).success, true);
});
test("a slower earlier lookup and its errors cannot replace the current results", async () => {
  const pending = new Map<string, { resolve: (response: Response) => void; reject: (error: Error) => void }>();
  const lookup = createEntityLookup("/api/demo", async (_url, init) => new Promise<Response>((resolve, reject) => { pending.set(JSON.parse(String(init?.body)).query, { resolve, reject }); }));
  const old = lookup.run("Sinatra", "artist"); await Promise.resolve();
  const current = lookup.run("Lata", "artist"); await Promise.resolve();
  pending.get("Lata")!.resolve(Response.json({ results: [anchor(2)] }));
  assert.deepEqual(await current, [anchor(2)]);
  pending.get("Sinatra")!.reject(new Error("Stale failure"));
  assert.equal(await old, null);
});
test("lookups deduplicate in-flight submits, cache by category and expire without sending short queries", async () => {
  let calls = 0, now = 0;
  const lookup = createEntityLookup("/api/demo", async () => { calls++; return Response.json({ results: [anchor(1)] }); }, () => now);
  const first = lookup.run("Sinatra", "artist");
  assert.equal(first, lookup.run("Sinatra", "artist")); await first;
  await lookup.run("sinatra", "artist"); assert.equal(calls, 1);
  await lookup.run("Sinatra", "film"); assert.equal(calls, 2);
  now = 121_000; await lookup.run("Sinatra", "artist"); assert.equal(calls, 3);
  await lookup.run("S", "artist"); assert.equal(calls, 3);
  const cached = lookup.run("Sinatra", "artist"); lookup.cancel(); assert.equal(await cached, null);
});
test("Qloo images retain only supplied HTTPS URLs through search and candidate normalization", async () => {
  const row = { entity_id: id(1), name: "Synthetic artist", subtype: "urn:entity:artist", properties: { image: { url: "https://images.example.test/artist.jpg" } } };
  assert.equal(normalizeEntity(row)?.imageUrl, row.properties.image.url);
  for (const url of ["http://images.example.test/artist.jpg", "javascript:alert(1)", "file:///private"]) assert.equal(normalizeEntity({ ...row, properties: { image: { url } } })?.imageUrl, undefined);
  const results = await new QlooClient(new RunBudget(), { QLOO_API_KEY: "synthetic-test", QLOO_ENDPOINT: "https://hackathon.api.qloo.com" }, async () => Response.json({ results: [row] })).search("Synthetic", "artist");
  assert.equal(results[0].startingCandidate.imageUrl, row.properties.image.url);
});
