import "server-only";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { candidateSchema, DEFAULT_POLICY } from "./contracts.ts";
import type { Candidate, Kind, SessionState } from "./contracts.ts";
import { buildRecommendationParameters, evaluateCandidatePolicy } from "./policy.ts";

export class ServiceError extends Error {
  readonly code: string;
  readonly status: number;
  constructor(code: string, message: string, status = 503) { super(message); this.code = code; this.status = status; }
}

// One budget spans agent tools, retries, screening and fallback. Counters are reserved before awaiting.
export class RunBudget {
  readonly started = Date.now();
  readonly runId = randomUUID();
  readonly signal: AbortSignal;
  qlooCalls = 0;
  modelRounds = 0;
  screenCalls = 0;
  retries = 0;
  readonly requests: { requestId: string; operation: string; status: number; count: number; parameters: Record<string, string> }[] = [];
  constructor(timeoutMs = 20_000, parent?: AbortSignal) {
    this.signal = parent ? AbortSignal.any([parent, AbortSignal.timeout(timeoutMs)]) : AbortSignal.timeout(timeoutMs);
    this.deadline = this.started + timeoutMs;
  }
  private readonly deadline: number;
  remaining() { return Math.max(0, this.deadline - Date.now()); }
  reserveQloo() {
    this.signal.throwIfAborted();
    if (this.qlooCalls >= 6) throw new ServiceError("call_budget", "The discovery call limit was reached.");
    this.qlooCalls++;
  }
}

type Json = Record<string, unknown>;
function record(value: unknown): Json { return value && typeof value === "object" && !Array.isArray(value) ? value as Json : {}; }
function text(value: unknown, max = 1600): string { return typeof value === "string" ? value.trim().slice(0, max) : ""; }
const uuid = z.uuid();
const urn: Record<Kind, string> = { artist: "urn:entity:artist", film: "urn:entity:movie", tv: "urn:entity:tv_show" };

export type Entity = {
  id: string; name: string; kind: Kind; year?: number; contentRating?: string;
  blurb: string; genres: string[]; spotifyArtistId?: string;
  notableSong?: string;
  fields: Record<string, string>;
};

// Only bounded, public cultural metadata is cached; no caregiver/session records.
const catalog = new Map<string, { entity: Entity; expiresAt: number }>();
function remember(entity: Entity) {
  for (const [id, row] of catalog) if (row.expiresAt <= Date.now()) catalog.delete(id);
  if (catalog.size >= 500 && !catalog.has(entity.id)) catalog.delete(catalog.keys().next().value!);
  catalog.set(entity.id, { entity, expiresAt: Date.now() + 15 * 60_000 });
}
export function signalName(id: string) {
  const row = catalog.get(id);
  if (row && row.expiresAt > Date.now()) return row.entity.name;
  catalog.delete(id); return "Supplied taste signal";
}

export function normalizeEntity(value: unknown, expectedKind?: Kind): Entity | null {
  const raw = record(value), props = record(raw.properties);
  const kinds = [raw.subtype, ...(Array.isArray(raw.types) ? raw.types : [])];
  const kind = (Object.keys(urn) as Kind[]).find((key) => kinds.includes(urn[key]));
  const id = text(raw.entity_id).toUpperCase(), name = text(raw.name, 300);
  if (!uuid.safeParse(id).success || !name || !kind || (expectedKind && expectedKind !== kind)) return null;
  const shorts = Array.isArray(props.short_descriptions) ? props.short_descriptions : [];
  const englishIndex = shorts.findIndex((v) => Array.isArray(record(v).languages) && (record(v).languages as unknown[]).includes("en"));
  const shortIndex = englishIndex >= 0 ? englishIndex : 0;
  const short = shorts[shortIndex];
  const fields: Record<string, string> = {};
  for (const field of ["description", "short_description", "plot_summary", "emotional_tone_description"] as const) {
    const content = text(props[field], 1600);
    if (content) fields[`properties.${field}`] = content;
  }
  if (text(record(short).value)) fields[`properties.short_descriptions[${shortIndex}].value`] = text(record(short).value);
  const blurb = fields["properties.plot_summary"] || fields["properties.short_description"] || text(record(short).value) || fields["properties.description"] || "";
  const tags = Array.isArray(raw.tags) ? raw.tags : [];
  const genres = tags.filter((v) => text(record(v).type).includes(":genre")).map((v) => text(record(v).name, 100)).filter(Boolean).slice(0, 12);
  const external = record(raw.external), propExternal = record(props.external);
  const spotify = external.spotify ?? propExternal.spotify;
  const spotifyId = text(record(Array.isArray(spotify) ? spotify[0] : spotify).id);
  const year = typeof props.release_year === "number" && Number.isInteger(props.release_year) ? props.release_year : undefined;
  const contentRating = text(props.content_rating, 30) || undefined;
  const notableSong = Array.isArray(props.notable_songs) ? text(props.notable_songs.find((song) => typeof song === "string"), 200) || undefined : undefined;
  const entity: Entity = { id, name, kind, blurb, genres, fields, notableSong, ...(year ? { year } : {}), ...(contentRating ? { contentRating } : {}),
    ...(kind === "artist" && /^[A-Za-z0-9]{22}$/.test(spotifyId) ? { spotifyArtistId: spotifyId } : {}) };
  return entity;
}

export function candidateFromEntity(entity: Entity, raw: unknown, rank: number, requestId: string, budget: RunBudget, state: SessionState, allowAttribution = true): Candidate {
  const explanation = allowAttribution ? record(record(record(raw).query).explainability)["signal.interests.entities"] : undefined;
  const signals = new Set([...state.anchorIds, ...state.positiveIds]);
  const attribution = (Array.isArray(explanation) ? explanation : []).flatMap((value) => {
    const row = record(value), id = text(row.entity_id).toUpperCase();
    if (!signals.has(id)) return [];
    const score = typeof row.score === "number" && row.score >= 0 && row.score <= 1 ? row.score : undefined;
    return [{ signalEntityId: id, signalName: signalName(id), ...(score !== undefined ? { contribution: score } : {}) }];
  }).slice(0, 18);
  const gate = evaluateCandidatePolicy({ qlooEntityId: entity.id, ...entity }, state);
  return candidateSchema.parse({
    qlooEntityId: entity.id, name: entity.name, kind: entity.kind, year: entity.year, contentRating: entity.contentRating,
    genres: entity.genres, blurb: entity.blurb, blurbSource: "qloo", spotifyArtistId: entity.spotifyArtistId,
    playbackUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(entity.name + (entity.kind === "artist" ? ` ${entity.notableSong || "music"}` : ` ${entity.year || ""} trailer`))}`,
    provenance: { runId: budget.runId, requestId, qlooRank: rank, explainability: attribution.length ? "available" : "unavailable", attribution },
    screening: { status: "not_run", flags: [] }, ratingGate: gate.eligible ? "eligible" : "held", review: "pending", familiarity: "unknown",
  });
}

export class QlooClient {
  private readonly budget: RunBudget;
  private readonly environment: Record<string, string | undefined>;
  private readonly fetcher: typeof fetch;
  constructor(budget: RunBudget, environment: Record<string, string | undefined> = process.env, fetcher: typeof fetch = fetch) { this.budget = budget; this.environment = environment; this.fetcher = fetcher; }
  private async get(path: "/search" | "/v2/insights", params: Record<string, string>) {
    const key = this.environment.QLOO_API_KEY;
    if (!key) throw new ServiceError("qloo_not_configured", "Qloo is not configured on this server.");
    let origin: URL;
    try { origin = new URL(this.environment.QLOO_ENDPOINT || "https://hackathon.api.qloo.com"); } catch { throw new ServiceError("qloo_configuration", "The Qloo endpoint needs server configuration."); }
    if (origin.protocol !== "https:" || !["hackathon.api.qloo.com", "api.qloo.com"].includes(origin.hostname) || origin.username || origin.password || origin.port || origin.search || origin.hash || origin.pathname !== "/") {
      throw new ServiceError("qloo_configuration", "The Qloo endpoint must be a trusted Qloo API origin.");
    }
    const url = new URL(path, origin); url.search = new URLSearchParams(params).toString();
    for (;;) {
      this.budget.reserveQloo();
      const requestId = randomUUID();
      let response: Response;
      try { response = await this.fetcher(url, { headers: { "X-Api-Key": key }, signal: this.budget.signal, cache: "no-store", redirect: "error" }); }
      catch { throw new ServiceError("qloo_unavailable", "Qloo did not respond in time. Your accepted session is still available."); }
      this.budget.requests.push({ requestId, operation: path === "/search" ? "search" : params["filter.type"], status: response.status, count: 0, parameters: { ...params } });
      if (!response.ok) {
        if ([429, 502, 503, 504].includes(response.status) && this.budget.retries === 0 && this.budget.qlooCalls < 6 && this.budget.remaining() > 2500) {
          this.budget.retries++; await response.body?.cancel(); continue;
        }
        await response.body?.cancel();
        throw new ServiceError(response.status === 401 || response.status === 403 ? "qloo_auth" : "qloo_unavailable", "Qloo could not complete this request. Try again later.");
      }
      // Bound streamed JSON before parsing; API errors/headers never reach the browser or logs.
      const reader = response.body?.getReader();
      if (!reader) throw new ServiceError("qloo_response", "Qloo returned an unreadable response.");
      const chunks: Uint8Array[] = []; let size = 0;
      for (;;) {
        const chunk = await reader.read(); if (chunk.done) break;
        size += chunk.value.length;
        if (size > 2_000_000) { await reader.cancel(); throw new ServiceError("qloo_response", "The discovery response was too large."); }
        chunks.push(chunk.value);
      }
      try { return { body: record(JSON.parse(Buffer.concat(chunks).toString("utf8"))), requestId }; }
      catch { throw new ServiceError("qloo_response", "Qloo returned an unreadable response."); }
    }
  }
  async search(query: string, kind: Kind) {
    const { body, requestId } = await this.get("/search", { query, types: urn[kind], take: "5" });
    const results = (Array.isArray(body.results) ? body.results : []).flatMap((row) => { const entity = normalizeEntity(row, kind); if (!entity) return []; remember(entity); return [entity]; }).slice(0, 5);
    this.budget.requests[this.budget.requests.length - 1].count = results.length;
    return results.map(({ fields: _fields, ...entity }, index) => {
      const startingState: SessionState = { anchorIds: [entity.id], positiveIds: [], rejectedIds: [], skippedIds: [], acceptedIds: [], seenIds: [], policy: DEFAULT_POLICY };
      const candidate = candidateFromEntity({ ...entity, fields: {} }, {}, index + 1, requestId, this.budget, startingState);
      return { ...entity, startingCandidate: { ...candidate, provenance: { ...candidate.provenance, source: "search" as const } } };
    });
  }
  async recommend(kind: Kind, state: SessionState) {
    const { body, requestId } = await this.get("/v2/insights", buildRecommendationParameters({ kind, limit: 15 }, state));
    const rows = record(body.results).entities;
    const results = (Array.isArray(rows) ? rows : []).slice(0, 20).flatMap((raw, index) => {
      const entity = normalizeEntity(raw, kind); if (!entity) return [];
      const gate = evaluateCandidatePolicy({ qlooEntityId: entity.id, ...entity }, state);
      if (["explicitly_rejected", "skipped", "out_of_era", "missing_year"].includes(gate.reason) || state.acceptedIds.includes(entity.id) || state.anchorIds.includes(entity.id)) return [];
      remember(entity);
      const warnings = body.warnings || body.warning;
      const hasWarnings = Array.isArray(warnings) ? warnings.length > 0 : Boolean(warnings);
      return [{ candidate: candidateFromEntity(entity, raw, index + 1, requestId, this.budget, state, !hasWarnings), fields: entity.fields }];
    });
    const request = this.budget.requests.find((row) => row.requestId === requestId); if (request) request.count = results.length;
    return results;
  }
}
