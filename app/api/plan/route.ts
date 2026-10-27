import { errorResponse } from "../../../lib/http";
import { runPlan } from "../../../lib/planning-handlers";
import { requireUser } from "../../../lib/auth";

export const runtime = "nodejs";
export async function POST(request: Request) {
  try { await requireUser(); } catch (error) { return errorResponse(error); }
  return runPlan(request);
}
