import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";

// Explicitly invoked live check: five searches and two bounded planning runs.
// Real responses remain in the ignored research folder, never public fixtures.
const base = process.env.SMOKE_BASE_URL || "http://localhost:3000";
async function post(path, input) {
  const response = await fetch(new URL(path, base), { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(input), signal: AbortSignal.timeout(25_000) });
  assert.equal(response.status, 200, `Expected a successful ${path} response.`);
  return response.json();
}
const searches = [
  { query: "Frank Sinatra", kind: "artist" }, { query: "The Sound of Music", kind: "film" },
  { query: "I Love Lucy", kind: "tv" }, { query: "Lata Mangeshkar", kind: "artist" }, { query: "鄧麗君", kind: "artist" },
];
const anchors = [];
for (const search of searches) {
  const result = await post("/api/demo/search", search);
  assert.ok(result.results.length > 0, `The ${search.kind} preset should resolve.`);
  const exact = result.results.find((r) => r.name.toLowerCase() === search.query.toLowerCase());
  assert.ok(exact && exact.kind === search.kind, "Confirm only the exact expected kind/name.");
  anchors.push(exact);
}
const state = { anchorIds: anchors.slice(0, 3).map((a) => a.id), positiveIds: [], rejectedIds: [], skippedIds: [], acceptedIds: [], seenIds: [], policy: { movieRatings: "G_PG", tvRatings: "TV_G_PG", unrated: "hold", screenEra: { from: 1940, to: 1979 } } };
function validate(plan) {
  assert.ok(plan.candidates.length > 0 && plan.candidates.length <= 6);
  assert.ok(plan.trace.qlooCalls <= 6 && plan.trace.modelRounds <= 3 && plan.trace.screenCalls <= 1);
  assert.ok(plan.trace.elapsedMs <= 21_000, "Shared overall deadline must remain bounded.");
  const pool = new Set(plan.trace.sourceOrder.flatMap((group) => group.ids));
  assert.ok(plan.candidates.every((c) => pool.has(c.qlooEntityId) && c.review === "pending"));
  assert.ok(plan.candidates.filter((c) => c.kind !== "artist").every((c) => c.year >= 1940 && c.year <= 1979));
}
const first = await post("/api/demo/plan", { kinds: ["artist", "film", "tv"], state }); validate(first);
const rejected = first.candidates[0].qlooEntityId;
const accepted = first.candidates.find((c) => c.qlooEntityId !== rejected && c.ratingGate === "eligible");
assert.ok(accepted);
const nextState = { ...state, rejectedIds: [rejected], acceptedIds: [accepted.qlooEntityId], seenIds: first.candidates.map((c) => c.qlooEntityId) };
const second = await post("/api/demo/plan", { kinds: ["artist", "film", "tv"], state: nextState }); validate(second);
assert.ok(second.trace.exclusions.includes(rejected) && second.trace.exclusions.includes(accepted.qlooEntityId));
assert.ok(second.candidates.every((c) => c.qlooEntityId !== rejected && c.qlooEntityId !== accepted.qlooEntityId));
const summary = { status: "passed", presetsResolved: anchors.length, runs: [first, second].map((plan) => ({ mode: plan.mode, candidates: plan.candidates.length, qlooCalls: plan.trace.qlooCalls, modelRounds: plan.trace.modelRounds, screenCalls: plan.trace.screenCalls, completedScreens: plan.candidates.filter((c) => c.screening.status === "complete").length, elapsedMs: plan.trace.elapsedMs })), rejectionAndAcceptanceExclusionsVerified: true };
await mkdir("qloo-private", { recursive: true });
await writeFile("qloo-private/live-app-smoke.json", JSON.stringify({ summary, first, second }, null, 2));
console.log(JSON.stringify(summary, null, 2));
