# Verified Cloud Run release

Latest release verified on 28 October 2026 (Singapore time).

Public app: **[Reminiscence Companion](https://reminiscence-companion-712638577178.us-central1.run.app/)**. The landing page explains its dementia-caregiver audience and workflow. Clerk accounts provide private saved sessions; the complete temporary demo at `/demo` requires no account or API key from the caregiver.

## Current account-stage release

The user authorized Clerk signup/login, a clear landing page, and private sessions that reopen across devices. The development application has been claimed and linked to the user's Clerk account. The user explicitly chose development mode for this hackathon; production Clerk migration is out of scope.

| Setting | Verified value |
| --- | --- |
| Ready / 100% traffic revision | `reminiscence-companion-accts-d50a1d9` |
| Runtime source commit | `d50a1d9f3c0457cb83e448874b1d7d5c358f173e` |
| Immutable image digest | `sha256:2f4a800f245d87fa1b541c2e1f30f82cd6e1743da5fa05dc140492183dd5c8b9` |
| Artifact repository | `us-central1-docker.pkg.dev/reminiscence-qloo-20261027/reminiscence/app` |
| Cloud Build | `fb0eefb7-95d3-42be-8b1b-9eb59bb50b23` |
| Runtime identity | Existing dedicated `reminiscence-runtime` account |
| Secret references | `qloo-api-key:1`, `gemini-api-key:1`, `clerk-secret-key:1`, `clerk-webhook-signing-secret:1` |
| Saved sessions | Private Firestore Standard Native `(default)` database, `us-central1` |
| Resources / spend settings | Existing 1 CPU / 512 MiB, concurrency 2, min 0 / max 1; original project alerts and Gemini cap retained |

Builds ran remotely with local Docker stopped. The cleanup image passed 47 offline checks, production compilation, 15 two-account access checks, five staged signed-cleanup checks and a 12-asset configured-secret scan. A subsequent actual Clerk account deletion delivered the webhook and removed both saved sessions. The signed handler ignores other event types, rejects forged/expired signatures, retries storage failures and retains only a minimal hashed deletion marker to prevent late saves. Public HTTP checks passed after promotion.

The earlier preference/image release `cd05d9a` passed six hosted memory/image checks and browser typeahead, loaded images, remembered New session and the fresh-start bypass. The current browser rehearsal verified a labelled fallback followed by successful agent runs, provider attribution, explicit review before acceptance, feedback refresh and a finished two-activity session. Supporting account checks are recorded in [accounts.md](accounts.md).

The user confirmed audible Nat King Cole Spotify preview playback in the in-app browser. This is human-reported success for one official artist preview; full tracks, every artist, other browsers and regions are not verified. Print session produced a one-page PDF that was rendered and visually checked: both activities, order, time, observed response and completion are present without clipping. Physical paper output remains unverified.

Saving is explicit and account-scoped; updates check revisions and deletion is available. Records do not contain recipient identity/health fields, discovery pools or traces. A simulated 390 px viewport had a 375 px document width with no horizontal overflow; keyboard controls completed the session at that width. Physical-phone testing and independent caregiver review remain future work. Clerk development mode is the chosen demo configuration. No new medical or superiority claims are made.

Public source: [resilientbeast/reminiscence-companion](https://github.com/resilientbeast/reminiscence-companion), branch `main`. Application/runtime files match the deployed image. Anonymous access, GitHub MIT detection and absence of private configuration files were verified.

## Earlier account-free release (historical)

| Setting | Verified value |
| --- | --- |
| Project / region | `reminiscence-qloo-20261027` / `us-central1` |
| Service / ready revision | `reminiscence-companion` / `reminiscence-companion-347a51d` |
| Runtime source commit | `347a51de37920822b8e91f572479a76672094f98` |
| Immutable image | `us-central1-docker.pkg.dev/reminiscence-qloo-20261027/reminiscence/app@sha256:0beb0b3e459d29b7d1cf5f1fd70c2f069139d5ff8b53222ed98797a05c3de6f4` |
| Resources | 1 CPU, 512 MiB, request concurrency 2, minimum 0 / maximum 1 instance |
| Platform / application deadline | 30 seconds / shared 20 seconds |
| Runtime identity | Dedicated `reminiscence-runtime` service account |
| Secret references | `qloo-api-key:1`, `gemini-api-key:1`, provided only at runtime |
| Gemini | Direct Google API, `gemini-3.8-flash`, project-specific key restricted to its API |
| Public access | Only the Cloud Run invoker role is granted to anonymous users |

This earlier image was built from the recorded source commit with the matching OCI revision label. It has been superseded by the account-stage release above. No source repository or Devpost submission has been published by these deployments.

## Earlier staged verification (historical)

The service was initially private. Anonymous requests received HTTP 403; authenticated page/CSS/health checks passed, and local config/private research paths returned 404. All five preset names resolved through the hosted API. Two mixed-category runs completed in agent mode with six candidates and six completed metadata checks each (11848 ms and 13496 ms). Actual exclusion parameters and stable accepted ordering were checked.

The final revision then passed runtime identity, image digest, pinned secret references, resource limits and project budget checks. Public invocation was enabled under the user's approval. Anonymous HTTP smoke passed, and nine served HTML/JavaScript/CSS assets contained none of the configured credential values. The checked revision's error-log query returned no entries during verification.

The public browser rehearsal confirmed and explicitly reviewed Sinatra as a starting activity, explored related items while excluding that accepted anchor, marked Nat King Cole as a known favourite, accepted it, rejected Dean Martin and reordered the session. Refresh preserved the Nat King Cole → Sinatra order. The visible request drawer showed two signals, three exclusions and three successful Qloo requests with matching bound parameters. A TV-MA result could not be accepted. Activity/time edits, start, observed feedback and finish worked.

One public refresh hit the planning timeout and correctly used the labelled Qloo fallback (17.2 seconds); accepted activities remained intact and incomplete checks stayed pending. One warm retry completed in agent mode with two agent rounds and one screen in 17.3 seconds. These are individual integration observations, not a latency benchmark or success-rate estimate.

At an emulated phone width of 390 px, document width was 375 px with no horizontal overflow. The official Spotify embed rendered Nat King Cole and its preview track list after an explicit click. No browser warnings/errors were captured in the tested flow. Actual audible playback, printed output and physical-device/accessibility audits remain unverified.

Private evidence remains ignored under `qloo-private/`: hosted API/browser summaries, asset checks and screenshots. No cached response dumps or credentials are release assets.

## Spending and availability

The approved US$10 planning target is supported by project-only Cloud Billing alerts at 50%, 90% and 100%, covering 27 October through 7 November (custom period ends 8 November). A **US$3 monthly Gemini project cap** was saved and verified in AI Studio. Monthly caps reset; the demo period spans two months. Cap enforcement can lag and overages can occur; alerts and instance limits are not a strict total spending ceiling. ([Google's cap documentation](https://ai.google.dev/gemini-api/docs/billing#project-spend-caps))

Google shows an account-wide prepay migration notice. The user explicitly chose to keep the current billing mode. No payment-mode change, credit purchase or automatic reload was performed. The project key works now, but that unresolved notice is a risk to future Gemini availability.

Judge access is intended to remain available through **7 November 2026, noon Singapore time**. No automatic shutdown is scheduled; cleanup requires a separate decision. There is no uptime guarantee against billing/quota changes or upstream failures. The app's labelled fallback preserves accepted sessions when the model is unavailable.

## Remaining release work

Independent caregiver/proxy review, physical-phone/paper-print checks, broader playback coverage and a matched comparison remain optional further validation. This deployment does not establish clinical benefit or superiority over a plain LLM.
