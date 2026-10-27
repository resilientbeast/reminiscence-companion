import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { clerkConfigured } from "../../lib/auth-config";
import { SiteHeader, SiteFooter } from "../components/site-chrome";
import Workspace from "./workspace";

export const dynamic = "force-dynamic";
export default async function WorkspacePage() {
  if (!clerkConfigured()) redirect("/sign-in");
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  return <><SiteHeader signedIn /><main id="main"><div className="app-heading no-print"><p className="eyebrow">Your private caregiver workspace</p><h1>A little time, together.</h1><p>Prepare activities for someone living with dementia. Save sessions to your account, and return to what worked. Please leave out recipient names and health details.</p></div><Workspace key={userId} /></main><SiteFooter /></>;
}
