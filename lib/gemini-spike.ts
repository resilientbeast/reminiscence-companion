import "server-only";
import { isStepCount, ToolLoopAgent, tool } from "ai";
import { z } from "zod";
import { createGeminiModel } from "./llm.ts";

const probeInput = z.object({ token: z.literal("gemini-tool-probe") }).strict();
const probeOutput = z.object({ status: z.literal("ok"), token: z.literal("gemini-tool-probe") }).strict();

export async function runGeminiToolSpike(options: {
  environment?: Record<string, string | undefined>;
  fetchImplementation?: typeof fetch;
  timeoutMs?: number;
} = {}) {
  const { model, modelId } = createGeminiModel(options.environment, options.fetchImplementation);
  const timeoutMs = options.timeoutMs ?? 20_000;
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 20_000) throw new Error("The probe deadline must be between 1 and 20000 ms.");
  let executed = 0;
  const agent = new ToolLoopAgent({
    model,
    instructions: "This is a synthetic API integration test. Call confirm_probe exactly once with token gemini-tool-probe. After receiving its result, give a short confirmation. No Qloo calls, personal data or other tools are involved.",
    tools: {
      confirm_probe: tool({
        description: "Confirm a synthetic integration test token. This local tool has no external side effects.",
        inputSchema: probeInput,
        execute: async (input) => {
          if (++executed > 1) throw new Error("The single-tool execution budget was exceeded.");
          return probeOutput.parse({ status: "ok", token: input.token });
        },
      }),
    },
    stopWhen: isStepCount(2),
    prepareStep: ({ stepNumber }) => ({ toolChoice: stepNumber === 0 ? { type: "tool" as const, toolName: "confirm_probe" as const } : "none" as const }),
    maxRetries: 0,
    maxOutputTokens: 512,
  });
  const start = Date.now();
  const result = await agent.generate({ prompt: "Run the integration probe and confirm its returned status.", abortSignal: AbortSignal.timeout(timeoutMs) });
  const outputValidated = result.steps.some((step) => step.toolResults.some((entry) => entry.toolName === "confirm_probe" && probeOutput.safeParse(entry.output).success));
  if (executed !== 1 || result.steps.length !== 2 || !outputValidated || !result.text.trim()) throw new Error("The structured tool-call round trip did not complete.");
  return {
    status: "passed" as const, provider: "gemini" as const, modelId,
    modelRounds: result.steps.length, toolExecutions: executed, outputValidated,
    inputTokens: result.totalUsage.inputTokens ?? null,
    outputTokens: result.totalUsage.outputTokens ?? null,
    elapsedMs: Date.now() - start,
  };
}
