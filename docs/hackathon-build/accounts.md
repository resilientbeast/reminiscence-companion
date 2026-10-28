# Caregiver accounts and saved sessions

User-authorized scope on 27 October 2026: a clear landing page for caregivers of people living with dementia; Clerk signup/login; private sessions that reopen across devices. The original browser-only MVP remains available as an account-free live demo.

## Routes and access

- `/`: audience, practical purpose, four-step workflow, product illustration, Qloo/Gemini limitations and account/demo entry points.
- `/sign-up`, `/sign-in`: Clerk components with caregiver context. Successful authentication opens `/workspace`.
- `/workspace`: server-authenticated personal session library and planner.
- `/demo`: complete temporary planning flow without account storage.
- `/api/search`, `/api/plan`: authenticated personal planning; `/api/demo/search`, `/api/demo/plan` support the temporary demo using the same bounded planner.
- `/api/sessions`: authenticated list/create. `/api/sessions/[id]`: authenticated read/update/delete. Ownership comes exclusively from verified Clerk authentication, never the request body or URL.
- `/privacy`: actual data handling, deletion controls and current limitations.

## Storage boundary

Firestore Standard Native database `(default)` in `us-central1`, inside `reminiscence-qloo-20261027`. The existing runtime service identity has `roles/datastore.user`; there is no client Firestore SDK or public database access. Session documents live under a SHA-256 namespace derived from the verified Clerk user ID. The hash is a namespace, not a substitute for authentication.

Explicit Save session retains confirmed cultural favourites, accepted activities/source context, feedback, discovery preferences, durations and planning phase. No recipient-name, diagnosis, care-note or free-text session-title field is provided. Discovery pools, provider response dumps and run traces are excluded. Titles are derived from cultural item names. Cloud operators with authorized access can administer data; this is not end-to-end encryption.

At most 20 sessions per account, enforced transactionally alongside create/delete counts. Each update carries a positive revision; mismatches return 409 and leave the saved record unchanged. An unauthorized account sees the same 404 for nonexistent and other-account session IDs. Deleted records are removed from the account's library. Saved metadata represents the earlier accepted activity; reopening is not a fresh Qloo lookup or a new safety check.

Unsaved changes stay in the page. Save controls show dirty/saved status, and leaving with unsaved personal work triggers the browser's unload prompt. Opening another session asks before replacing unsaved changes. Guest sessions have no server persistence.

## Configuration and local setup

`@clerk/nextjs` 7.9.21, `@google-cloud/firestore` 9.4.0, existing Next.js 16.4.3. Keys are pinned in the lockfile. Use the current [Clerk Next.js quickstart](https://clerk.com/docs/nextjs/getting-started/quickstart).

Add local keys only to ignored `.env.local`: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`. For credential-free image builds, inject that same public key at runtime as `CLERK_PUBLISHABLE_KEY`; the server passes it explicitly to the provider and middleware. Next.js otherwise freezes public environment values during compilation. Set sign-in/up routes and redirect defaults as shown in `.env.example`. For saved sessions, set `GOOGLE_CLOUD_PROJECT` and optional `FIRESTORE_DATABASE_ID`; local storage access requires authorized Google Application Default Credentials, while Cloud Run uses its runtime identity. Never add a downloaded service-account key to the repository.

The root layout reads runtime-injected account configuration. Missing Clerk configuration leaves the public landing/demo usable; private APIs fail closed with 503. Anonymous private API requests return 401. Cloud builds exclude `.env*`, `.clerk`, private research, node_modules and local build output. The published Clerk key is intentionally public; the secret remains runtime-only in Secret Manager.

## Development-stage limits

The requested Clerk development application was initialized, then claimed and linked as `reminiscence-companion` after the user completed Clerk authorization. The claimed application's local secret still matches the Secret Manager version. Development keys/test mode and Clerk's visible development banner are intentional for the hackathon. The user explicitly decided to keep development mode; production migration is not a demo milestone. Development email quotas apply, so integration checks use Clerk's reserved test addresses, which do not send mail. See [Clerk testing documentation](https://clerk.com/docs/guides/development/testing/test-emails-and-phones).

Deleting a Clerk account triggers a signed `user.deleted` webhook at `/api/webhooks/clerk`. A Firestore transaction removes saved sessions and retains only a hashed namespace marker with `deleted: true` and count zero. This prevents in-flight or late saves from recreating session data. Duplicate deliveries are safe, and storage failures return 503 for delivery retries. Cleanup is asynchronous. No organization/team sharing, recipient profiles, clinical records or continuous backups are implemented. New-session preference carry-over is derived from this account's saved sessions, using the latest saved decision for conflicting feedback and the latest saved discovery settings. Starting without remembered preferences is available; accepted activities never carry automatically. Global per-process discovery limits and provider spend controls still apply; accounts do not create unlimited capacity.

## Cleanup release verification — 28 October 2026

Current runtime revision is `reminiscence-companion-accts-d50a1d9`. The handler uses Clerk's signature verifier, preserves signed bytes, bounds bodies to 64 KiB and logs no event bodies or identifiers. The endpoint subscribes only to `user.deleted`; its signing secret is pinned in Secret Manager. Forty-seven offline tests and the remote Linux build passed. Fifteen account-access checks passed again after the write guard changed.


The final public browser rehearsal rendered signup, completed reserved email-code login, reopened the two-activity finished QA session, saved a new observation and verified both observations after a full reload/reopen. New session imported saved preferences with zero accepted activities, and the fresh-start bypass cleared imports while preserving the saved record. The QA account was signed out. New-password signup and social OAuth completion were not exercised.

## Earlier preference/search verification — 28 October 2026

Revision `reminiscence-companion-accts-cd05d9a`, source `cd05d9a0aff5520c30913b49eba9a1ad96662e07`, is live at 100% traffic. TypeScript, 41 offline checks and production compilation passed. Six hosted checks verified saved preferences/settings with no carried activities, memory isolation between two Clerk accounts, latest rejection precedence, removal of test history restoring the previous memory, and reachable artist/film images. Temporary records were removed and test API sessions revoked.

The browser signed in with the reserved QA account and saw its saved Sinatra favourite and Nat King Cole taste signal in a fresh planner, with zero accepted activities. Both New session and Start without saved preferences worked; the latter left the saved record intact. The QA account was signed out afterward. Automatic search handled rapid query changes without showing stale Sinatra matches for Lata Mangeshkar, and all five returned Qloo images loaded. Exact-match confirmation is still required. HTTP smoke and 12 application-asset credential checks passed on the tagged preview; public HTTP smoke, traffic/image and runtime identity checks passed after promotion. Local Docker stayed stopped.

Memory uses at most 20 saved records, retaining up to six confirmed favourites, 12 additional positive signals and 100 rejections. Latest saved state resolves conflicts, so unsaved clicks never alter later sessions. Deleting a record removes it from the derived history; another record can still retain the same preference. A fresh start bypasses memory for that session without deleting history. Current workspaces represent one person, and profiles/team sharing remain separate proposed work.

The user confirmed hearing the official Nat King Cole Spotify preview in the in-app browser. This verifies one preview in that browser, not full songs, all artists or all regions. At this earlier checkpoint, print and a fresh phone-size check were unverified; the final rehearsal subsequently verified print-to-PDF and a simulated 390 px layout. Physical-device/accessibility review and independent caregiver validation remain unverified.

## Earlier account-stage verification record

TypeScript and 35 offline tests passed, including ownership namespace separation, held/unaccepted/duplicate activity rejection, field-smuggling rejection, invalid eras/conflicting feedback, required revisions and conversion of real-shaped Qloo anchors before saving. A credential-free production build plus runtime-injected-key HTTP smoke passed. Local browser checks showed the explicit caregiver/dementia landing page, Clerk signup component and successful reserved-account login. Cloud upload inventory excluded credentials and private files.

Fifteen hosted checks passed with two actual development Clerk accounts on revision `reminiscence-companion-accts-f12648c`: anonymous list 401; owner create 201; owner list/read/update/delete 200; other-account GET/PUT/DELETE 404; attempted ownership override 400; stale revision 409; deleted record 404. Fixtures were deleted and the test API sessions revoked. Firestore must remain a server-external package in Next.js: the bundled build could read but failed its first transactional write; externalizing the SDK resolved the hosted write and all isolation checks.

The browser test also caught extra search-record fields reaching the strict saved-anchor contract. An explicit projection now retains only the intended anchor fields; the corresponding regression test passes.

Final revision `reminiscence-companion-accts-209485e`, source `209485e1ebfda037850c37f83fc91011cc6f1216`, repeated all 15 hosted account-isolation checks successfully. The browser signed in through Clerk email-code verification, resolved and explicitly reviewed Sinatra, saved it, ran authenticated live Qloo/Gemini discovery, accepted Nat King Cole, started the two-activity session, marked an observed response, finished and saved changes. A full page reload cleared the working planner; opening the saved record restored both activities, order, ten-minute duration, finished phase and observed feedback. Discovery pools/traces were absent after reopening as intended. The test account was signed out afterward.

Hosted homepage/demo/health/CSS/private-path checks passed. Twelve application-served HTML/JS/CSS assets contained none of the configured Qloo, Gemini or Clerk secret values; the public Clerk key is intentionally allowed. The isolated staged-file guard rejected Google and Clerk secret patterns and accepted Clerk publishable keys. A local connection timeout required a retry; the final HTTP, asset and account-access checks passed.

Observed layout widths of 746 and 1265 px had no horizontal overflow. The requested 390 px browser override did not take effect, so a new phone-size check and physical-device/accessibility review remain unverified. Existing audio/print and caregiver-validation limits still apply.

The release now serves the existing [public URL](https://reminiscence-companion-712638577178.us-central1.run.app/), with 100% traffic on the exact tested immutable image. Public health reports account/storage configuration and anonymous saved-session access returns 401. Local Docker and the local preview server are stopped.
