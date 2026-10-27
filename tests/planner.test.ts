import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_POLICY } from "../lib/contracts.ts";
import type { Candidate, SessionState } from "../lib/contracts.ts";
import { QlooClient, RunBudget, normalizeEntity } from "../lib/qloo.ts";
import { applyScreening, validateSelection } from "../lib/planner-validation.ts";
import { planSession } from "../lib/planner.ts";
import { acceptCandidate, needsReview, orderSession } from "../lib/browser-state.ts";
import { readRequest } from "../lib/http.ts";

const anchor = "00000000-0000-4000-8000-000000000001";
const first = "00000000-0000-4000-8000-000000000002";
const second = "00000000-0000-4000-8000-000000000003";
const environment = { QLOO_API_KEY: "synthetic-unit-test-value", QLOO_ENDPOINT: "https://hackathon.api.qloo.com", LLM_PROVIDER: "none" };
const state: SessionState = { anchorIds: [anchor], positiveIds: [], rejectedIds: [], skippedIds: [], acceptedIds: [], seenIds: [], policy: DEFAULT_POLICY };
function raw(id = first, type = "artist", rating?: string) {
  return { entity_id: id, name: "Synthetic cultural entity", subtype: `urn:entity:${type}`, properties: { description: "A fictional cultural entry used only for testing. Its synopsis mentions a period of war and separation in a family.", content_rating: rating, release_year: 1964 }, query: { explainability: { "signal.interests.entities": [{ entity_id: anchor, score: 0.7 }, { entity_id: second, score: 1 }] } } };
}
async function getCandidate(): Promise<Candidate> {
  const rows = await new QlooClient(new RunBudget(), environment, async () => Response.json({ results: { entities: [raw()] } })).recommend("artist", state);
  return rows[0].candidate;
}

test("search normalization rejects wrong kinds and supports native-script names without inventing metadata", () => {
  assert.equal(normalizeEntity({ ...raw(), name: "鄧麗君" }, "artist")?.name, "鄧麗君");
  assert.equal(normalizeEntity(raw(first, "person"), "artist"), null);
  assert.equal(normalizeEntity({ name: "Missing ID", types: ["urn:entity:artist"] }), null);
});

test("a search match remains unfamiliar, unscreened and unaccepted; media uses a returned song", async () => {
  const searchRow = { ...raw(), properties: { ...raw().properties, notable_songs: ["Synthetic song title"] } };
  const results = await new QlooClient(new RunBudget(), environment, async () => Response.json({ results: [searchRow] })).search("Synthetic", "artist");
  const candidate = results[0].startingCandidate;
  assert.equal(candidate.provenance.source, "search"); assert.equal(candidate.screening.status, "not_run"); assert.equal(candidate.review, "pending");
  assert.equal(candidate.familiarity, "unknown"); assert.equal(needsReview(candidate), true);
  assert.ok(candidate.playbackUrl?.includes("Synthetic%20song%20title"));
});

test("Qloo request binds exclusions and era, then applies rating and exclusion gates on returned records", async () => {
  let url = "";
  const client = new QlooClient(new RunBudget(), environment, async (input) => { url = String(input); return Response.json({ results: { entities: [raw(first, "movie", "R"), raw(second, "movie", "G")] } }); });
  const rows = await client.recommend("film", { ...state, rejectedIds: [second], policy: { ...DEFAULT_POLICY, screenEra: { from: 1940, to: 1979 } } });
  const params = new URL(url).searchParams;
  assert.equal(params.get("filter.exclude.entities"), second.toUpperCase());
  assert.equal(params.get("filter.content_rating"), "G,PG");
  assert.equal(params.get("filter.release_year.max"), "1979");
  assert.equal(rows.length, 1);
  assert.equal(rows[0].candidate.ratingGate, "held");
  assert.equal(rows[0].candidate.review, "pending");
  assert.deepEqual(rows[0].candidate.provenance.attribution.map((a) => a.signalEntityId), [anchor]);
});

test("parallel Qloo reservations share six-call cap and one retry allowance", async () => {
  const budget = new RunBudget(); let requests = 0;
  const client = new QlooClient(budget, environment, async () => { requests++; return Response.json({}, { status: 503 }); });
  const outcomes = await Promise.allSettled(Array.from({ length: 8 }, () => client.search("synthetic", "artist")));
  assert.equal(requests, 6); assert.equal(budget.qlooCalls, 6); assert.ok(budget.retries <= 1);
  assert.ok(outcomes.every((outcome) => outcome.status === "rejected"));
});

test("missing Qloo credentials and an untrusted endpoint cause no network request", async () => {
  let requests = 0;
  const fetcher: typeof fetch = async () => { requests++; return Response.json({}); };
  await assert.rejects(() => new QlooClient(new RunBudget(), {}, fetcher).search("test", "artist"));
  await assert.rejects(() => new QlooClient(new RunBudget(), { ...environment, QLOO_ENDPOINT: "https://untrusted.invalid" }, fetcher).search("test", "artist"));
  assert.equal(requests, 0);
});

test("selection cannot fabricate or duplicate an ID and screening must quote an actual source field", async () => {
  const candidate = await getCandidate();
  const entry = { candidate, fields: { "properties.description": raw().properties.description } };
  const pool = new Map([[first, entry]]);
  assert.throws(() => validateSelection({ entityIds: [second] }, pool));
  assert.throws(() => validateSelection({ entityIds: [first, first] }, pool));
  assert.deepEqual(validateSelection({ entityIds: [first] }, pool), [first]);
  const flag = { code: "war", note: "War is mentioned.", fieldPath: "properties.description", evidence: "war and separation" };
  const grounded = applyScreening([entry], { items: [{ entityId: first, sufficient: true, flags: [flag] }] })[0];
  assert.equal(grounded.screening.status, "complete"); assert.equal(needsReview(grounded), true);
  const gRated = applyScreening([{ ...entry, candidate: { ...candidate, kind: "film", contentRating: "G" } }], { items: [{ entityId: first, sufficient: true, flags: [flag] }] })[0];
  assert.equal(needsReview(gRated), true, "A G rating does not suppress advisory flags.");
  assert.equal(gRated.review, "pending");
  const invented = applyScreening([entry], { items: [{ entityId: first, sufficient: true, flags: [{ ...flag, evidence: "invented battle scene" }] }] })[0];
  assert.equal(invented.screening.status, "failed"); assert.equal(needsReview(invented), true);
  assert.equal(applyScreening([entry], { items: [] })[0].screening.status, "failed");
  assert.equal(applyScreening([{ ...entry, fields: { "properties.description": "Very short." } }], { items: [{ entityId: first, sufficient: true, flags: [] }] })[0].screening.status, "insufficient_data");
});

test("upstream warnings disable attribution rather than manufacturing a because-you-liked claim", async () => {
  const rows = await new QlooClient(new RunBudget(), environment, async () => Response.json({ warnings: ["Synthetic incomplete explanation."], results: { entities: [raw()] } })).recommend("artist", state);
  assert.equal(rows[0].candidate.provenance.explainability, "unavailable");
  assert.deepEqual(rows[0].candidate.provenance.attribution, []);
});

test("no-model fallback calls only Qloo, preserves source IDs, and never marks screening complete", async () => {
  const urls: string[] = [];
  const result = await planSession({ state, kinds: ["artist", "film"] }, { environment, fetcher: async (input) => {
    urls.push(String(input));
    assert.ok(String(input).startsWith(environment.QLOO_ENDPOINT));
    return Response.json({ results: { entities: [String(input).includes("urn%3Aentity%3Amovie") ? raw(second, "movie", "G") : raw()] } });
  } });
  assert.equal(urls.length, 2); assert.equal(result.mode, "fallback"); assert.equal(result.trace.modelRounds, 0); assert.equal(result.trace.screenCalls, 0);
  assert.equal(result.candidates.length, 2); assert.ok(result.candidates.every((c) => c.screening.status === "not_run" && c.review === "pending"));
});

test("an unavailable Gemini is tried once; fallback does not invoke it again for screening", async () => {
  let modelCalls = 0;
  const result = await planSession({ state, kinds: ["artist"] }, { environment: { ...environment, LLM_PROVIDER: "gemini", GOOGLE_GENERATIVE_AI_API_KEY: "synthetic-google-key-value" }, fetcher: async (input) => {
    if (String(input).includes("googleapis")) { modelCalls++; return Response.json({ error: { code: 503, message: "Synthetic failure", status: "UNAVAILABLE" } }, { status: 503 }); }
    return Response.json({ results: { entities: [raw()] } });
  } });
  assert.equal(result.mode, "fallback");
  assert.equal(result.candidates.length, 1);
  // The failed model must not be called again by a content-screen fallback.
  assert.equal(modelCalls, 1);
});

test("the full agent uses Qloo tool results, selects inside the pool, and grounds a separate screen", async () => {
  const third = "00000000-0000-4000-8000-000000000004";
  const ids = [first, second, third];
  let modelCalls = 0, qlooCalls = 0;
  const result = await planSession({ state, kinds: ["artist", "film", "tv"] }, { environment: { ...environment, LLM_PROVIDER: "gemini", GOOGLE_GENERATIVE_AI_API_KEY: "synthetic-google-key-value" }, fetcher: async (input, init) => {
    if (!String(input).includes("googleapis")) {
      qlooCalls++;
      const type = new URL(String(input)).searchParams.get("filter.type");
      const row = type === "urn:entity:movie" ? raw(second, "movie", "G") : type === "urn:entity:tv_show" ? raw(third, "tv_show", "TV-G") : raw();
      return Response.json({ results: { entities: [row] } });
    }
    modelCalls++;
    const body = JSON.parse(String(init?.body));
    assert.equal(body.generationConfig.thinkingConfig.thinkingLevel, "low");
    const signature = { thoughtSignature: "c3ludGhldGljLXRlc3Qtc2lnbmF0dXJl" };
    const parts = modelCalls === 1
      ? ["artist", "film", "tv"].map((kind) => ({ functionCall: { name: "recommend", args: { kind } }, ...signature }))
      : modelCalls === 2
        ? [{ functionCall: { name: "select_candidates", args: { candidateKeys: ["c0", "c1", "c2"] } }, ...signature }]
        : [{ text: JSON.stringify({ items: ids.map((entityId) => ({ entityId, sufficient: true, flags: [{ code: "war", note: "War appears in the synopsis.", fieldPath: "properties.description", evidence: "war and separation" }] })) }) }];
    return Response.json({ candidates: [{ content: { role: "model", parts }, finishReason: "STOP" }], usageMetadata: { promptTokenCount: 20, candidatesTokenCount: 10, totalTokenCount: 30 } });
  } });
  assert.equal(result.mode, "agent"); assert.equal(qlooCalls, 3); assert.equal(modelCalls, 3);
  assert.equal(result.trace.modelRounds, 2); assert.equal(result.trace.screenCalls, 1);
  assert.deepEqual(result.candidates.map((c) => c.qlooEntityId), ids);
  assert.ok(result.candidates.every((c) => c.screening.status === "complete" && c.screening.flags[0].evidence === "war and separation" && c.review === "pending"));
});

test("a slow Qloo fallback respects the same overall deadline", async () => {
  let aborted = false;
  const result = await planSession({ state, kinds: ["artist"] }, { environment, timeoutMs: 550, fetcher: async (_input, init) => new Promise((_resolve, reject) => {
    const handle = setTimeout(() => reject(new Error("Did not abort.")), 2000);
    const abort = () => { aborted = true; clearTimeout(handle); reject(new DOMException("Aborted", "AbortError")); };
    if (init?.signal?.aborted) abort(); else init?.signal?.addEventListener("abort", abort, { once: true });
  }) });
  assert.equal(aborted, true); assert.equal(result.candidates.length, 0); assert.ok(result.trace.elapsedMs < 1000);
});

test("session acceptance cannot lift a rating hold; accepted ordering is independent of discoveries", async () => {
  const candidate = await getCandidate();
  assert.throws(() => acceptCandidate([], { ...candidate, ratingGate: "held" }));
  const items = acceptCandidate(acceptCandidate([], candidate), { ...candidate, qlooEntityId: second });
  assert.equal(items[0].candidate.review, "accepted");
  const reordered = orderSession(items, 1, -1);
  assert.equal(reordered[0].candidate.qlooEntityId, second);
  assert.equal(items[0].candidate.qlooEntityId, first);
  assert.equal(acceptCandidate(items, candidate), items);
});

test("HTTP boundary rejects foreign-origin calls and oversized bodies before provider access", async () => {
  assert.deepEqual(await readRequest(new Request("http://localhost:3000/api/search", { method: "POST", headers: { host: "127.0.0.1:3000", origin: "http://127.0.0.1:3000", "content-type": "application/json" }, body: "{}" })), {});
  await assert.rejects(() => readRequest(new Request("https://app.example/api/plan", { method: "POST", headers: { origin: "https://other.example", "content-type": "application/json" }, body: "{}" })));
  await assert.rejects(() => readRequest(new Request("https://app.example/api/plan", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ tooLarge: "x".repeat(21_000) }) })));
});
