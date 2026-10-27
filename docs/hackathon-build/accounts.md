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

Add local keys only to ignored `.env.local`: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`. Set sign-in/up routes and redirect defaults as shown in `.env.example`. For saved sessions, set `GOOGLE_CLOUD_PROJECT` and optional `FIRESTORE_DATABASE_ID`; local storage access requires authorized Google Application Default Credentials, while Cloud Run uses its runtime identity. Never add a downloaded service-account key to the repository.

The root layout reads runtime-injected account configuration. Missing Clerk configuration leaves the public landing/demo usable; private APIs fail closed with 503. Anonymous private API requests return 401. Cloud builds exclude `.env*`, `.clerk`, private research, node_modules and local build output. The published Clerk key is intentionally public; the secret remains runtime-only in Secret Manager.

## Development-stage limits

The requested Clerk development application has been initialized. Development keys/test mode and Clerk's visible development banner are intentional at this stage. The application should be claimed into the user's Clerk account before ongoing operations; a production Clerk instance/domain and policy review are separate release work. Development email quotas apply, so integration checks use Clerk's reserved test addresses, which do not send mail. See [Clerk testing documentation](https://clerk.com/docs/guides/development/testing/test-emails-and-phones).

Deleting a Clerk account does not automatically purge Firestore sessions yet; delete saved sessions first. No organization/team sharing, recipient profiles, clinical records, automatic cross-session learning, continuous backups or account-deletion webhook is implemented. Global per-process discovery limits and provider spend controls still apply; accounts do not create unlimited capacity.

## Verification record

TypeScript and 34 offline tests passed, including ownership namespace separation, held/unaccepted/duplicate activity rejection, field-smuggling rejection, invalid eras/conflicting feedback and required revisions. A production build passed, including a build with Clerk keys deliberately absent to check runtime configuration. Local browser checks showed the explicit caregiver/dementia landing page and working Clerk signup component. Cloud upload inventory excluded credentials and private files. Hosted multi-account and browser save/reopen checks are pending and must be recorded before claiming completion.
