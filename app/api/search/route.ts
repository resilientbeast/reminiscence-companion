import { searchInputSchema } from "../../../lib/planner-contracts";
import { QlooClient, RunBudget } from "../../../lib/qloo";
import { errorResponse, jsonHeaders, readRequest } from "../../../lib/http";
import { acquireAdmission } from "../../../lib/admission";

export const runtime = "nodejs";
export async function POST(request: Request) {
  let release: (() => void) | undefined;
  try {
    const { query, kind } = searchInputSchema.parse(await readRequest(request));
    release = acquireAdmission("search");
    const results = await new QlooClient(new RunBudget(20_000, request.signal)).search(query, kind);
    return Response.json({ results }, { headers: jsonHeaders });
  } catch (error) { return errorResponse(error); }
  finally { release?.(); }
}
