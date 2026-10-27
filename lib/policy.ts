import { recommendToolInputSchema, sessionStateSchema } from "./contracts.ts";
import type { Kind, SessionState } from "./contracts.ts";

export function buildRecommendationParameters(input: unknown, stateInput: unknown): Record<string, string> {
  const { kind, limit } = recommendToolInputSchema.parse(input);
  const state = sessionStateSchema.parse(stateInput);
  const signals = [...new Set([...state.anchorIds, ...state.positiveIds])];
  const exclusions = [...new Set([...state.rejectedIds, ...state.skippedIds, ...state.acceptedIds])];
  const params: Record<string, string> = {
    "filter.type": kind === "film" ? "urn:entity:movie" : kind === "tv" ? "urn:entity:tv_show" : "urn:entity:artist",
    "signal.interests.entities": signals.join(","),
    "feature.explainability": "true", take: String(limit),
  };
  if (exclusions.length) params["filter.exclude.entities"] = exclusions.join(",");
  if (kind === "film") params["filter.content_rating"] = state.policy.movieRatings === "G" ? "G" : "G,PG";
  // TV rating parameters need a live probe. Returned TV ratings must still pass the code gate below.
  if (kind !== "artist") {
    if (state.policy.screenEra?.from !== undefined) params["filter.release_year.min"] = String(state.policy.screenEra.from);
    if (state.policy.screenEra?.to !== undefined) params["filter.release_year.max"] = String(state.policy.screenEra.to);
  }
  return params;
}

type PolicyCandidate = { qlooEntityId: string; kind: Kind; year?: number; contentRating?: string };
export type PolicyResult = { eligible: boolean; reason: "eligible" | "explicitly_rejected" | "skipped" | "missing_year" | "out_of_era" | "rating_held" };

export function evaluateCandidatePolicy(candidate: PolicyCandidate, state: SessionState): PolicyResult {
  const id = candidate.qlooEntityId.toUpperCase();
  if (state.rejectedIds.includes(id)) return { eligible: false, reason: "explicitly_rejected" };
  if (state.skippedIds.includes(id)) return { eligible: false, reason: "skipped" };
  if (candidate.kind === "artist") return { eligible: true, reason: "eligible" };
  const era = state.policy.screenEra;
  if (era && (era.from !== undefined || era.to !== undefined)) {
    if (candidate.year === undefined) return { eligible: false, reason: "missing_year" };
    if ((era.from !== undefined && candidate.year < era.from) || (era.to !== undefined && candidate.year > era.to)) {
      return { eligible: false, reason: "out_of_era" };
    }
  }
  const ratings = candidate.kind === "film"
    ? state.policy.movieRatings === "G" ? ["G"] : ["G", "PG"]
    : state.policy.tvRatings === "TV_G" ? ["TV-G"] : ["TV-G", "TV-PG"];
  return candidate.contentRating && ratings.includes(candidate.contentRating)
    ? { eligible: true, reason: "eligible" }
    : { eligible: false, reason: "rating_held" };
}
