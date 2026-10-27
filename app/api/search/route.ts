import { errorResponse } from "../../../lib/http";
import { runSearch } from "../../../lib/planning-handlers";
import { requireUser } from "../../../lib/auth";

export const runtime = "nodejs";
export async function POST(request: Request) {
  try { await requireUser(); } catch (error) { return errorResponse(error); }
  return runSearch(request);
}
