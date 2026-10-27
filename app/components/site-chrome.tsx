import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { clerkConfigured } from "../../lib/auth-config";

export async function SiteHeader({ signedIn }: { signedIn?: boolean }) {
  const authenticated = signedIn ?? (clerkConfigured() ? Boolean((await auth()).userId) : false);
  return <header className="site-header">
    <Link href="/" className="wordmark" aria-label="Reminiscence Companion home"><span className="brand-mark" aria-hidden="true">r.</span><span>Reminiscence<br /><strong>Companion</strong></span></Link>
    <nav className="site-nav" aria-label="Main navigation">
      <Link href="/#how-it-works">How it works</Link>
      <Link href="/demo" prefetch={false}>Try the demo</Link>
      {authenticated ? <><Link href="/workspace" prefetch={false}>My sessions</Link><UserButton /></> : <><Link href="/sign-in" prefetch={false}>Log in</Link><Link className="nav-cta" href="/sign-up" prefetch={false}>Get started</Link></>}
    </nav>
  </header>;
}

export function SiteFooter() {
  return <footer className="site-footer"><span>Reminiscence Companion · Qloo + Gemini</span><div><Link href="/privacy">Privacy & your data</Link><span>An activity aid. Not medical advice or therapy.</span></div></footer>;
}
