import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_POLICY } from "../lib/contracts.ts";
import { savedSnapshotSchema, saveSessionSchema, updateSessionSchema } from "../lib/saved-session-contracts.ts";
import { ownerDocumentId } from "../lib/session-store.ts";

const id = "11111111-1111-4111-8111-111111111111";
const candidate = { qlooEntityId: id, name: "Synthetic favourite", kind: "artist", provenance: { source: "search", runId: "test", requestId: "test", qlooRank: 1, explainability: "unavailable", attribution: [] }, blurb: "Synthetic source text", blurbSource: "qloo", screening: { status: "not_run", flags: [] }, ratingGate: "eligible", review: "accepted", familiarity: "confirmed_favourite" };
const snapshot = { version: 1, anchors: [{ id, name: "Synthetic favourite", kind: "artist", blurb: "" }], kinds: ["artist"], policy: DEFAULT_POLICY, eraFrom: "", eraTo: "", positiveIds: [], rejectedIds: [], accepted: [{ candidate, activity: "listen", suggestedMinutes: 5 }], feedback: {}, names: {}, phase: "building" };

test("saved sessions accept a bounded reviewed activity but reject held, unaccepted and duplicate activities", () => {
  assert.equal(savedSnapshotSchema.safeParse(snapshot).success, true);
  for (const override of [{ review: "pending" }, { ratingGate: "held" }]) assert.equal(savedSnapshotSchema.safeParse({ ...snapshot, accepted: [{ ...snapshot.accepted[0], candidate: { ...candidate, ...override } }] }).success, false);
  assert.equal(savedSnapshotSchema.safeParse({ ...snapshot, accepted: [...snapshot.accepted, ...snapshot.accepted] }).success, false);
});
test("saving cannot smuggle ownership, personal notes, discovery pools or traces", () => {
  for (const extra of [{ ownerId: "someone-else" }, { patientName: "Synthetic" }, { notes: "not supported" }, { plan: {} }, { trace: {} }]) assert.equal(saveSessionSchema.safeParse({ snapshot, ...extra }).success, false);
  assert.equal(savedSnapshotSchema.safeParse({ ...snapshot, patientName: "Synthetic" }).success, false);
  assert.equal(savedSnapshotSchema.safeParse({ ...snapshot, anchors: [{ ...snapshot.anchors[0], notes: "not supported" }] }).success, false);
});
test("conflicting feedback, invalid eras and missing update revision fail before storage", () => {
  assert.equal(savedSnapshotSchema.safeParse({ ...snapshot, rejectedIds: [id] }).success, false);
  assert.equal(savedSnapshotSchema.safeParse({ ...snapshot, eraFrom: "1980", eraTo: "1940" }).success, false);
  assert.equal(updateSessionSchema.safeParse({ snapshot }).success, false);
  assert.equal(updateSessionSchema.safeParse({ snapshot, revision: 1 }).success, true);
});
test("owner namespaces are stable and separate and cannot inject a database path", () => {
  assert.equal(ownerDocumentId("user_synthetic_a"), ownerDocumentId("user_synthetic_a"));
  assert.notEqual(ownerDocumentId("user_synthetic_a"), ownerDocumentId("user_synthetic_b"));
  assert.match(ownerDocumentId("../../other-user"), /^[a-f0-9]{64}$/);
  assert.throws(() => ownerDocumentId(""));
});
