import assert from "node:assert/strict";

const base = process.env.SMOKE_BASE_URL || "http://localhost:3000";
const page = await fetch(new URL("/", base));
assert.equal(page.status, 200);
const html = await page.text();
assert.ok(html.includes("caregivers of people living with dementia") && html.includes("Create your account"));
assert.ok(html.includes('id="main"') && html.includes('href="#main"'), "Keyboard skip target must exist.");
assert.ok(html.includes("Not medical advice or therapy"));
const demo = await fetch(new URL("/demo", base));
assert.equal(demo.status, 200);
assert.ok((await demo.text()).includes("Confirm a favourite"));
for (const pathname of ["/api/sessions", "/api/sessions/11111111-1111-4111-8111-111111111111"]) {
  const response = await fetch(new URL(pathname, base));
  assert.equal(response.status, 401, "Private session data must require login.");
  assert.equal((await response.json()).code, "sign_in_required");
}

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
