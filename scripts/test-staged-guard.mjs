import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdir, mkdtemp, writeFile, rm, rmdir } from "node:fs/promises";
import path from "node:path";

await mkdir(path.join(process.cwd(), "qloo-private"), { recursive: true });
const directory = await mkdtemp(path.join(process.cwd(), "qloo-private", "guard-check-"));
const index = path.join(directory, "index");
const fixture = path.join(directory, "synthetic.txt");
const relative = path.relative(process.cwd(), fixture).replaceAll("\\", "/");
const environment = { ...process.env, GIT_INDEX_FILE: index };
try {
  await writeFile(fixture, "Synthetic fixture: no real credentials or provider data.\n");
  execFileSync("git", ["add", "--force", "--", relative], { env: environment });
  const result = spawnSync(process.execPath, ["scripts/check-public-artifacts.mjs", "--staged"], { env: environment, encoding: "utf8" });
  assert.equal(result.status, 1, "A private research file must be rejected even when force-staged.");
  assert.ok(result.stderr.includes(`staged: ${relative}`));
  execFileSync("git", ["update-index", "--force-remove", "--", relative], { env: environment });
  const syntheticCredential = "AIza" + "x".repeat(35);
  const object = execFileSync("git", ["hash-object", "-w", "--stdin"], { input: syntheticCredential, encoding: "utf8" }).trim();
  execFileSync("git", ["update-index", "--add", "--cacheinfo", `100644,${object},guard-synthetic.txt`], { env: environment });
  const stagedOnly = spawnSync(process.execPath, ["scripts/check-public-artifacts.mjs", "--staged"], { env: environment, encoding: "utf8" });
  assert.equal(stagedOnly.status, 1, "A synthetic credential in a staged-only blob must be rejected even without a working file.");
  assert.ok(stagedOnly.stderr.includes("staged: guard-synthetic.txt"));
  for (const [prefix, expected] of [["sk_test_", 1], ["pk_test_", 0]]) {
    const value = prefix + "x".repeat(32);
    const blob = execFileSync("git", ["hash-object", "-w", "--stdin"], { input: value, encoding: "utf8" }).trim();
    execFileSync("git", ["update-index", "--add", "--cacheinfo", `100644,${blob},guard-synthetic.txt`], { env: environment });
    const check = spawnSync(process.execPath, ["scripts/check-public-artifacts.mjs", "--staged"], { env: environment, encoding: "utf8" });
    assert.equal(check.status, expected, "Clerk secret keys must be rejected; publishable keys are intentionally public.");
  }
  console.log("Staged guard passed: private paths and staged Google/Clerk secrets were rejected; Clerk publishable keys were allowed. The real index was not changed.");
} finally {
  // Exact task-created paths only; preserve all existing private research.
  await rm(fixture, { force: true });
  await rm(index, { force: true });
  await rmdir(directory);
}
