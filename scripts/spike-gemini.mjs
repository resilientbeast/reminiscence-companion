import fs from "node:fs";

if (fs.existsSync(".env.local")) process.loadEnvFile(".env.local");
const { runGeminiToolSpike } = await import("../lib/gemini-spike.ts");
const { GeminiConfigurationError } = await import("../lib/llm.ts");
try {
  console.log(JSON.stringify(await runGeminiToolSpike(), null, 2));
} catch (error) {
  if (error instanceof GeminiConfigurationError) {
    console.log(JSON.stringify({ status: "not_run", code: error.code, message: error.message }, null, 2));
    process.exitCode = 2;
  } else {
    const statusCode = typeof error?.statusCode === "number" ? error.statusCode : undefined;
    console.error(JSON.stringify({ status: "failed", code: "GEMINI_PROBE_FAILED", ...(statusCode ? { upstreamStatus: statusCode } : {}), message: "The bounded probe failed. Check model access, key validity, quota and deadline. Raw upstream errors are not printed to protect credentials." }, null, 2));
    process.exitCode = 1;
  }
}
