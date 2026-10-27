import { z } from "zod";

const entityId = z.uuid().transform((id) => id.toUpperCase());
const ids = (max: number) => z.array(entityId).max(max);
export const kindSchema = z.enum(["artist", "film", "tv"]);
export type Kind = z.infer<typeof kindSchema>;

export const policySchema = z.object({
  movieRatings: z.enum(["G", "G_PG"]),
  tvRatings: z.enum(["TV_G", "TV_G_PG"]),
  screenEra: z.object({
    from: z.number().int().min(1888).max(2100).optional(),
    to: z.number().int().min(1888).max(2100).optional(),
  }).strict().refine((era) => era.from === undefined || era.to === undefined || era.from <= era.to, {
    message: "The start of the era must not be later than the end.",
  }).optional(),
  unrated: z.literal("hold"),
}).strict();
export type Policy = z.infer<typeof policySchema>;

export const DEFAULT_POLICY: Readonly<Policy> = Object.freeze({
  movieRatings: "G_PG", tvRatings: "TV_G_PG", unrated: "hold",
});

export const sessionStateSchema = z.object({
  anchorIds: ids(6).min(1), positiveIds: ids(12), rejectedIds: ids(100),
  skippedIds: ids(100), acceptedIds: ids(6), seenIds: ids(200), policy: policySchema,
}).strict().superRefine((state, context) => {
  for (const field of ["anchorIds", "positiveIds", "rejectedIds", "skippedIds", "acceptedIds", "seenIds"] as const) {
    if (new Set(state[field]).size !== state[field].length) {
      context.addIssue({ code: "custom", path: [field], message: "Entity IDs must be distinct." });
    }
  }
  const rejected = new Set(state.rejectedIds);
  for (const field of ["anchorIds", "positiveIds", "acceptedIds"] as const) {
    if (state[field].some((id) => rejected.has(id))) {
      context.addIssue({ code: "custom", path: [field], message: "Rejected items cannot also be seeds or accepted items." });
    }
  }
});
export type SessionState = z.infer<typeof sessionStateSchema>;

// The model receives this narrow input. Policy, signals and exclusions are server-bound.
export const recommendToolInputSchema = z.object({
  kind: kindSchema, limit: z.number().int().min(1).max(20).default(15),
}).strict();

export const candidateSchema = z.object({
  qlooEntityId: entityId, name: z.string().min(1).max(300), kind: kindSchema,
  year: z.number().int().optional(), contentRating: z.string().max(30).optional(),
  imageUrl: z.url().optional(), genres: z.array(z.string().max(100)).max(30).optional(),
  provenance: z.object({
    source: z.enum(["search", "insights"]).default("insights"),
    runId: z.string().min(1).max(100), requestId: z.string().min(1).max(100),
    qlooRank: z.number().int().positive(), selectedRank: z.number().int().positive().optional(),
    explainability: z.enum(["available", "unavailable"]),
    attribution: z.array(z.object({
      signalEntityId: entityId, signalName: z.string().min(1).max(300),
      contribution: z.number().min(0).max(1).optional(),
    }).strict()).max(18),
  }).strict(),
  blurb: z.string().max(1600), blurbSource: z.enum(["qloo", "model"]),
  screening: z.object({
    status: z.enum(["not_run", "complete", "failed", "insufficient_data"]),
    flags: z.array(z.object({
      code: z.enum(["war", "death", "institution", "violence", "distress", "other"]),
      note: z.string().min(1).max(500), fieldPath: z.string().min(1).max(200), evidence: z.string().min(1).max(1000),
    }).strict()).max(20),
    note: z.string().max(1000).optional(),
  }).strict(),
  ratingGate: z.enum(["eligible", "held"]),
  review: z.enum(["pending", "accepted", "rejected"]),
  familiarity: z.enum(["confirmed_favourite", "familiar", "unknown"]),
  playbackUrl: z.url().optional(), spotifyArtistId: z.string().regex(/^[A-Za-z0-9]{22}$/).optional(),
}).strict();
export type Candidate = z.infer<typeof candidateSchema>;

export const sessionItemSchema = z.object({
  candidate: candidateSchema.refine((candidate) => candidate.review === "accepted" && candidate.ratingGate === "eligible", {
    message: "Only explicitly accepted, rating-eligible items can enter a session.",
  }),
  activity: z.enum(["listen", "view", "talk"]),
  suggestedMinutes: z.number().int().min(1).max(20), prompt: z.string().max(500).optional(),
}).strict();
export type SessionItem = z.infer<typeof sessionItemSchema>;

export type BrowserSession = {
  state: SessionState; candidates: Candidate[]; acceptedItems: SessionItem[];
  previousQlooOrder: string[]; previousSelectedOrder: string[];
};
