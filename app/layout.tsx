import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { clerkConfigured, clerkPublishableKey } from "../lib/auth-config";
import "./globals.css";

// Read runtime-injected Clerk configuration in Cloud Run, including on public pages.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Reminiscence Companion",
  description: "An activity planner for caregivers of people living with dementia. Build short sessions around familiar music, films and TV, with every choice in your hands.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main">Skip to content</a>
        {clerkConfigured() ? <ClerkProvider publishableKey={clerkPublishableKey()} signInUrl="/sign-in" signUpUrl="/sign-up" signInFallbackRedirectUrl="/workspace" signUpFallbackRedirectUrl="/workspace" afterSignOutUrl="/" appearance={{ variables: { colorPrimary: "#294f3e", colorBackground: "#fffef9", borderRadius: "0.65rem", fontFamily: "Arial, Helvetica, sans-serif" } }}>{children}</ClerkProvider> : children}
      </body>
    </html>
  );
}
