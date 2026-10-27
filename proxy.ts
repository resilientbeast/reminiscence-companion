import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";
import { clerkConfigured, clerkPublishableKey } from "./lib/auth-config";

// Authorization lives at each protected page/API, immediately before data access.
const clerk = clerkMiddleware({ publishableKey: clerkPublishableKey() });
export default function proxy(request: NextRequest, event: Parameters<typeof clerk>[1]) {
  if (!clerkConfigured()) return NextResponse.next();
  return clerk(request, event);
}
export const config = {
  matcher: ["/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)", "/(api|trpc)(.*)"],
};
