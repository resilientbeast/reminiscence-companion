import { z } from "zod";
import { candidateSchema, kindSchema, policySchema, sessionItemSchema } from "./contracts.ts";

const entityId = z.uuid().transform(id => id.toUpperCase());
const idList = (limit: number) => z.array(entityId).max(limit).refine(ids => new Set(ids).size === ids.length);
export const savedAnchorSchema = z.object({
  id: entityId, name: z.string().min(1).max(300), kind: kindSchema,
  year: z.number().int().optional(), blurb: z.string().max(1600), startingCandidate: candidateSchema.optional(),
}).strict();
// Only the explicitly saved working session is retained, not discovery pools or request traces.
export const savedSnapshotSchema = z.object({
  version: z.literal(1), anchors: z.array(savedAnchorSchema).max(6),
  kinds: z.array(kindSchema).min(1).max(3).refine(kinds => new Set(kinds).size === kinds.length),
  policy: policySchema, eraFrom: z.string().regex(/^(?:\d{4})?$/), eraTo: z.string().regex(/^(?:\d{4})?$/),
  positiveIds: idList(12), rejectedIds: idList(100),
  accepted: z.array(sessionItemSchema).max(3),
  feedback: z.record(entityId, z.enum(["Known favourite", "Worked well", "Not for them"])).refine(value => Object.keys(value).length <= 120),
  names: z.record(entityId, z.string().min(1).max(300)).refine(value => Object.keys(value).length <= 120),
  phase: z.enum(["building", "active", "finished"]),
}).strict().superRefine((snapshot, ctx) => {
  const rejected = new Set(snapshot.rejectedIds);
  const acceptedIds = snapshot.accepted.map(item => item.candidate.qlooEntityId);
  if (new Set(acceptedIds).size !== acceptedIds.length || new Set(snapshot.anchors.map(a => a.id)).size !== snapshot.anchors.length) ctx.addIssue({ code: "custom", message: "Duplicate activities or favourites." });
  if ([...acceptedIds, ...snapshot.anchors.map(a => a.id), ...snapshot.positiveIds].some(id => rejected.has(id))) ctx.addIssue({ code: "custom", message: "Rejected items cannot also be accepted or favourites." });
  if ((snapshot.eraFrom && (+snapshot.eraFrom < 1888 || +snapshot.eraFrom > 2100)) || (snapshot.eraTo && (+snapshot.eraTo < 1888 || +snapshot.eraTo > 2100)) || (snapshot.eraFrom && snapshot.eraTo && +snapshot.eraFrom > +snapshot.eraTo)) ctx.addIssue({ code: "custom", message: "Check the film and TV era before saving." });
});
export const saveSessionSchema = z.object({ snapshot: savedSnapshotSchema }).strict();
export const updateSessionSchema = saveSessionSchema.extend({ revision: z.number().int().positive() }).strict();
export const savedSessionIdSchema = z.uuid();
export type SavedSnapshot = z.infer<typeof savedSnapshotSchema>;
export type SessionSummary = { id: string; title: string; updatedAt: string; activityCount: number; minutes: number; phase: SavedSnapshot["phase"]; revision: number };
export type SavedSession = SessionSummary & { snapshot: SavedSnapshot };
export function sessionTitle(snapshot: SavedSnapshot) {
  const names = snapshot.accepted.length ? snapshot.accepted.map(item => item.candidate.name) : snapshot.anchors.map(anchor => anchor.name);
  return names.slice(0, 2).join(" & ") || "A little time together";
}
