import fs from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const secrets = [];
for (const name of ["QLOO_API_KEY", "GOOGLE_GENERATIVE_AI_API_KEY", "GEMINI_API_KEY"]) {
  if (process.env[name]?.length >= 16) secrets.push(process.env[name]);
}
for (const name of [".env", ".env.local", ".env.txt"]) {
  let content;
  try { content = await fs.readFile(path.join(root, name), "utf8"); } catch (error) { if (error.code === "ENOENT") continue; throw error; }
  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!match || !/KEY|TOKEN|SECRET/.test(match[1])) continue;
    const value = match[2].replace(/^(['"])(.*)\1$/, "$2");
    if (value.length >= 16) secrets.push(value);
  }
}
const skip = new Set(["node_modules", ".git", "qloo-private", ".next", "coverage"]);
const extensions = /\.(?:tsx?|m?js|json|md|css|html|ya?ml|txt)$/;
const files = [];
async function walk(dir, built = false) {
  let entries;
  try { entries = await fs.readdir(dir, { withFileTypes: true }); } catch (error) { if (error.code === "ENOENT") return; throw error; }
  for (const entry of entries) {
    if (entry.name.startsWith(".env") && entry.name !== ".env.example") continue;
    if (!built && skip.has(entry.name)) continue;
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(file, built);
    else if (extensions.test(entry.name) || entry.name === ".env.example") files.push(file);
  }
}
await walk(root);
await walk(path.join(root, ".next", "static"), true);
const violations = [];
function containsCredential(content) {
  return secrets.some((value) => content.includes(value)) || /\bsk-(?:proj-|ant-)?[A-Za-z0-9_-]{24,}\b/.test(content) || /\bAIza[A-Za-z0-9_-]{35}\b/.test(content);
}
for (const file of files) {
  const content = await fs.readFile(file, "utf8");
  if (containsCredential(content)) violations.push(path.relative(root, file));
}
if (process.argv.includes("--staged")) {
  const staged = execFileSync("git", ["diff", "--cached", "--name-only", "--diff-filter=ACMR", "-z"], { encoding: "utf8" }).split("\0").filter(Boolean);
  for (const name of staged) {
    if (/(^|\/)\.env(?:\.|$)/.test(name) && name !== ".env.example" || /^(?:qloo-private|node_modules|\.next)\//.test(name)) {
      violations.push(`staged: ${name}`); continue;
    }
    const content = execFileSync("git", ["show", `:${name}`], { encoding: "utf8", maxBuffer: 20_000_000 });
    if (containsCredential(content)) violations.push(`staged: ${name}`);
  }
}
if (violations.length) {
  console.error("Possible credential in public source/assets:", violations.join(", "));
  process.exitCode = 1;
} else console.log(`Credential check passed for ${files.length} public source/asset files. Private values were not printed.`);
