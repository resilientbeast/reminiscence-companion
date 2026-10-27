import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const output = path.resolve(root, ".next", "standalone");
if (!output.startsWith(root + path.sep)) throw new Error("Unexpected standalone output path.");
await fs.access(path.join(output, "server.js"));
// Next may copy .env/.env.production into standalone output. Keys are runtime-only.
for (const entry of await fs.readdir(output, { withFileTypes: true })) {
  if (!/^\.env(?:$|\.)/.test(entry.name)) continue;
  const file = path.resolve(output, entry.name);
  if (!file.startsWith(output + path.sep) || entry.isDirectory()) throw new Error("Unexpected environment entry in standalone output.");
  await fs.unlink(file);
}
await fs.cp(path.join(root, ".next", "static"), path.join(output, ".next", "static"), { recursive: true });
await fs.cp(path.join(root, "public"), path.join(output, "public"), { recursive: true });
console.log("Standalone server, static assets and public files are staged together.");
