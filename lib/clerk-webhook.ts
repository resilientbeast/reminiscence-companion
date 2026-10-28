import "server-only";
import { verifyWebhook, type WebhookEvent } from "@clerk/backend/webhooks";
import { deleteAccountSessions } from "./session-store.ts";
import { jsonHeaders } from "./http.ts";

type Dependencies = {
  verify: (request: Request, options: { signingSecret: string }) => Promise<WebhookEvent>;
  purge: (userId: string) => Promise<void>;
};
const defaults: Dependencies = { verify: verifyWebhook, purge: deleteAccountSessions };
const reply = (status: number, code: string) => Response.json({ code }, { status, headers: jsonHeaders });

export async function handleClerkWebhook(request: Request, dependencies: Dependencies = defaults, environment: Record<string, string | undefined> = process.env) {
  const signingSecret = environment.CLERK_WEBHOOK_SIGNING_SECRET;
  if (!signingSecret) return reply(503, "webhook_unconfigured");
  // Preserve the exact signed bytes while bounding this public endpoint's input.
  const reader = request.body?.getReader();
  if (!reader) return reply(400, "invalid_webhook");
  const chunks: Uint8Array[] = []; let length = 0;
  try {
    for (;;) {
      const chunk = await reader.read(); if (chunk.done) break;
      length += chunk.value.length;
      if (length > 65_536) { await reader.cancel(); return reply(413, "webhook_too_large"); }
      chunks.push(chunk.value);
    }
  } catch { return reply(400, "invalid_webhook"); }
  let event: WebhookEvent;
  try {
    event = await dependencies.verify(new Request(request.url, { method: "POST", headers: request.headers, body: Buffer.concat(chunks) }), { signingSecret });
  } catch { return reply(400, "invalid_webhook"); }
  if (event.type !== "user.deleted") return reply(200, "event_ignored");
  const id = event.data.id;
  if (typeof id !== "string" || !/^user_[A-Za-z0-9]{1,190}$/.test(id)) return reply(400, "invalid_deleted_user");
  try { await dependencies.purge(id); }
  catch {
    // Non-2xx lets Clerk/Svix retry. Never log event bodies or account identifiers.
    console.error(JSON.stringify({ event: "account_cleanup_failed" }));
    return reply(503, "cleanup_retry_required");
  }
  return reply(200, "account_sessions_deleted");
}
