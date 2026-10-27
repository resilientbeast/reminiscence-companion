// The server alias avoids Next.js freezing NEXT_PUBLIC_* values at build time.
export function clerkPublishableKey() {
  return process.env.CLERK_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
}
export function clerkConfigured() {
  return Boolean(clerkPublishableKey() && process.env.CLERK_SECRET_KEY);
}
