import { requireUser } from "../../../../lib/auth";
import { getSession, updateSession, deleteSession } from "../../../../lib/session-store";
import { savedSessionIdSchema, updateSessionSchema } from "../../../../lib/saved-session-contracts";
import { errorResponse, jsonHeaders, readRequest } from "../../../../lib/http";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };
export async function GET(_request: Request, context: Context) {
  try {
    const userId = await requireUser();
    const id = savedSessionIdSchema.parse((await context.params).id);
    return Response.json({ session: await getSession(userId, id) }, { headers: jsonHeaders });
  } catch (error) { return errorResponse(error); }
}
export async function PUT(request: Request, context: Context) {
  try {
    const userId = await requireUser();
    const id = savedSessionIdSchema.parse((await context.params).id);
    const { snapshot, revision } = updateSessionSchema.parse(await readRequest(request, 100_000));
    return Response.json({ session: await updateSession(userId, id, snapshot, revision) }, { headers: jsonHeaders });
  } catch (error) { return errorResponse(error); }
}
export async function DELETE(request: Request, context: Context) {
  try {
    const userId = await requireUser();
    const id = savedSessionIdSchema.parse((await context.params).id);
    // Mutations, including DELETE, require a same-origin JSON request.
    await readRequest(request);
    await deleteSession(userId, id);
    return Response.json({ deleted: true }, { headers: jsonHeaders });
  } catch (error) { return errorResponse(error); }
}
