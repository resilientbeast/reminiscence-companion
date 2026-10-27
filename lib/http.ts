import "server-only";
import { ServiceError } from "./qloo.ts";

export const jsonHeaders = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };
export async function readRequest(request: Request, maxBytes = 20_000) {
  const origin = request.headers.get("origin");
  if (origin) {
    let source: URL;
    try { source = new URL(origin); } catch { throw new ServiceError("origin", "Open the app directly to continue.", 403); }
    // Next's internal request URL may use localhost or HTTP behind a proxy.
    // The incoming Host still identifies the browser-facing application origin.
    const host = request.headers.get("host") || new URL(request.url).host;
    if (!["http:", "https:"].includes(source.protocol) || source.host !== host) throw new ServiceError("origin", "Open the app directly to continue.", 403);
  }
  if (!request.headers.get("content-type")?.includes("application/json")) throw new ServiceError("input", "Send a JSON request.", 400);
  const reader = request.body?.getReader(); if (!reader) throw new ServiceError("input", "A request body is required.", 400);
  const chunks: Uint8Array[] = []; let length = 0;
  for (;;) {
    const next = await reader.read(); if (next.done) break;
    length += next.value.length;
    if (length > maxBytes) { await reader.cancel(); throw new ServiceError("input", "This request is too large.", 413); }
    chunks.push(next.value);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown; } catch { throw new ServiceError("input", "The request could not be read.", 400); }
}
export function errorResponse(error: unknown) {
  if (error instanceof ServiceError) return Response.json({ error: error.message, code: error.code }, { status: error.status, headers: jsonHeaders });
  return Response.json({ error: "The request could not be completed. Check your choices and try again.", code: "request_failed" }, { status: 400, headers: jsonHeaders });
}
