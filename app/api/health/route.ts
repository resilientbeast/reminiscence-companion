export function GET() {
  return Response.json(
    { status: "ok", service: "reminiscence-companion", milestone: "live-planner", accountsConfigured: Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY), savedSessionsConfigured: Boolean(process.env.GOOGLE_CLOUD_PROJECT), liveAgentAvailable: Boolean(process.env.QLOO_API_KEY && (process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY) && process.env.LLM_PROVIDER !== "none") },
    { headers: { "Cache-Control": "no-store" } },
  );
}
