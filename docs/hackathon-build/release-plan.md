# Cloud Run release plan — approved, with deployment recorded

The user approved the staged Cloud Run deployment on 27 October 2026. The dedicated project, billing link, registry, restricted runtime identity, secrets and public service are created. The existing billing account is named **My Billing Account**; unrelated projects were not changed. Verified settings, source/digest and evidence are recorded in [deployment.md](deployment.md). No public source repository or Devpost submission was created.

## Proposed resources

| Setting | Proposed value |
| --- | --- |
| Project ID / display name | `reminiscence-qloo-20261027` / Reminiscence Companion |
| Region / service | `us-central1` / `reminiscence-companion` |
| Registry | Artifact Registry Docker repository `reminiscence` in `us-central1` |
| Image | Locally verified build, uploaded under a release tag, then resolved to an immutable digest before deployment |
| Runtime | 1 CPU, 512 MiB memory, port 8080, 30-second platform timeout |
| Scaling | Minimum 0, service maximum 1, request concurrency 2 |
| Access | Private during provisioning/verification; now public after the checks |
| Runtime identity | Dedicated `reminiscence-runtime` service account, with accessor permission on only the two app secrets |
| Keys | Qloo and dedicated-project Gemini credentials in Secret Manager; pinned secret versions, no keys in the image or command arguments |
| Availability | Keep judge access through 7 November 2026, noon Singapore time; removal requires a separate decision |

Approved planning target: **US$10 total for this demo period**. Project-only alerts at 50/90/100% are active, and a US$3 monthly Gemini project cap was verified in AI Studio. The period spans two monthly caps; enforcement can lag. This is not a guaranteed total ceiling. Unrelated projects' settings/credentials were not changed. Google requested an account-wide prepay migration; the user chose to keep the current billing mode.

Google recommends Secret Manager and pinned versions for environment-injected secrets. ([Cloud Run secret configuration](https://docs.cloud.google.com/run/docs/configuring/services/secrets))

Gemini caps/quotas belong to the key's project, so using an existing unrelated-project key would not isolate this demo's spending. Project spend caps are experimental and can overshoot during billing delays of around ten minutes. Verify the chosen project's real setting; do not present it as an exact monetary cap. ([Gemini billing controls](https://ai.google.dev/gemini-api/docs/billing), [rate limits](https://ai.google.dev/gemini-api/docs/rate-limits))

## App protections implemented locally

- Shared per-run deadline, Qloo HTTP-call/retry cap and model round/output-token caps.
- Per-process admission limits: at most two simultaneous plans, sixty plans per hour; four simultaneous searches, three hundred searches per hour. Only numeric counters/timestamps are held, with no IP or user identifiers. Ten sequential sessions with six searches and three plans each pass the offline allowance check.
- These instance counters reset on restart and multiply across instances; they are approximate abuse protection, not a global quota or a spending cap. A maximum instance count also does not cap cumulative spending. ([Cloud Run maximum instances](https://docs.cloud.google.com/run/docs/configuring/max-instances))
- Cultural metadata cache: at most 500 entries, expiring after fifteen minutes. No caregiver records, feedback bodies or session logging.
- No automatic retry of failed model calls, bounded JSON bodies and source pool, same-origin browser request checks, no-store responses and redacted upstream errors.
- Local Git pre-commit guard scans working assets and staged blobs; it rejects private research/config paths even if force-staged. No publication is part of this check.

## Approved provisioning sequence

1. Confirm project ID availability and the selected billing account. Create the dedicated project and link that account. Enable only the Cloud Run, Artifact Registry, Secret Manager and Gemini/key-management APIs needed for the chosen credentials.
2. Create the registry and runtime identity. Store keys using stdin, never shell arguments or committed files. Create/use a Gemini key associated with the dedicated project and restricted to its API; keep the existing local key for other work unchanged.
3. Verify the real Gemini spend/quota control, record its limitations, and configure Cloud Billing alerts. Any account terms, payment change or credit purchase needs the user's action/approval; no automatic top-up is assumed.
4. Push the verified local image and record its registry digest. Deploy a private revision with fixed non-secret config and pinned secret versions; grant the runtime identity access to only those secrets.
5. Run deployed health/asset checks, five-preset resolution and one complete accept/reject/refresh/finish flow. Check phone access, cold/warm timing, browser errors and quota behaviour. Verify no local config/private research is served or present in the image.
6. Enable public judge invocation under the already approved scope only after the checks pass. Record URL/digest/source revision and confirm access through the availability date. No Devpost submission follows automatically.

## Still to verify

Cloud resources, billing alerts, project cap, private verification and public deployment are complete as recorded in the release record. The user confirmed one audible Nat King Cole official Spotify preview in the in-app browser. Actual print output, broader playback coverage, physical-phone/accessibility audits and independent caregiver review remain unverified. The earlier plain-LLM comparison was exploratory; it does not establish an advantage for Qloo or validate this product for caregivers. No payment-mode change or credit purchase was made, and no automatic shutdown is scheduled.
