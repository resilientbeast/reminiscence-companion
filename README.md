# Reminiscence Companion

A practical activity planner for family caregivers supporting someone living with dementia. Begin with familiar music, films or TV, review related possibilities, and build a short session to share. An activity aid, not medical advice or therapy. Follow the person's lead.

Try the [account-free live demo](https://reminiscence-companion-712638577178.us-central1.run.app/demo): confirm a favourite, explore related activities, review the evidence and build a short session.

## Current status

The [live app](https://reminiscence-companion-712638577178.us-central1.run.app/) now includes a landing page explaining the dementia-caregiver audience and workflow, Clerk signup/login, and private Firestore saved sessions. `/workspace` is authenticated; `/demo` retains the complete temporary planning flow without signup. Saving is explicit, each account can hold 20 sessions, and revision checks prevent silent overwrites from an older tab. The claimed Clerk application is in development mode. See [account setup and verification](docs/hackathon-build/accounts.md) and the [exact released artifact](docs/hackathon-build/deployment.md).

The [public app](https://reminiscence-companion-712638577178.us-central1.run.app/) supports live Qloo search and exact-match confirmation, bounded Gemini tool use, grounded advisory content checks, explicit acceptance, favourite/rejection feedback, before/after ranking evidence, and an ordered two- or three-activity session with start/finish and print controls. Rating-held results cannot enter a session. Missing/failed screening stays visible for caregiver review.

Gemini uses the direct Google provider with `gemini-3.8-flash`. Linux-container and staged Cloud Run checks pass, including the public browser workflow. Observed runs varied, and a timeout correctly used the labelled fallback; no latency promise is made. Independent caregiver review remains further validation. See the [deployment record](docs/hackathon-build/deployment.md) for exact evidence and limits.

New sessions reuse favourites, explicit positive/negative feedback and discovery preferences from this account's saved sessions. The latest saved decision wins for conflicting feedback; new activity lists start empty. Use **Start without saved preferences** for a fresh session. Saving remains explicit, and deleting a saved session removes it from the history used for future sessions. One caregiver workspace currently represents one person.

Search resolves matches after a 500 ms pause in typing, cancels superseded requests, and caches a small number of recent lookups in the open page. Exact-match confirmation is still required. Result and discovery images come only from Qloo-returned HTTPS image URLs, with a placeholder when missing or unavailable. Clerk development mode is the chosen hackathon configuration; migration to production is outside this demo's scope.

Deleting a Clerk account triggers signed-webhook cleanup of its saved sessions. Duplicate deliveries are safe to repeat and failures return a retry status. A minimal hashed deletion marker prevents late saves from recreating deleted data. See [account setup and verification](docs/hackathon-build/accounts.md).

## Local setup

Use Node.js 24.21.0 and npm. From a clean checkout:

```sh
npm ci
npm run check
npm run dev
```

Open `http://127.0.0.1:3000` for development. For the standalone server, bind `HOSTNAME=localhost`, `PORT=3000` and open `http://localhost:3000`. The health route is `/api/health`.

For local source protection, run `npm run hooks:install` once per checkout and `npm run test:guard` to test it. The hook scans staged blobs as well as working assets, rejects private/config paths and known/key-pattern credentials, and never prints credential values. Installation preserves any different existing hook configuration. This does not replace a release secret review.

For a production build:

```sh
npm run build
npm run start
```

With the production server running, `npm run smoke` checks the page, health response, stylesheet and private-path isolation. It is an HTTP check; visual and interaction verification are separate.

Copy `.env.example` to `.env.local` and fill values locally. Obtain a personal Qloo key through the [official developer guide](https://docs.qloo.com/reference/qloo-llm-hackathon-developer-guide). Hackathon keys use the hackathon endpoint. Provider keys and `CLERK_SECRET_KEY` belong only on the server. Clerk's `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is intentionally public; it does not grant backend access. Existing private `.env.txt` research credentials are not automatically loaded by this scaffold.

The hosted guest demo needs no setup. For a local guest demo, configure Qloo and Gemini; Clerk/Firestore are optional unless you want private saved sessions. For accounts, configure Clerk keys and a Firestore project with authorized Application Default Credentials. Register `/api/webhooks/clerk` for only `user.deleted` in that Clerk application's webhook settings, then set `CLERK_WEBHOOK_SIGNING_SECRET` server-side. Never send the signing secret to the browser. Webhook delivery requires an externally reachable URL.

## Gemini setup and integration spike

The adapter uses Google's Gemini API directly through `@ai-sdk/google`, with `gemini-3.8-flash` as the configurable default. Set these values in ignored `.env.local`:

```dotenv
LLM_PROVIDER=gemini
LLM_MODEL=gemini-3.8-flash
GOOGLE_GENERATIVE_AI_API_KEY=
```

Fill the blank key locally using [Google AI Studio](https://aistudio.google.com/apikey). `GEMINI_API_KEY` is also accepted as an alias; the canonical variable above takes priority. Set `LLM_PROVIDER=none` to intentionally disable model calls.

```sh
npm run spike:gemini
```

The live spike permits two model rounds, one synthetic local tool execution, no automatic retries, up to 512 output tokens per round, and a shared 20-second deadline. It makes no Qloo calls and sends no patient information. It prints only status, model and usage metadata; raw errors, headers and credentials are withheld. Missing configuration exits with `not_run` and performs no network request. A missing key or mocked test is not evidence of live model access. The 27 October 2026 live run passed in about five seconds; this is one integration check, not a latency benchmark or proof of application quality.

Offline provider/planner tests inject mock HTTP responses; `npm test` never needs a real model key or spends provider quota.

## Try the live workflow

1. Search an artist, film or show, or choose a preset. Confirm the exact match; similarly named records are shown separately. Teresa Teng resolves through `鄧麗君` in the artist category.
2. Choose categories and an optional film/TV era. Explore possibilities, then inspect Qloo input attribution, category rank and the separate selected position.
3. Accept two or three activities. You can also expand a confirmed favourite and explicitly review it as a starting activity; this is a search match, not a ranked recommendation. Flagged or incomplete checks require explicit review acknowledgement. Unknown/unsupported ratings stay held. Acceptance makes no discovery request.
4. Mark a known favourite, reject a discovery, or skip it for one refresh. Refresh to send those signals/exclusions. Accepted activities remain in place; the before/after summary separates Qloo ordering from model selection.
5. Set activity/time, start the session and follow the person's pace. “Worked well” records an observed response separately from familiarity. Finish or return to planning. Optional Spotify embeds load only on click. YouTube searches include a returned notable song when available; external media availability varies. The user confirmed hearing the Nat King Cole official Spotify preview in the in-app browser. This verifies that preview in that browser, not full tracks or universal playback. The browser print action produced a visually verified one-page PDF. Physical paper output remains unverified.

`POST /api/search` accepts a bounded query and category. `POST /api/plan` validates cultural IDs and explicit policy. The agent-facing recommendation tool cannot change signals, exclusions or policy. Compact current-run keys map to actual Qloo IDs in server code; selection must stay inside the returned pool. Source facts and provenance never come from final model prose. Content flags must quote a returned field and an exact evidence excerpt.

Each run shares a 20-second deadline across up to six Qloo HTTP requests including one possible transient retry, three agent rounds, and one separate screen call. Model retries are disabled; output caps are 1200 tokens per agent round and 2200 for screening. Gemini uses `low` thinking: the configured model rejected `minimal` in a live check. A shorter planning cutoff reserves fallback/screen time. Failed models are not called again for fallback screening. Fallback reuses available results, fetches only missing categories within the same budget, and interleaves category source order.

Per-process admission limits allow two concurrent plans/sixty plans per hour and four concurrent searches/three hundred per hour. These counters contain no user identifiers, reset on restart and multiply across instances; they are not a global quota or spending cap. Public deployment still requires verified provider spending controls. Public cultural metadata is capped at five hundred cache entries with a fifteen-minute lifetime.

With the production server running, `npm run smoke:live` spends provider quota on five preset searches and two bounded planning runs. It checks era bounds and rejection/accepted-item exclusions. Responses are saved only in ignored `qloo-private/`; terminal output is summary metadata. A fallback pass does not establish successful model selection or screening; inspect the reported mode and completed screens. The health endpoint reports configuration readiness, not an upstream availability guarantee.

## Policy boundaries

- The model-facing recommendation input accepts only category and bounded pool size. Signals, exclusions and caregiver constraints are bound by code.
- Film ratings default to G/PG; TV uses TV-G/TV-PG. Unknown/legacy ratings remain held. Music has no verified rating or era assurance.
- Review, screening status, familiarity and observed feedback have different meanings. Only explicitly accepted, rating-eligible cards enter a session.
- The guest demo stays in browser memory. Logged-in caregivers can explicitly save favourites, accepted activities, preferences and feedback in their private Firestore workspace and reopen/update/delete them across devices. Unsaved changes and discovery traces clear on page refresh. Request bodies are not logged. Leave recipient names, health details and care notes out of the app.
- Qloo input influence is not a probability of enjoyment or evidence of a personal memory. A plain LLM was competitive in exploratory research; no superiority claim is made.

## Container

With a running Docker engine:

```sh
docker build -t reminiscence-companion .
docker run --rm -p 8080:8080 reminiscence-companion
```

The container uses standalone Next.js, runs as UID 1001 and binds port 8080. Build, HTTP smoke, private-path/environment isolation and real Qloo/Gemini checks passed. Inject keys at runtime, for example with `--env-file .env.local`; none are baked into the checked image. `.dockerignore` excludes secrets/private research. The local `reminiscence-preview` container uses `127.0.0.1:3000`; stop it before starting another server on that port.

Cloud Run is live in `us-central1`, with a project-specific Gemini key and pinned Secret Manager versions. A US$3 monthly Gemini cap and US$10 project billing alerts are configured; they are not an exact spending ceiling. The user kept the existing billing mode despite Google's prepay migration notice, which remains an availability risk. See the [release record](docs/hackathon-build/deployment.md) and [approved plan](docs/hackathon-build/release-plan.md). No automatic shutdown or Devpost submission is scheduled.

## Build documents

- [Implementation checklist](docs/hackathon-build/checklist.md)
- [Build notes and verified limitations](docs/hackathon-build/build-notes.md)
- [Workflow evidence and participant review protocol](docs/hackathon-build/task-review.md)

Research responses, comparisons and the recorded evidence replay are private, Git-ignored artifacts under `qloo-private/`. They are not needed for the app build and must not be copied into public assets.

## Verification

`npm run check` runs TypeScript, boundary tests using synthetic entities, and a credential check against public source/assets. `npm run build` verifies production compilation separately. These checks do not establish browser accessibility, live provider integration, clinical suitability or audible playback. Record those checks when the corresponding feature is built.

## License

[MIT](LICENSE). Third-party SDK, API, media and data terms apply separately.
