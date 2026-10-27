# Build notes

## 27 October 2026 — spec tightened; foundation started

The canonical spec now defines binding policy, review/screening/familiarity states, a completed accepted session, independent fallback, browser-side diffs, typed source evidence and a fair evaluation protocol. It corrects the video priority and keeps judge access through November 7 noon Singapore time.

The user asked to defer provider/model choice until after the foundation milestone. No model key is required for this milestone. Qloo credentials already exist in a private local `.env.txt`; do not copy them into documentation or source.

Local prerequisites observed:

- Node.js 24.21.0; npm 11.19.0.
- Google Cloud SDK installed. No account/project mutation or deployment performed.
- Docker CLI installed, but the Docker Desktop Linux engine pipe is unavailable. Container build/run is unverified until an engine is available.
- Browser automation previously failed at startup because its sandbox launcher could not enumerate a locked BitLocker volume. Do not claim visual or audible-playback verification from HTTP checks.

Package versions were selected from official package metadata and pinned in the project lockfile: Next.js 16.4.3, React 19.3.1, TypeScript 7.0.2, Tailwind 4.3.3 and Zod 4.6.7. Provider packages are not installed until the provider spike.

## Foundation verification

Story checked: open the foundation homepage → receive the production-rendered page and stylesheet → call the local health route → confirm that no live agent is represented as available. This milestone does not exercise live Qloo or model integration.

| Boundary/check | Result | Evidence |
| --- | --- | --- |
| Reproducible dependencies | Passed | `npm ci --no-audit --no-fund` installed 48 packages from the lockfile. |
| TypeScript | Passed | `npm run typecheck` completed without errors. |
| Policy contracts | Passed | `npm test`: 9 tests, 9 passed. Tests cover exclusions, model argument restrictions, movie/TV separation, no music era filter, unknown ratings, invalid state and acceptance. Test entities are synthetic. |
| Public-source/client credential scan | Passed | `npm run check:secrets` scanned public source and built static assets without printing private values. |
| Production compilation | Passed | `npm run build` compiled page and health route, then staged the standalone server with static/public assets. |
| Standalone runtime | Passed | `.next/standalone/server.js` started on `127.0.0.1:3000`. |
| HTTP smoke | Passed | Homepage/disclaimer/skip target, exact health response, stylesheet HTTP 200, and HTTP 404 for `.env.txt` and private research paths. |
| Git exclusions | Passed | `.env.txt` and `qloo-private/` are ignored; `.env.example` remains available to source control. |
| React source review | Completed | Server-rendered components, stable list keys, semantic headings/list, keyboard skip link, visible focus, responsive CSS and reduced-motion rule. This is source inspection, not an accessibility audit. |
| Container image | Not verified | Docker Desktop Linux engine was not available. The Dockerfile targets the staged standalone output; build/run is a release requirement. |
| Browser visual/interaction QA | Not verified | Browser automation launcher previously failed on a locked BitLocker volume. An app-preview tab was queued through Codex, which does not establish visual verification. |

The local Git repository is initialized; no remote source publication, deployment or Devpost submission occurred. The public preview contains no copied Qloo responses, no actual patient data and no model calls. The existing recorded research replay remains separate under the ignored private folder.

Next implementation milestone: live Qloo search and confirmation with bounded typed adapters. The subsequent Gemini decision is recorded below. Do not interpret the completed foundation as a complete MVP.

## Gemini selection and adapter preparation

The user selected Gemini. The app uses the direct Google API through `@ai-sdk/google`; no Vercel Gateway account is required. Default model: `gemini-3.8-flash`, listed as stable in Google's current model catalogue, with an `LLM_MODEL` override. This is a configuration choice, not evidence that the user's key has access to that model.

Pinned AI SDK 7.0.154 and Google provider 4.0.106. Implementation follows their installed source/docs, including the current `ToolLoopAgent`, `isStepCount`, `inputSchema`, and direct `createGoogle().chat()` APIs. The adapter is guarded by `server-only`.

`npm run spike:gemini` performs a synthetic structured-tool round trip: at most two model rounds, one local tool execution, no retries, 512 output tokens per round and a shared 20-second deadline. It makes no Qloo calls and prints no raw response, prompt, key, request headers or upstream error body.

Five offline provider checks cover configuration, no-key/no-network behaviour, direct HTTP serialization and round-trip result/signature preservation, no automatic retry, and cancellation. They use injected responses and synthetic values. Together with the nine policy tests, all fourteen checks passed. Real access was subsequently verified as recorded below.

Official references checked: [Google model catalogue](https://ai.google.dev/gemini-api/docs/models), [Gemini 3.8 Flash](https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash), and [AI SDK direct Google provider](https://ai-sdk.dev/providers/ai-sdk-providers/google-generative-ai). The local key should be entered in ignored `.env.local` as `GOOGLE_GENERATIVE_AI_API_KEY`; keep it out of chat.

### Live provider verification

After the user confirmed the key was added, it was found in private `.env.txt` and copied into the blank canonical entry in ignored `.env.local`, preserving other settings. No credential value was printed. The authenticated Google model catalogue returned HTTP 200 and included the configured `gemini-3.8-flash` model.

The actual SDK probe passed: two model rounds, one local tool execution, validated tool output, 321 input tokens, 90 output tokens and 5016 ms. Sanitized metadata is retained privately in `qloo-private/gemini-spike-result.json`. This establishes a basic real structured-tool round trip, not completed Qloo planning, content-screen quality or caregiver usefulness. No Qloo or personal data was used in this probe.

Production rebuild initially hit a Windows lock because the prior standalone preview was still running. The task-owned preview was stopped and the rebuild passed. Staging removes any environment files Next might copy, and `npm start` explicitly loads the root private runtime file rather than bundling it. Account quota/spend settings and Docker engine verification remain release checks.

## Live application implementation and verification

The implemented story is: confirm a cultural favourite → request live Qloo candidates through Gemini tools → inspect source attribution/advisory notes → accept activities → reject and refresh discoveries without moving accepted cards → start, observe and finish a session. No source publication, cloud deployment, account mutation or submission occurred.

The app uses server-only `lib/qloo.ts` and `lib/planner.ts`, strict POST input schemas, direct Google `ToolLoopAgent`, a current-run pool and server-mapped compact selection keys. The model cannot provide raw filters, signals or exclusions. Source facts, rank, rating gates and attribution are copied in code. Screening must cite an exact returned field/excerpt. Unknown/legacy ratings stay held; missing/failed/insufficient screening remains for explicit review. Raw influence scores live in a source drawer. Confirmed favourites retain search provenance and require explicit review before becoming starting activities.

One shared 20-second budget covers up to six Qloo HTTP calls including at most one transient retry, three agent rounds and one screen call. Model retries are disabled. Agent/screen output limits are 1200/2200 tokens. A 14-second planning cutoff reserves remaining time for fallback/screening. The Qloo fallback reuses returned records, requests only missing categories, and never re-invokes a failed model. There is no guaranteed latency or guaranteed number of usable results.

Live verification initially found two implementation issues: Next's internal localhost URL differed from the incoming browser Host, so same-origin checks were corrected to compare incoming Host; the model rejected `minimal` thinking with HTTP 400, so it uses `low`. Full UUID-heavy selection was also too slow for the planning cutoff; short keys now map back to validated Qloo IDs in server code. These were real failures, not successful integration runs.

| Check | Actual evidence |
| --- | --- |
| Five-preset resolution | `/api/search` resolved exact expected kinds/names for Sinatra, Sound of Music, I Love Lucy, Lata Mangeshkar and 鄧麗君. The three English presets also passed browser confirmation. |
| API feedback boundaries | Two live planning requests kept film/TV years within 1940–1979, included rejected/accepted exclusions and omitted those IDs from new discoveries. These initial runs used honest fallback and do not establish successful model selection. Private record: `qloo-private/live-app-smoke.json`. |
| Tuned real agent + screen | Three Qloo requests, two real agent rounds, one screen, 15305 ms, six pool-validated cards, six completed checks; two cards had advisory flags. Private record: `qloo-private/live-planner-tuning.json`. |
| Browser data flow | Live API results rendered with source names, ranks and exact advisory excerpts. Two accepted activities stayed ordered across a rejection/refresh. The later run reported 3 Qloo / 2 agent / 1 screen in 15.7 seconds. |
| Visible feedback | Nat King Cole and Ella Fitzgerald stayed accepted; Dean Martin was rejected and disappeared after refresh. The change panel separately displayed two Qloo category-rank changes and one selected-position change, without asserting causality. |
| Finished session | Browser start, observed Worked well, keyboard finish and return controls worked. No rejected item entered the accepted output. |
| Responsive/browser checks | At 390 px, DOM page width was 375 px with no horizontal overflow. Desktop/mobile screenshots were inspected. A tall sticky session panel needed bounded internal scrolling; mobile and print remove that height constraint. No browser error/warning logs were captured during the checked workflow. This is not an accessibility audit or caregiver task study. |
| Printing/playback | Print action timed out in IAB; no actual print preview/output was verified. Print CSS and click-to-load official Spotify iframe are implemented. Audible playback remains unverified. External YouTube searches are generated from returned metadata, including notable songs when available. |
| Build and security | TypeScript, synthetic boundary/provider/planner tests, credential scan and production standalone build passed. `.env*`/private research stay ignored; private paths return 404. No keys or request/session bodies are logged. |

Implementation deviations still visible against the fuller spec: explicit search submit/preset prefill instead of search-as-you-type, no search-row artwork, and separate favourite presets rather than a one-tap multi-anchor persona. These do not prevent the demonstrated main workflow and must not be described as shipped features. Print output, audible playback, axe/Lighthouse review, caregiver/proxy study, fair comparison, Docker build/run, actual provider quota/spend controls and external deployment remain later verification work.

The local preview is `http://127.0.0.1:3000/`. Screenshots/provider records under `qloo-private/` remain private and excluded from release assets.

## Container and release preparation

The user asked to continue and selected preparation of a new dedicated Cloud project. The CLI has an active account but no selected project. Its four existing accessible projects appear unrelated; none were changed. The one open billing account is named My Billing Account. The proposed new project/resources and US$10 planning budget are in `release-plan.md`; billing linkage, credential provisioning and public access require the concrete approval recorded there. The amount is not represented as a guaranteed ceiling. Gemini's actual project-level control is not configured yet.

Docker Desktop was installed but stopped; `docker desktop start --detach` brought up engine 29.8.2. The multi-stage Linux build succeeded without provider credentials. The checked image ID is `sha256:5d162a0ec504c8d536496e350b9f41cb6d02931ce653e2a79091f505094ccb40`. Container HTTP smoke passed; UID was 1001; local config/private research paths and baked provider environment values were absent. A no-key search returned the expected redacted 503.

After runtime-only key injection, the same image resolved three demo anchors and completed a real mixed-category run: six candidates, three Qloo requests, two agent rounds, one screen, six completed checks, 12935 ms. Private record: `qloo-private/container-live-smoke.json`. This is an integration observation, not a latency benchmark. The temporary smoke containers were stopped. The current preview is the task-owned `reminiscence-preview` container at `127.0.0.1:3000`; its environment contains runtime keys and must never be dumped into logs or shared diagnostics.

Release hardening added admission counters with no user identifiers (two concurrent/sixty hourly plans; four concurrent/three hundred hourly searches), fifteen-minute metadata expiry, and a local pre-commit guard. Thirty offline tests pass, including admission of ten sequential six-search/three-plan sessions, busy/hourly boundaries and safe release. The staged guard rejected both a force-staged private fixture and a synthetic credential present only in a staged blob; it used an isolated index and did not alter the real index. The first guard run exposed an empty-directory cleanup error, corrected to non-recursive `rmdir`; the subsequent test passed. Cross-checkout hook installation is explicit and does not overwrite other hook settings.

The developer rehearsal is documented as implementation evidence in `task-review.md`, not as an independent caregiver/proxy study. Actual print output, audible playback, accessibility audit, external-device flow, real provider quota/spend controls, cloud deployment and public source/submission remain outstanding. No claim of beating a plain LLM has been added.

## Approved public Cloud Run deployment

The user explicitly approved creating the dedicated project, linking the named billing account, creating a project-scoped Gemini key, storing the keys in Secret Manager, and staged deployment with public access after verification. Project `reminiscence-qloo-20261027`, registry and runtime identity were created. The new key is restricted to `generativelanguage.googleapis.com`; existing local keys and unrelated projects were not changed. A real structured-tool probe using the new key passed in 6626 ms.

Project-only US$10 billing alerts were created for the demo period, with 50/90/100% thresholds. The initial budget command lacked a quota-project setting; adding an explicit billing-project flag resolved it without changing the user's global CLI configuration. AI Studio required sign-in and import of the new project; the user signed in, and only that project was imported. A US$3 monthly Gemini cap was saved and visibly verified. Google requested an account-wide prepay migration/credit purchase; the user chose to retain current billing. No payment-mode change, purchase or automatic reload was performed. The notice remains an availability risk, and cap enforcement can lag.

Source was committed locally, with the credential guard passing. Initial revision `d3bb75c` was deployed privately by immutable image digest. Anonymous HTTP received 403. Authenticated five-preset checks, page/CSS/health/private-path checks and two real mixed-category agent/feedback runs passed (11848 and 13496 ms, six completed metadata checks each). A hosting-neutral footer was then committed and deployed as revision `reminiscence-companion-347a51d`, from source `347a51de37920822b8e91f572479a76672094f98` and image digest `0beb0b3e459d29b7d1cf5f1fd70c2f069139d5ff8b53222ed98797a05c3de6f4`.

Actual runtime identity, pinned secret versions 1, 1 CPU/512 MiB, concurrency 2, min 0/max 1, 30-second platform timeout and the project alert resource were checked before enabling anonymous invoker access. Public HTTP smoke passed; nine HTML/JS/CSS assets contained none of the configured credential values. The checked revision's error-log query returned no entries.

The public browser flow passed confirmed-favourite review/acceptance, exploration with the accepted anchor excluded, positive favourite feedback, rejection, reordering, refresh, activity/minute edits, start, observed feedback and finish. Actual trace parameters matched two signals and three exclusions, with three Qloo HTTP 200s; a TV-MA card's accept control was disabled. One refresh used labelled timeout fallback (17.2 s), retaining accepted order. A warm retry completed in agent mode in 17.3 s. No throughput, success-rate or sub-five-second claim follows from these samples.

The official Spotify embed rendered the correct Nat King Cole identity and preview list only after clicking load. Audible playback is still unverified. The hosted page fit an emulated 390 px phone viewport without horizontal overflow; no browser warnings/errors were captured. Physical-device, accessibility, actual print/audio and independent caregiver checks remain outstanding. Private summaries/screenshots stay under ignored `qloo-private/`.

The public app is [Reminiscence Companion](https://reminiscence-companion-712638577178.us-central1.run.app/). The detailed record is `deployment.md`. Availability is intended through 7 November noon Singapore, subject to upstream/billing/quota conditions; no automatic shutdown or submission is scheduled. Source repository publication and Devpost submission remain separate work. The later guard-test directory-creation fix and documentation changes do not alter the deployed application.

## Multi-user caregiver accounts — 27 October 2026

The user requested a clear dementia-caregiver landing page and Clerk signup/login, then confirmed private saved sessions across devices and creation of a dedicated Clerk development application. This supersedes the original no-account/browser-only scope. The complete temporary guest demo remains at `/demo`; `/workspace` and saved-session APIs are authenticated.

The Clerk application was initialized without exposing keys and then claimed/linked after the user completed authorization. Firestore Standard Native `(default)` was created in us-central1 in the existing dedicated project; the runtime identity received database access and access only to the new Clerk secret resource. Existing Qloo/Gemini secret references, resource limits and spend settings were retained. Builds ran in Cloud Build with local Docker stopped.

Verification exposed and resolved three boundaries: public Clerk configuration needed a runtime alias for credential-free image builds; Firestore transactional writes needed the SDK kept as a server-external package; real Qloo search anchors needed explicit field projection into the strict save contract. The final build passed 35 offline checks, production compilation, 15 actual two-account access checks, browser login/search/discovery/review/save/finish/reload/reopen, HTTP checks and 12-asset secret checks. The finished two-activity session retained order, duration, phase and observed feedback after clearing browser memory. The development test account was signed out afterward.

Source `209485e1ebfda037850c37f83fc91011cc6f1216`, immutable image digest `5b757597dbb83503a64e7dcf469c5406a998417a5697f7d65173f2e16f2a3b11`, revision `reminiscence-companion-accts-209485e` now receives 100% of traffic. The promotion command succeeded but its private helper expected the wrong output shape; a separate service read confirmed traffic, image and identity, and the public URL returned the new page/configuration with anonymous session access 401. No second promotion was needed.

Observed responsive layouts at 746/1265 px had no horizontal overflow. A requested 390 px automation override did not apply, so a fresh phone-size check remains unverified. Development Clerk limits, manual session deletion before account deletion, caregiver validation and existing print/audio limits are documented in `accounts.md`. Public source publication and Devpost submission remain separate work.
