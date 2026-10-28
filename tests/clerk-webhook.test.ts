import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import { verifyWebhook } from "@clerk/backend/webhooks";
import { handleClerkWebhook } from "../lib/clerk-webhook.ts";

const key = Buffer.alloc(32, 7);
const environment = { CLERK_WEBHOOK_SIGNING_SECRET: "whsec_" + key.toString("base64") };
function request(payload: unknown, options: { timestamp?: number; tamper?: boolean } = {}) {
  const body = JSON.stringify(payload);
  const timestamp = String(options.timestamp ?? Math.floor(Date.now() / 1000));
  const id = "msg_synthetic_deletion";
  const signature = createHmac("sha256", key).update(`${id}.${timestamp}.${body}`).digest("base64");
  return new Request("https://app.example/api/webhooks/clerk", { method: "POST", headers: { "content-type": "application/json", "svix-id": id, "svix-timestamp": timestamp, "svix-signature": `v1,${options.tamper ? "invalid" : signature}` }, body });
}
const deletion = { type: "user.deleted", object: "event", data: { id: "user_syntheticDeleted", object: "user", deleted: true } };

test("Clerk cleanup requires configured signing verification before touching storage", async () => {
  let calls = 0;
  const response = await handleClerkWebhook(request(deletion), { verify: async () => { calls++; throw new Error("Unexpected verification"); }, purge: async () => { calls++; } }, {});
  assert.equal(response.status, 503); assert.equal(calls, 0);
});
test("a real signed user.deleted event selects only that account; duplicate delivery is accepted", async () => {
  const ids: string[] = [];
  const dependencies = { verify: verifyWebhook, purge: async (id: string) => { ids.push(id); } };
  for (let i = 0; i < 2; i++) assert.equal((await handleClerkWebhook(request(deletion), dependencies, environment)).status, 200);
  assert.deepEqual(ids, [deletion.data.id, deletion.data.id]);
});
test("forged, expired and missing signatures cannot trigger account cleanup", async () => {
  let purges = 0;
  const dependencies = { verify: verifyWebhook, purge: async () => { purges++; } };
  for (const input of [request(deletion, { tamper: true }), request(deletion, { timestamp: Math.floor(Date.now() / 1000) - 3600 }), new Request("https://app.example/api/webhooks/clerk", { method: "POST", body: JSON.stringify(deletion) })]) {
    assert.equal((await handleClerkWebhook(input, dependencies, environment)).status, 400);
  }
  assert.equal(purges, 0);
});
test("other verified event types are ignored and malformed deleted-user IDs fail closed", async () => {
  let purges = 0;
  const dependencies = { verify: verifyWebhook, purge: async () => { purges++; } };
  assert.equal((await handleClerkWebhook(request({ ...deletion, type: "user.updated" }), dependencies, environment)).status, 200);
  for (const id of [undefined, "../../another-account"]) assert.equal((await handleClerkWebhook(request({ ...deletion, data: { id } }), dependencies, environment)).status, 400);
  assert.equal(purges, 0);
});
test("a storage failure asks for retry and a later delivery can complete", async () => {
  let attempts = 0;
  const dependencies = { verify: verifyWebhook, purge: async () => { if (++attempts === 1) throw new Error("Synthetic storage outage"); } };
  assert.equal((await handleClerkWebhook(request(deletion), dependencies, environment)).status, 503);
  assert.equal((await handleClerkWebhook(request(deletion), dependencies, environment)).status, 200);
  assert.equal(attempts, 2);
});
test("oversized public webhook bodies are rejected before signature verification", async () => {
  let verified = false;
  const dependencies = { verify: async () => { verified = true; throw new Error("Unexpected verification"); }, purge: async () => {} };
  assert.equal((await handleClerkWebhook(new Request("https://app.example/api/webhooks/clerk", { method: "POST", body: "x".repeat(65_537) }), dependencies, environment)).status, 413);
  assert.equal(verified, false);
});
