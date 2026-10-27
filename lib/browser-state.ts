import { sessionItemSchema } from "./contracts.ts";
import type { Candidate, SessionItem } from "./contracts.ts";

export function acceptCandidate(items: SessionItem[], candidate: Candidate): SessionItem[] {
  if (items.some((item) => item.candidate.qlooEntityId === candidate.qlooEntityId)) return items;
  if (items.length >= 3) throw new Error("Keep this session to three activities.");
  const item = sessionItemSchema.parse({ candidate: { ...candidate, review: "accepted" }, activity: candidate.kind === "artist" ? "listen" : "view", suggestedMinutes: 5, prompt: "Would you like to listen, look, or talk about this together? It is fine to pass." });
  return [...items, item];
}

export function orderSession(items: SessionItem[], index: number, direction: -1 | 1): SessionItem[] {
  const target = index + direction;
  if (index < 0 || index >= items.length || target < 0 || target >= items.length) return items;
  const next = [...items]; [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export function needsReview(candidate: Candidate) {
  return candidate.ratingGate === "held" || candidate.screening.status !== "complete" || candidate.screening.flags.length > 0;
}
