import { z } from "zod";
import { candidateSchema, kindSchema, sessionStateSchema } from "./contracts.ts";

export const searchInputSchema = z.object({ query: z.string().trim().min(2).max(100), kind: kindSchema }).strict();
export const planInputSchema = z.object({
  state: sessionStateSchema, kinds: z.array(kindSchema).min(1).max(3).refine((kinds) => new Set(kinds).size === kinds.length),
}).strict();
export const selectionSchema = z.object({ entityIds: z.array(z.uuid().transform((id) => id.toUpperCase())).min(1).max(6) }).strict();
export const screenOutputSchema = z.object({ items: z.array(z.object({
  entityId: z.string(), sufficient: z.boolean(),
  flags: z.array(candidateSchema.shape.screening.shape.flags.element).max(5),
}).strict()).max(6) }).strict();

export type Anchor = { id: string; name: string; kind: z.infer<typeof kindSchema>; year?: number; blurb: string; startingCandidate?: z.infer<typeof candidateSchema> };
export type PlanResponse = {
  runId: string; candidates: z.infer<typeof candidateSchema>[]; mode: "agent" | "fallback";
  notices: string[];
  trace: {
    elapsedMs: number; qlooCalls: number; modelRounds: number; screenCalls: number;
    requests: { requestId: string; operation: string; status: number; count: number; parameters: Record<string, string> }[];
    signals: string[]; exclusions: string[];
    sourceOrder: { kind: z.infer<typeof kindSchema>; ids: string[] }[];
    sourceRanks: Record<string, number>;
    selectedOrder: string[];
  };
};
