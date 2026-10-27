import { DEFAULT_POLICY } from "./contracts.ts";
import { savedSnapshotSchema, toSavedAnchor } from "./saved-session-contracts.ts";
import type { SavedSession, SavedSnapshot } from "./saved-session-contracts.ts";
import type { Anchor } from "./planner-contracts.ts";

export type SessionMemory = { sourceSessions: number; snapshot: SavedSnapshot };
type Preference = { id: string; name: string; rejected: boolean; feedback: "Known favourite" | "Worked well" | "Not for them"; anchor?: Anchor };

// Recompute from this account's saved records. No second, hidden preference store.
// The most recently saved state wins when records disagree about an entity.
export function deriveSessionMemory(sessions: SavedSession[]): SessionMemory {
  const ordered = [...sessions].sort((a, b) => a.updatedAt.localeCompare(b.updatedAt) || a.id.localeCompare(b.id));
  const preferences = new Map<string, Preference>();
  for (const session of ordered) {
    const state = session.snapshot;
    const anchors = new Map(state.anchors.map(anchor => [anchor.id, anchor]));
    const rejected = new Set(state.rejectedIds);
    for (const id of new Set([...state.positiveIds, ...state.rejectedIds, ...anchors.keys()])) {
      const earlier = preferences.get(id);
      const anchor = anchors.get(id);
      const accepted = state.accepted.find(item => item.candidate.qlooEntityId === id)?.candidate;
      const name = anchor?.name || state.names[id] || accepted?.name || earlier?.name || "Saved cultural favourite";
      const mark = rejected.has(id) ? "Not for them" : state.feedback[id] === "Worked well" ? "Worked well" : "Known favourite";
      const knownAnchor = anchor || (!rejected.has(id) ? earlier?.anchor : undefined);
      preferences.delete(id);
      preferences.set(id, { id, name, rejected: rejected.has(id), feedback: mark, ...(knownAnchor && !rejected.has(id) ? { anchor: knownAnchor } : {}) });
    }
  }
  const recent = [...preferences.values()].reverse();
  const anchors = recent.filter(item => !item.rejected && item.anchor).slice(0, 6).map(item => toSavedAnchor(item.anchor!));
  const anchorIds = new Set(anchors.map(anchor => anchor.id));
  const positive = recent.filter(item => !item.rejected && !anchorIds.has(item.id)).slice(0, 12);
  const rejected = recent.filter(item => item.rejected).slice(0, 100);
  const retained = recent.filter(item => anchorIds.has(item.id) || positive.includes(item) || rejected.includes(item));
  const latest = ordered.at(-1)?.snapshot;
  const snapshot = savedSnapshotSchema.parse({
    version: 1, anchors, positiveIds: positive.map(item => item.id), rejectedIds: rejected.map(item => item.id),
    kinds: latest?.kinds ?? ["artist", "film", "tv"], policy: latest?.policy ?? { ...DEFAULT_POLICY },
    eraFrom: latest?.eraFrom ?? "", eraTo: latest?.eraTo ?? "",
    names: Object.fromEntries(retained.map(item => [item.id, item.name])),
    feedback: Object.fromEntries(retained.map(item => [item.id, item.feedback])),
    accepted: [], phase: "building",
  });
  return { sourceSessions: ordered.length, snapshot };
}
