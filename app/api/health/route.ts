export function GET() {
  return Response.json(
    { status: "ok", service: "reminiscence-companion", milestone: "live-planner", liveAgentAvailable: Boolean(process.env.QLOO_API_KEY && (process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY) && process.env.LLM_PROVIDER !== "none") },
    { headers: { "Cache-Control": "no-store" } },
  );
}
