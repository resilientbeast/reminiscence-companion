import "server-only";
import { createGoogle } from "@ai-sdk/google";
import { readGeminiConfiguration } from "./llm/config.ts";

export class GeminiConfigurationError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "GeminiConfigurationError";
    this.code = code;
  }
}

export function createGeminiModel(
  environment: Record<string, string | undefined> = process.env,
  fetchImplementation?: typeof fetch,
) {
  const configuration = readGeminiConfiguration(environment);
  if (configuration.status !== "configured") throw new GeminiConfigurationError(configuration.code, configuration.message);
  const google = createGoogle({ apiKey: configuration.apiKey, ...(fetchImplementation ? { fetch: fetchImplementation } : {}) });
  return { model: google.chat(configuration.modelId), modelId: configuration.modelId };
}
