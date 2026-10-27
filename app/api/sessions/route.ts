import { requireUser } from "../../../lib/auth";
import { createSession, readWorkspace } from "../../../lib/session-store";
import { saveSessionSchema } from "../../../lib/saved-session-contracts";
import { errorResponse, jsonHeaders, readRequest } from "../../../lib/http";

export const runtime = "nodejs";
export async function GET() {
  try { return Response.json(await readWorkspace(await requireUser()), { headers: jsonHeaders }); }
  catch (error) { return errorResponse(error); }
}
export async function POST(request: Request) {
  try {
    const userId = await requireUser();
    const { snapshot } = saveSessionSchema.parse(await readRequest(request, 100_000));
    return Response.json({ session: await createSession(userId, snapshot) }, { status: 201, headers: jsonHeaders });
  } catch (error) { return errorResponse(error); }
}
