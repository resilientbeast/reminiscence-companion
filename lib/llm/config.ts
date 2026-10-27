export const DEFAULT_GEMINI_MODEL = "gemini-3.8-flash";
type Environment = Record<string, string | undefined>;

export type GeminiConfiguration =
  | { status: "configured"; provider: "gemini"; modelId: string; apiKey: string }
  | { status: "unavailable"; provider: "gemini"; modelId: string; code: "PROVIDER_DISABLED" | "MISSING_GEMINI_KEY" | "INVALID_GEMINI_CONFIG"; message: string };

// Only the server adapter supplies process.env. Never serialize this result: it may contain a key.
export function readGeminiConfiguration(env: Environment): GeminiConfiguration {
  const provider = env.LLM_PROVIDER?.trim() || "gemini";
  const modelId = env.LLM_MODEL?.trim() || DEFAULT_GEMINI_MODEL;
  if (provider === "none") return { status: "unavailable", provider: "gemini", modelId, code: "PROVIDER_DISABLED", message: "Model calls are disabled by local configuration." };
  if (provider !== "gemini" || !/^gemini-[a-z0-9][a-z0-9.-]*$/.test(modelId)) {
    return { status: "unavailable", provider: "gemini", modelId: DEFAULT_GEMINI_MODEL, code: "INVALID_GEMINI_CONFIG", message: "Set LLM_PROVIDER=gemini and a Gemini model ID in the server environment." };
  }
  const apiKey = env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() || env.GEMINI_API_KEY?.trim();
  if (!apiKey) return { status: "unavailable", provider: "gemini", modelId, code: "MISSING_GEMINI_KEY", message: "Add GOOGLE_GENERATIVE_AI_API_KEY to the ignored .env.local file. Keep the key out of chat and source control." };
  return { status: "configured", provider: "gemini", modelId, apiKey };
}
