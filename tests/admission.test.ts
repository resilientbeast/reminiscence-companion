import assert from "node:assert/strict";
import test from "node:test";
import { createAdmission } from "../lib/admission.ts";
import { ServiceError } from "../lib/qloo.ts";

test("ten sequential sessions with three planning runs each are admitted without identifiers", () => {
  const acquire = createAdmission();
  for (let session = 0; session < 10; session++) {
    for (let favourite = 0; favourite < 6; favourite++) acquire("search")();
    for (let refresh = 0; refresh < 3; refresh++) acquire("plan")();
  }
});

test("concurrent work is bounded and release is safe to call twice", () => {
  const acquire = createAdmission();
  const first = acquire("plan"), second = acquire("plan");
  assert.throws(() => acquire("plan"), (error: unknown) => error instanceof ServiceError && error.status === 429 && error.code === "preview_busy");
  first(); first();
  const third = acquire("plan");
  assert.throws(() => acquire("plan"));
  second(); third();
});

test("hourly counters reject excess runs and reset while preserving active-work accounting", () => {
  let clock = 0;
  const acquire = createAdmission({ plan: { concurrent: 2, hourly: 2 }, search: { concurrent: 1, hourly: 2 } }, () => clock);
  acquire("plan")(); acquire("plan")();
  assert.throws(() => acquire("plan"), (error: unknown) => error instanceof ServiceError && error.code === "preview_limit");
  clock = 3_600_000;
  const active = acquire("plan"); acquire("plan")();
  assert.throws(() => acquire("plan")); active();
});
