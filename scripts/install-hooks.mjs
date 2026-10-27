import { chmod } from "node:fs/promises";
import { spawnSync, execFileSync } from "node:child_process";

const current = spawnSync("git", ["config", "--get", "core.hooksPath"], { encoding: "utf8" });
if (current.status !== 0 && current.status !== 1) throw new Error("Run hook installation inside this Git checkout.");
if (current.stdout.trim() && current.stdout.trim() !== ".githooks") throw new Error("Existing hooks are configured; they were not overwritten. Integrate the staged credential check with those hooks.");
await chmod(".githooks/pre-commit", 0o755);
execFileSync("git", ["config", "core.hooksPath", ".githooks"]);
console.log("Local pre-commit credential/private-path guard installed. No global Git setting or staged file was changed.");
