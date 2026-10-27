import assert from "node:assert/strict";

const base = process.env.SMOKE_BASE_URL || "http://127.0.0.1:3000";
const page = await fetch(new URL("/", base));
assert.equal(page.status, 200);
const html = await page.text();
assert.ok(html.includes("Caregiver-guided activities") && html.includes("Confirm a favourite"));
assert.ok(html.includes('id="main"') && html.includes('href="#main"'), "Keyboard skip target must exist.");
assert.ok(html.includes("Not medical advice or therapy"));

const health = await fetch(new URL("/api/health", base));
assert.equal(health.status, 200);
const healthBody = await health.json();
assert.equal(healthBody.status, "ok");
assert.equal(healthBody.milestone, "live-planner");
assert.equal(typeof healthBody.liveAgentAvailable, "boolean");

const stylesheet = html.match(/href="([^"\s]+\.css(?:\?[^"\s]*)?)"/);
assert.ok(stylesheet, "Production page must reference its stylesheet.");
const css = await fetch(new URL(stylesheet[1].replaceAll("&amp;", "&"), base));
assert.equal(css.status, 200);
assert.ok(css.headers.get("content-type")?.includes("text/css"));
for (const pathname of ["/.env.txt", "/.env.local", "/qloo-private/feasibility-report.md"]) {
  assert.equal((await fetch(new URL(pathname, base))).status, 404, "Private research/config must not be served.");
}
console.log("App HTTP smoke passed: planner, disclaimer, skip target, health response, stylesheet and private-path isolation.");
