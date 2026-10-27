import "server-only";
import { auth } from "@clerk/nextjs/server";
import { clerkConfigured } from "./auth-config.ts";
import { ServiceError } from "./qloo.ts";

export async function requireUser() {
  if (!clerkConfigured()) throw new ServiceError("auth_unavailable", "Account access is not configured yet. You can try the temporary demo.", 503);
  const { userId } = await auth();
  if (!userId) throw new ServiceError("sign_in_required", "Please log in to access your private sessions.", 401);
  return userId;
}
