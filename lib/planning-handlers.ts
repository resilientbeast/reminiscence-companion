import "server-only";
import { planSession } from "./planner.ts";
import { planInputSchema, searchInputSchema } from "./planner-contracts.ts";
import { QlooClient, RunBudget } from "./qloo.ts";
import { acquireAdmission } from "./admission.ts";
import { errorResponse, jsonHeaders, readRequest } from "./http.ts";

export async function runSearch(request: Request) {
  let release: (() => void) | undefined;
  try {
    const { query, kind } = searchInputSchema.parse(await readRequest(request));
    release = acquireAdmission("search");
    const results = await new QlooClient(new RunBudget(20_000, request.signal)).search(query, kind);
    return Response.json({ results }, { headers: jsonHeaders });
  } catch (error) { return errorResponse(error); }
  finally { release?.(); }
}
export async function runPlan(request: Request) {
  let release: (() => void) | undefined;
  try {
    const input = planInputSchema.parse(await readRequest(request));
    release = acquireAdmission("plan");
    return Response.json(await planSession(input, { signal: request.signal }), { headers: jsonHeaders });
  } catch (error) { return errorResponse(error); }
  finally { release?.(); }
}
