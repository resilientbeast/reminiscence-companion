# Cloud Run release plan — prepared, not executed

The user chose a new dedicated project. No project, billing link, cloud secret, API key, registry, public service or Devpost submission has been created. The available open billing account is named **My Billing Account**. Creating the deployment requires explicit approval of billing use and public access after the local container checks.

## Proposed resources

| Setting | Proposed value |
| --- | --- |
| Project ID / display name | `reminiscence-qloo-20261027` / Reminiscence Companion |
| Region / service | `us-central1` / `reminiscence-companion` |
| Registry | Artifact Registry Docker repository `reminiscence` in `us-central1` |
| Image | Locally verified build, uploaded under a release tag, then resolved to an immutable digest before deployment |
| Runtime | 1 CPU, 512 MiB memory, port 8080, 30-second platform timeout |
| Scaling | Minimum 0, service maximum 1, request concurrency 2 |
| Access | Private during provisioning/verification; public judge access only after limits and the live flow are checked |
| Runtime identity | Dedicated `reminiscence-runtime` service account, with accessor permission on only the two app secrets |
| Keys | Qloo and dedicated-project Gemini credentials in Secret Manager; pinned secret versions, no keys in the image or command arguments |
| Availability | Keep judge access through 7 November 2026, noon Singapore time; removal requires a separate decision |

Proposed planning budget: **US$10 total for this demo period**, subject to user approval. This is a target, not a guaranteed charge ceiling. Prepare a small Gemini project spend cap plus Cloud Billing alerts; verify the actual controls in the account before enabling public access. Do not change billing settings or credentials for the unrelated existing projects.

Google recommends Secret Manager and pinned versions for environment-injected secrets. ([Cloud Run secret configuration](https://docs.cloud.google.com/run/docs/configuring/services/secrets))

Gemini caps/quotas belong to the key's project, so using an existing unrelated-project key would not isolate this demo's spending. Project spend caps are experimental and can overshoot during billing delays of around ten minutes. Verify the chosen project's real setting; do not present it as an exact monetary cap. ([Gemini billing controls](https://ai.google.dev/gemini-api/docs/billing), [rate limits](https://ai.google.dev/gemini-api/docs/rate-limits))

## App protections implemented locally

- Shared per-run deadline, Qloo HTTP-call/retry cap and model round/output-token caps.
- Per-process admission limits: at most two simultaneous plans, sixty plans per hour; four simultaneous searches, three hundred searches per hour. Only numeric counters/timestamps are held, with no IP or user identifiers. Ten sequential sessions with six searches and three plans each pass the offline allowance check.
- These instance counters reset on restart and multiply across instances; they are approximate abuse protection, not a global quota or a spending cap. A maximum instance count also does not cap cumulative spending. ([Cloud Run maximum instances](https://docs.cloud.google.com/run/docs/configuring/max-instances))
- Cultural metadata cache: at most 500 entries, expiring after fifteen minutes. No caregiver records, feedback bodies or session logging.
- No automatic retry of failed model calls, bounded JSON bodies and source pool, same-origin browser request checks, no-store responses and redacted upstream errors.
- Local Git pre-commit guard scans working assets and staged blobs; it rejects private research/config paths even if force-staged. No publication is part of this check.

## Provisioning sequence after approval

1. Confirm project ID availability and the selected billing account. Create the dedicated project and link that account. Enable only the Cloud Run, Artifact Registry, Secret Manager and Gemini/key-management APIs needed for the chosen credentials.
2. Create the registry and runtime identity. Store keys using stdin, never shell arguments or committed files. Create/use a Gemini key associated with the dedicated project and restricted to its API; keep the existing local key for other work unchanged.
3. Verify the real Gemini spend/quota control, record its limitations, and configure Cloud Billing alerts. Any account terms, payment change or credit purchase needs the user's action/approval; no automatic top-up is assumed.
4. Push the verified local image and record its registry digest. Deploy a private revision with fixed non-secret config and pinned secret versions; grant the runtime identity access to only those secrets.
5. Run deployed health/asset checks, five-preset resolution and one complete accept/reject/refresh/finish flow. Check phone access, cold/warm timing, browser errors and quota behaviour. Verify no local config/private research is served or present in the image.
6. Enable public judge invocation under the already approved scope only after the checks pass. Record URL/digest/source revision and confirm access through the availability date. No Devpost submission follows automatically.

## Still to verify

Actual cloud creation/billing/IAM/limits and deployment are not executed. Actual print output, audible playback, accessibility audit and caregiver task review are not established by the local workflow checks. The earlier plain-LLM comparison was exploratory; it does not establish an advantage for Qloo or validate this product for caregivers.
