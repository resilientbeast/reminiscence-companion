# Reminiscence Companion

A caregiver-guided activity planner built around confirmed favourites and optional related cultural discoveries. An activity aid for caregivers. Not medical advice or therapy. Follow the person's lead.

## Current status

The local app now supports live Qloo search and exact-match confirmation, bounded Gemini tool use, grounded advisory content checks, explicit acceptance, favourite/rejection feedback, before/after ranking evidence, and an ordered two- or three-activity session with start/finish and print controls. Rating-held results cannot enter a session. Missing/failed screening stays visible for caregiver review.

Gemini uses the direct Google provider with `gemini-3.8-flash`. A real Linux-container run completed in 12.9 seconds with two agent rounds and one content screen. This is one integration observation, not a latency promise. Container build/runtime checks pass; caregiver task review, public hosting and submission remain release work. See the build notes for the exact verified scope.

## Local setup

Use Node.js 24.21.0 and npm. From a clean checkout:

```sh
npm ci
npm run check
npm run dev
```

Open `http://127.0.0.1:3000`. The health route is `/api/health`.

For local source protection, run `npm run hooks:install` once per checkout and `npm run test:guard` to test it. The hook scans staged blobs as well as working assets, rejects private/config paths and known/key-pattern credentials, and never prints credential values. Installation preserves any different existing hook configuration. This does not replace a release secret review.

For a production build:

```sh
npm run build
npm run start
```

With the production server running, `npm run smoke` checks the page, health response, stylesheet and private-path isolation. It is an HTTP check; visual and interaction verification are separate.

Copy `.env.example` to `.env.local` and fill server-only values locally. Obtain a personal Qloo key through the [official developer guide](https://docs.qloo.com/reference/qloo-llm-hackathon-developer-guide). Hackathon keys use the hackathon endpoint. Never place a key in a `NEXT_PUBLIC_` variable, browser bundle, public repository or recording. Existing private `.env.txt` research credentials are not automatically loaded by this scaffold.

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
5. Set activity/time, start the session and follow the person's pace. “Worked well” records an observed response separately from familiarity. Finish or return to planning. Optional Spotify embeds load only on click. YouTube searches include a returned notable song when available; external media availability varies. Actual print output and audible playback remain unverified.

`POST /api/search` accepts a bounded query and category. `POST /api/plan` validates cultural IDs and explicit policy. The agent-facing recommendation tool cannot change signals, exclusions or policy. Compact current-run keys map to actual Qloo IDs in server code; selection must stay inside the returned pool. Source facts and provenance never come from final model prose. Content flags must quote a returned field and an exact evidence excerpt.

Each run shares a 20-second deadline across up to six Qloo HTTP requests including one possible transient retry, three agent rounds, and one separate screen call. Model retries are disabled; output caps are 1200 tokens per agent round and 2200 for screening. Gemini uses `low` thinking: the configured model rejected `minimal` in a live check. A shorter planning cutoff reserves fallback/screen time. Failed models are not called again for fallback screening. Fallback reuses available results, fetches only missing categories within the same budget, and interleaves category source order.

Per-process admission limits allow two concurrent plans/sixty plans per hour and four concurrent searches/three hundred per hour. These counters contain no user identifiers, reset on restart and multiply across instances; they are not a global quota or spending cap. Public deployment still requires verified provider spending controls. Public cultural metadata is capped at five hundred cache entries with a fifteen-minute lifetime.

With the production server running, `npm run smoke:live` spends provider quota on five preset searches and two bounded planning runs. It checks era bounds and rejection/accepted-item exclusions. Responses are saved only in ignored `qloo-private/`; terminal output is summary metadata. A fallback pass does not establish successful model selection or screening; inspect the reported mode and completed screens. The health endpoint reports configuration readiness, not an upstream availability guarantee.

## Policy boundaries

- The model-facing recommendation input accepts only category and bounded pool size. Signals, exclusions and caregiver constraints are bound by code.
- Film ratings default to G/PG; TV uses TV-G/TV-PG. Unknown/legacy ratings remain held. Music has no verified rating or era assurance.
- Review, screening status, familiarity and observed feedback have different meanings. Only explicitly accepted, rating-eligible cards enter a session.
- Accepted cards and before/after orders stay in browser memory and clear on page refresh. The server caches only bounded public cultural metadata; it does not retain session records or log request bodies. Leave recipient names, health details and care notes out of search.
- Qloo input influence is not a probability of enjoyment or evidence of a personal memory. A plain LLM was competitive in exploratory research; no superiority claim is made.

## Container

With a running Docker engine:

```sh
docker build -t reminiscence-companion .
docker run --rm -p 8080:8080 reminiscence-companion
```

The container uses standalone Next.js, runs as UID 1001 and binds port 8080. Build, HTTP smoke, private-path/environment isolation and one real Qloo/Gemini run passed. Inject provider keys at runtime, for example with `--env-file .env.local`; none are baked into the checked image. `.dockerignore` excludes secrets/private research. The current local preview uses a task-owned `reminiscence-preview` container bound only to `127.0.0.1:3000`; stop it before starting another server on that port. Actual provider budget/quota settings and external deployment remain release requirements. See the [prepared Cloud Run plan](docs/hackathon-build/release-plan.md); no public deployment is claimed.

## Build documents

- [Implementation checklist](docs/hackathon-build/checklist.md)
- [Build notes and verified limitations](docs/hackathon-build/build-notes.md)
- [Workflow evidence and participant review protocol](docs/hackathon-build/task-review.md)

Research responses, comparisons and the recorded evidence replay are private, Git-ignored artifacts under `qloo-private/`. They are not needed for the app build and must not be copied into public assets.

## Verification

`npm run check` runs TypeScript, boundary tests using synthetic entities, and a credential check against public source/assets. `npm run build` verifies production compilation separately. These checks do not establish browser accessibility, live provider integration, clinical suitability or audible playback. Record those checks when the corresponding feature is built.

## License

[MIT](LICENSE). Third-party SDK, API, media and data terms apply separately.
