import { planSession } from "../../../lib/planner";
import { errorResponse, jsonHeaders, readRequest } from "../../../lib/http";
import { planInputSchema } from "../../../lib/planner-contracts";
import { acquireAdmission } from "../../../lib/admission";

export const runtime = "nodejs";
export async function POST(request: Request) {
  let release: (() => void) | undefined;
  try {
    const input = planInputSchema.parse(await readRequest(request));
    release = acquireAdmission("plan");
    return Response.json(await planSession(input, { signal: request.signal }), { headers: jsonHeaders });
  }
  catch (error) { return errorResponse(error); }
  finally { release?.(); }
}
