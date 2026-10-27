import Link from "next/link";
import { SignIn, SignUp } from "@clerk/nextjs";
import { SiteHeader, SiteFooter } from "./site-chrome";
import { clerkConfigured } from "../../lib/auth-config";

export function AuthPage({ kind }: { kind: "sign-in" | "sign-up" }) {
  const signup = kind === "sign-up";
  return <><SiteHeader /><main id="main" className="auth-main"><div className="auth-copy"><p className="eyebrow">For caregivers of people living with dementia</p><h1>{signup ? <>A place for your<br /><em>time together.</em></> : <>Welcome<br /><em>back.</em></>}</h1><p>{signup ? "Create your own caregiver account to save short activity sessions and return to them on another device." : "Log in to reopen your private sessions, keep what worked, and prepare something to share."}</p><p className="small-note">Your account is for you, the caregiver. Please leave recipient names, health details and care notes out of the app.</p><Link href="/demo" prefetch={false}>Explore the temporary demo without an account →</Link></div><div className="auth-form">{clerkConfigured() ? (signup ? <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" forceRedirectUrl="/workspace" /> : <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" forceRedirectUrl="/workspace" />) : <div className="panel"><h2>Accounts are being prepared.</h2><p>You can use the live demo while account access is being configured.</p><Link className="primary-link" href="/demo">Try the demo</Link></div>}</div></main><SiteFooter /></>;
}
