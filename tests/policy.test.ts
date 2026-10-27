import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_POLICY, recommendToolInputSchema, sessionItemSchema, sessionStateSchema } from "../lib/contracts.ts";
import { buildRecommendationParameters, evaluateCandidatePolicy } from "../lib/policy.ts";

const anchor = "11111111-1111-4111-8111-111111111111";
const positive = "22222222-2222-4222-8222-222222222222";
const rejected = "33333333-3333-4333-8333-333333333333";
const candidateId = "44444444-4444-4444-8444-444444444444";
const state = sessionStateSchema.parse({ anchorIds: [anchor], positiveIds: [positive], rejectedIds: [rejected], skippedIds: [], acceptedIds: [], seenIds: [], policy: { ...DEFAULT_POLICY, screenEra: { from: 1940, to: 1979 } } });

test("server-bound movie query retains seeds, exclusions and caregiver constraints", () => {
  const params = buildRecommendationParameters({ kind: "film", limit: 15 }, state);
  assert.equal(params["filter.type"], "urn:entity:movie");
  assert.equal(params["signal.interests.entities"], [anchor, positive].join(","));
  assert.equal(params["filter.exclude.entities"], rejected);
  assert.equal(params["filter.content_rating"], "G,PG");
  assert.equal(params["filter.release_year.min"], "1940");
  assert.equal(params["filter.release_year.max"], "1979");
});
test("model-facing input cannot smuggle filter overrides or unbounded pools", () => {
  assert.equal(recommendToolInputSchema.safeParse({ kind: "film", limit: 15, "filter.exclude.entities": "" }).success, false);
  assert.equal(recommendToolInputSchema.safeParse({ kind: "film", limit: 21 }).success, false);
});
test("music receives no unsupported rating or era filter", () => {
  const params = buildRecommendationParameters({ kind: "artist" }, state);
  assert.equal(params["filter.content_rating"], undefined);
  assert.equal(params["filter.release_year.min"], undefined);
  assert.equal(params["filter.release_year.max"], undefined);
});
test("TV uses its own returned rating gate rather than movie labels", () => {
  assert.equal(buildRecommendationParameters({ kind: "tv" }, state)["filter.content_rating"], undefined);
  assert.equal(evaluateCandidatePolicy({ qlooEntityId: candidateId, kind: "tv", year: 1961, contentRating: "TV-PG" }, state).eligible, true);
  assert.equal(evaluateCandidatePolicy({ qlooEntityId: candidateId, kind: "tv", year: 1961, contentRating: "PG" }, state).eligible, false);
});
test("a rejection survives a returned provider result", () => {
  assert.deepEqual(evaluateCandidatePolicy({ qlooEntityId: rejected, kind: "artist" }, state), { eligible: false, reason: "explicitly_rejected" });
});
test("missing year and out-of-era content do not bypass explicit bounds", () => {
  assert.equal(evaluateCandidatePolicy({ qlooEntityId: candidateId, kind: "film", contentRating: "G" }, state).reason, "missing_year");
  assert.equal(evaluateCandidatePolicy({ qlooEntityId: candidateId, kind: "film", year: 1990, contentRating: "G" }, state).reason, "out_of_era");
});
test("unknown, legacy and higher ratings remain held", () => {
  for (const contentRating of [undefined, "Approved", "R"]) {
    assert.equal(evaluateCandidatePolicy({ qlooEntityId: candidateId, kind: "film", year: 1964, contentRating }, state).reason, "rating_held");
  }
});
test("contradictory preferences, duplicate IDs and inverted eras are rejected", () => {
  assert.equal(sessionStateSchema.safeParse({ ...state, rejectedIds: [anchor] }).success, false);
  assert.equal(sessionStateSchema.safeParse({ ...state, anchorIds: [anchor, anchor] }).success, false);
  assert.equal(sessionStateSchema.safeParse({ ...state, policy: { ...state.policy, screenEra: { from: 1980, to: 1940 } } }).success, false);
});
test("pending or rating-held items cannot become a finished session item", () => {
  const candidate = { qlooEntityId: candidateId, name: "Synthetic test title", kind: "film", provenance: { runId: "test", requestId: "test", qlooRank: 1, explainability: "unavailable", attribution: [] }, blurb: "", blurbSource: "qloo", screening: { status: "not_run", flags: [] }, ratingGate: "eligible", review: "pending", familiarity: "unknown" };
  assert.equal(sessionItemSchema.safeParse({ candidate, activity: "view", suggestedMinutes: 3 }).success, false);
  assert.equal(sessionItemSchema.safeParse({ candidate: { ...candidate, review: "accepted", ratingGate: "held" }, activity: "view", suggestedMinutes: 3 }).success, false);
  assert.equal(sessionItemSchema.safeParse({ candidate: { ...candidate, review: "accepted" }, activity: "view", suggestedMinutes: 3 }).success, true);
});
