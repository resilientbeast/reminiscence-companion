import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_GEMINI_MODEL, readGeminiConfiguration } from "../lib/llm/config.ts";
import { runGeminiToolSpike } from "../lib/gemini-spike.ts";
import { GeminiConfigurationError } from "../lib/llm.ts";

const environment = { LLM_PROVIDER: "gemini", LLM_MODEL: DEFAULT_GEMINI_MODEL, GOOGLE_GENERATIVE_AI_API_KEY: "synthetic-test-value-no-real-provider-access" };

test("Gemini config has an explicit default and supports intentional no-model mode", () => {
  const config = readGeminiConfiguration({ GOOGLE_GENERATIVE_AI_API_KEY: environment.GOOGLE_GENERATIVE_AI_API_KEY });
  assert.equal(config.status, "configured");
  assert.equal(config.modelId, DEFAULT_GEMINI_MODEL);
  const disabled = readGeminiConfiguration({ ...environment, LLM_PROVIDER: "none" });
  assert.equal(disabled.status === "unavailable" && disabled.code, "PROVIDER_DISABLED");
  assert.equal(readGeminiConfiguration({ ...environment, LLM_MODEL: "https://untrusted.invalid/model" }).status, "unavailable");
});

test("missing Gemini configuration performs no HTTP request", async () => {
  let requests = 0;
  const fetchImplementation: typeof fetch = async () => { requests++; throw new Error("Unexpected network call."); };
  await assert.rejects(() => runGeminiToolSpike({ environment: {}, fetchImplementation }), (error: unknown) => error instanceof GeminiConfigurationError && error.code === "MISSING_GEMINI_KEY");
  assert.equal(requests, 0);
});

test("direct Google adapter completes a validated tool round trip using mock HTTP only", async () => {
  let requests = 0;
  const fetchImplementation: typeof fetch = async (input, init) => {
    requests++;
    assert.ok(String(input).startsWith("https://generativelanguage.googleapis.com/v1beta/models/"));
    assert.ok(!String(input).includes(environment.GOOGLE_GENERATIVE_AI_API_KEY));
    assert.equal(new Headers(init?.headers).get("x-goog-api-key"), environment.GOOGLE_GENERATIVE_AI_API_KEY);
    const body = JSON.parse(String(init?.body)) as { contents?: { parts?: { functionResponse?: unknown }[] }[] };
    if (requests === 2) {
      const toolResponses = body.contents?.flatMap((entry) => entry.parts ?? []).filter((part) => part.functionResponse);
      assert.ok(toolResponses?.length, "The tool result must be sent back to the model.");
      assert.ok(JSON.stringify(toolResponses).includes('"status":"ok"'));
      assert.ok(JSON.stringify(body).includes("c3ludGhldGljLXRlc3Qtc2lnbmF0dXJl"), "Gemini thought signatures must survive the tool round trip.");
    }
    assert.ok(requests <= 2, "The spike must not make extra model requests.");
    return Response.json({
      candidates: [{ content: { role: "model", parts: requests === 1
        ? [{ functionCall: { name: "confirm_probe", args: { token: "gemini-tool-probe" } }, thoughtSignature: "c3ludGhldGljLXRlc3Qtc2lnbmF0dXJl" }]
        : [{ text: "The integration probe returned ok." }] }, finishReason: "STOP" }],
      usageMetadata: { promptTokenCount: 20, candidatesTokenCount: 10, totalTokenCount: 30 },
    });
  };
  const result = await runGeminiToolSpike({ environment, fetchImplementation });
  assert.equal(result.status, "passed");
  assert.equal(result.modelRounds, 2);
  assert.equal(result.toolExecutions, 1);
  assert.equal(result.outputValidated, true);
  assert.equal(requests, 2);
});

test("the provider spike does not automatically retry an upstream failure", async () => {
  let requests = 0;
  const fetchImplementation: typeof fetch = async () => {
    requests++;
    return Response.json({ error: { code: 503, status: "UNAVAILABLE", message: "Synthetic unavailable response." } }, { status: 503 });
  };
  await assert.rejects(() => runGeminiToolSpike({ environment, fetchImplementation }));
  assert.equal(requests, 1);
});

test("the shared deadline aborts a slow provider request", async () => {
  let aborted = false;
  const fetchImplementation: typeof fetch = async (_input, init) => new Promise((_resolve, reject) => {
    const handle = setTimeout(() => reject(new Error("Probe failed to abort.")), 1000);
    const abort = () => { aborted = true; clearTimeout(handle); reject(new DOMException("Aborted", "AbortError")); };
    if (init?.signal?.aborted) abort();
    else init?.signal?.addEventListener("abort", abort, { once: true });
  });
  await assert.rejects(() => runGeminiToolSpike({ environment, fetchImplementation, timeoutMs: 25 }));
  assert.equal(aborted, true);
});
