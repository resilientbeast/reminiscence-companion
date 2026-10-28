import { clerkConfigured } from "../../../lib/auth-config";
export function GET() {
  return Response.json(
    { status: "ok", service: "reminiscence-companion", milestone: "live-planner", accountsConfigured: clerkConfigured(), savedSessionsConfigured: Boolean(process.env.GOOGLE_CLOUD_PROJECT), accountCleanupConfigured: Boolean(process.env.CLERK_WEBHOOK_SIGNING_SECRET), liveAgentAvailable: Boolean(process.env.QLOO_API_KEY && (process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY) && process.env.LLM_PROVIDER !== "none") },
    { headers: { "Cache-Control": "no-store" } },
  );
}
