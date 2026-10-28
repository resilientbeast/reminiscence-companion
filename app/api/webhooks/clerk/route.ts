import { handleClerkWebhook } from "../../../../lib/clerk-webhook";
export const runtime = "nodejs";
export function POST(request: Request) { return handleClerkWebhook(request); }
