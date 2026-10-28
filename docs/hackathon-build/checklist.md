# Build checklist


Execution: Cloud Run deployment is live under the user's explicit approval, with verified project cap/alerts, pinned secrets and public workflow checks. See `deployment.md`. The user confirmed one audible Nat King Cole Spotify preview in the in-app browser. Print output, broader playback coverage, physical-phone/accessibility checks and independent caregiver review remain unverified. Source is committed locally but not published; no Devpost submission occurred. The user's choice to retain current billing despite Google's prepay migration notice is recorded as an availability risk.

The demo's key moment: confirm a favourite → inspect source evidence → reject a discovery → see the exclusion → accept and finish a small session. Documentation tracks actual completion, not planned capability.

- [x] **1. Runnable foundation and contracts**
  Spec ref: Sections 3, 5; T1.
  What to build: Next.js/TypeScript/Tailwind scaffold, shared validated state/policy contracts, README, MIT license, env example, secret exclusions, health route and standalone Dockerfile.
  Acceptance: Type-check and production build pass; homepage/health route work without provider keys; contract boundary checks pass; no secrets/private research in served assets. Record Docker availability explicitly.
  Verify: `npm ci`, `npm run typecheck`, `npm test`, `npm run build`, HTTP smoke checks against a running production server. Container build/run is also required before item 9.
  Result: Verified 27 October 2026: clean lockfile install, TypeScript, 9 boundary tests, production build/staging, credential scan and standalone HTTP smoke passed. Docker engine unavailable; container verification remains explicitly required at item 9. Browser visual/interaction checks remain unverified.

- [x] **2. Live Qloo client and anchor resolution**
  Spec ref: Sections 0, 4, 6; T2–T3.
  What to build: Server-only key loading, typed search/Insights adapters and a confirmation UI. Probe an upstream TV rating parameter before using it; metadata lookup initially reuses returned records.
  Acceptance: English and Chinese presets resolve to the correct confirmed kind; ambiguous/unsupported seeds produce a choice/recovery state; errors are redacted and budgets apply.
  Verify: A bounded live smoke command using local credentials; invalid input/auth/empty-result tests without publishing captured responses.
  Result: All five presets resolved to exact expected names/kinds through `/api/search`, including Lata Mangeshkar and 鄧麗君. Browser confirmation checked Sinatra, The Sound of Music and I Love Lucy. The initial build used explicit submit/preset-prefill. The later demo refinement adds debounced search-as-you-type and Qloo-supplied result imagery. Unverified upstream TV-rating filters are not sent; returned ratings are gated in code.

- [x] **3. Gemini tool-calling spike**
  Spec ref: Section 3, T4, Section 10.
  What to build: Gemini is selected; use direct `@ai-sdk/google`, default `gemini-3.8-flash` with an environment override, and pinned AI SDK/provider packages. Configure the local key and run `npm run spike:gemini` for a real validated tool-call round trip.
  Acceptance: Structured tool arguments/result and missing-key behaviour are verified. Record model/version and timeout/call/token limits. Actual account quota/spend settings must be verified before deployment in item 9.
  Verify: One small live spike; do not repeatedly spend quota on unchanged successful cases.
  Result: Passed 27 October 2026 with `gemini-3.8-flash`: authenticated model catalogue HTTP 200, two real model rounds, one validated tool execution, 321 input/90 output tokens, 5016 ms. Five offline provider checks also passed. The full Qloo agent and account-budget configuration remain later work.

- [x] **4. Bounded agent and independent fallback**
  Spec ref: Section 4; T4, T6.
  What to build: Current-run candidate pool, selection validator, immutable policy wrappers, total call/deadline budgets, partial results and a no-LLM fallback.
  Acceptance: Outside-pool IDs and policy overrides cannot enter results; retries and parallel calls count against shared budgets; fallback does not call a missing model.
  Verify: Meaningful boundary/failure-path tests plus one live preset. Do not require an arbitrary number of tool names.
  Result: Live three-anchor run completed in 15305 ms: three Qloo calls, two agent rounds, one completed six-item screen. Browser feedback refresh completed in 15.7 seconds with the same call counts. Earlier cutoff and rejected thinking-setting cases exercised honest fallback. Compact server-mapped candidate keys reduce model output without losing Qloo ID provenance. Offline checks cover pool membership, shared limits, cancellation and no second call to a failed model.

- [x] **5. Review states and grounded evidence**
  Spec ref: Section 5; T6–T7.
  What to build: Typed attribution, source field/excerpt flags, distinct rating/review/screening states and pending-review UI.
  Acceptance: Unknown ratings/screens stay pending; flags cannot invent evidence; incomplete explainability is displayed honestly; nothing is auto-accepted.
  Verify: Review cases covering a G-rated flagged item, a held R rating, TV ratings, no attribution and failed/insufficient screening.
  Result: Live metadata flags rendered with field paths/exact excerpts. Synthetic checks cover a flagged G-rated film, R/unknown/legacy holds, separate TV sets, unavailable attribution, unsupported evidence and insufficient metadata. Flagged/incomplete checks need explicit acknowledgement; no item is auto-accepted. This is advisory metadata screening, not a content-suitability guarantee.

- [x] **6. Feedback, stable accepted cards and changes**
  Spec ref: T5; Section 4 step 7; Section 6.
  What to build: Explicit acceptance, Known favourite, Worked well, rejection and temporary skip; browser-side before/after diff with both source and selected order.
  Acceptance: Accepted cards persist across refresh; rejection excludes, acceptance alone makes no upstream call, and selector changes are not mislabelled as Qloo ranking changes.
  Verify: Browser task plus request/state transition checks; inspect the actual sent parameters.
  Result: Browser accepted Nat King Cole/Ella Fitzgerald, rejected Dean Martin and refreshed. The accepted order persisted, Dean disappeared, and the change panel showed two Qloo category-rank changes separately from one selected-position change. API smoke verified rejected/accepted exclusions. Parameter construction and positive signals are covered offline; no superiority or causal-rank claim is made.

- [ ] **7. Finished session and media links**
  Spec ref: T8–T11.
  What to build: Two/three-item accepted session with activity/order, start/finish, basic print view, public-source media search links and optional click-to-load Spotify.
  Acceptance: A caregiver can complete the workflow; no rejected/unaccepted item appears in the session; no autoplay or music-era claims; unavailable playback has a usable fallback.
  Verify: Keyboard/phone layout and print checks; test audible playback if the browser supports it, otherwise record the limitation.
  Progress: Browser start → Worked well → finish passed; phone width 390 px showed no horizontal overflow. Click-to-load Spotify and source-derived YouTube links are implemented. Confirmed favourites can enter only after explicit review. Actual print output and audible playback remain unverified; the IAB print invocation timed out without a verified preview. Tall desktop sessions now scroll within the sidebar.
  Hosted result: The public flow also passed edits/order/start/observed feedback/finish. The official Spotify iframe rendered the correct artist and preview list on explicit load. Emulated phone layout passed; audible playback, real printed output and physical-device checks are still not claimed.

- [ ] **8. Task review and fair evaluation**
  Spec ref: Section 10; T13.
  What to build: Small caregiver or clearly labelled proxy task review and, time permitting, the matched three-arm comparison.
  Acceptance: Report actual completion/effort/comprehension evidence; category-specific completeness checks; no unasked-filter violations or invented success rates.
  Verify: Freeze prompts/pools and record results, failures, rater counts and limitations. Keep provider data private.

- [ ] **9. Container, public deployment and hardening**
  Spec ref: T12.
  What to build: Build/run the standalone container, configure the chosen Cloud project/secrets, bounded usage controls and external judge access.
  Acceptance: Full flow works from a private phone browser; normal ten-session use is not blocked; no key is in the client/image context; access remains available through November 7 noon Singapore time.
  Verify: Docker build/run, deployed health and full-flow checks, real budget/quota configuration, cold/warm timing and release-commit consistency. Obtain any required external-operation authorization at the concrete deployment boundary.
  Container checkpoint: Docker engine started; Linux image built and runs as UID 1001. No-key smoke/private-file/environment checks passed. Runtime-injected keys completed three live preset searches plus an agent run (3 Qloo, 2 agent, 1 screen; six completed checks; 12935 ms). Thirty offline checks, a ten-session admission-allowance test and isolated staged-guard tests passed. At that checkpoint cloud provisioning was still pending; the later hosted result follows.
  Hosted result: Dedicated project and public revision `347a51d` are deployed. Private five-preset and agent/exclusion checks passed before public access. Public UI and nine-asset credential checks passed; verified cap is US$3/month plus US$10 project alerts. One public refresh used fallback; a warm retry completed in 17.3 seconds. Physical-phone and representative cold-start/throughput checks remain unverified, so this checklist item is not represented as fully audited.

- [ ] **10. Public release and Devpost handoff**
  Spec ref: Hard requirements; T13–T14.
  What to build: Public source with detected MIT license and clean setup, English description, start date, tested public app/repo URLs and supporting screenshots. Video is optional.
  Acceptance: Required form answers are complete and supported by the actual app. No private artifacts or credentials are published. Submission follows the user's explicit authorization and live requirements.
  Verify: Clean install, repository/secret review, public app test and final Devpost readiness check before submission. Record the submitted release and re-test the live URL.

## Account-stage release — 27 October 2026

- [x] Explicit landing-page audience: caregivers of people living with dementia; purpose, four-step workflow, illustrative activities and practical limitations.
- [x] Clerk signup/login, authenticated personal workspace, account-aware navigation and a full guest demo.
- [x] Private Firestore saved-session list/create/reopen/update/delete; owner derived from verified authentication; 20-session cap and stale-update protection.
- [x] Development Clerk application claimed into the user's account; keys remain local/server-side except the intentionally public publishable key.
- [x] 35 offline checks, production build, 15 hosted account-isolation checks, actual browser save/finish/reload/reopen, runtime key injection and asset/credential isolation.
- [x] Cloud Run release `reminiscence-companion-accts-209485e` promoted to 100% of the existing public URL; resource/spend controls retained and local Docker stopped.
- [ ] Account-deletion webhook/purge, fresh phone/physical-device/accessibility checks, caregiver review, print verification and broader playback coverage remain future work. The user explicitly chose Clerk development mode for the hackathon; production migration is out of scope.

See `accounts.md` and `deployment.md` for evidence, exact source/image and limitations.

## Preference and discovery update — 28 October 2026

- [x] New sessions reuse this account's saved favourites, explicit feedback and discovery settings. Latest saved decisions win; activities start empty; saving remains explicit. A fresh-start bypass is available.
- [x] Search after a 500 ms typing pause, category-aware bounded cache, cancellation/stale-result handling and explicit exact-match confirmation.
- [x] Search/discovery images from Qloo-returned HTTPS URLs with missing/failed-image placeholders.
- [x] 41 offline checks, production compilation, six hosted memory/image checks, browser search/images and both New session paths, HTTP and 12-asset secret checks. Tested immutable revision `reminiscence-companion-accts-cd05d9a` receives 100% traffic.
- [x] User-reported audible Nat King Cole official Spotify preview in this in-app browser; no universal or full-track claim.
- [ ] Recipient profiles and shared care teams remain proposed extensions. Profiles require scoped sessions/preferences and migration of existing records; teams additionally require invitations, membership, roles and revocation. Neither is implemented in this release.
