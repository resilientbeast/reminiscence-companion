import type { Candidate } from "./contracts.ts";
import { screenOutputSchema, selectionSchema } from "./planner-contracts.ts";

export type PoolEntry = { candidate: Candidate; fields: Record<string, string> };

export function validateSelection(input: unknown, pool: Map<string, PoolEntry>): string[] {
  const { entityIds } = selectionSchema.parse(input);
  if (new Set(entityIds).size !== entityIds.length || entityIds.some((id) => !pool.has(id))) throw new Error("Selection must contain distinct current-pool entities.");
  return entityIds;
}

// An advisory flag must quote an actual returned field. Missing/invalid evidence fails closed.
export function applyScreening(entries: PoolEntry[], output: unknown): Candidate[] {
  const parsed = screenOutputSchema.parse(output);
  const counts = new Map<string, number>();
  for (const item of parsed.items) counts.set(item.entityId.toUpperCase(), (counts.get(item.entityId.toUpperCase()) ?? 0) + 1);
  return entries.map(({ candidate, fields }) => {
    const row = parsed.items.find((item) => item.entityId.toUpperCase() === candidate.qlooEntityId);
    const meaningful = Object.values(fields).some((value) => value.length >= 80);
    if (!row || counts.get(candidate.qlooEntityId) !== 1) return { ...candidate, screening: { status: "failed", flags: [], note: "Screening did not return a unique result. Please review the source yourself." } };
    if (!row.sufficient || !meaningful) return { ...candidate, screening: { status: "insufficient_data", flags: [], note: "The returned metadata is too limited for a content check." } };
    if (row.flags.some((flag) => !fields[flag.fieldPath]?.includes(flag.evidence))) return { ...candidate, screening: { status: "failed", flags: [], note: "A content note could not be grounded in the returned metadata. Please review the source yourself." } };
    return { ...candidate, screening: { status: "complete", flags: row.flags } };
  });
}

export function chooseFallback(pool: Map<string, PoolEntry>): string[] {
  // Interleave categories without pretending their independent Qloo ranks are comparable.
  const groups = ["artist", "film", "tv"].map((kind) => [...pool.values()].filter((row) => row.candidate.kind === kind).sort((a, b) => a.candidate.provenance.qlooRank - b.candidate.provenance.qlooRank));
  const selected: string[] = [];
  for (let index = 0; selected.length < 6 && groups.some((group) => index < group.length); index++) {
    for (const group of groups) if (group[index] && selected.length < 6) selected.push(group[index].candidate.qlooEntityId);
  }
  return selected;
}
