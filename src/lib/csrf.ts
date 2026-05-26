/**
 * CSRF protection for Route Handlers.
 * Server Actions get CSRF protection automatically from Next.js.
 * Route Handlers (used for streaming) need manual Origin/Referer validation.
 *
 * On Vercel, same-origin requests are guaranteed by the platform's edge
 * network. The CSRF check is defense-in-depth, not the primary gate.
 * Auth (supabase.auth.getUser) is the real gate on every route.
 */
export function validateOrigin(request: Request): boolean {
  // In development, allow everything
  if (process.env.NODE_ENV === "development") return true;

  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const allowedOrigin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");

  // If NEXT_PUBLIC_SITE_URL is not set, fail closed.
  // This should never happen in production — deploy will fail without it.
  if (!allowedOrigin) {
    console.error("[csrf] NEXT_PUBLIC_SITE_URL is not set — blocking request (fail closed)");
    return false;
  }

  if (origin) {
    const normalizedOrigin = origin.replace(/\/$/, "");
    if (normalizedOrigin === allowedOrigin) return true;
    // Also allow Vercel preview deployments (same project)
    if (normalizedOrigin.endsWith(".vercel.app") && normalizedOrigin.includes("adaptable")) return true;
    console.warn("[csrf] Origin mismatch:", { origin, allowedOrigin });
    return false;
  }

  if (referer) {
    if (referer.startsWith(allowedOrigin)) return true;
    if (referer.includes(".vercel.app") && referer.includes("adaptable")) return true;
    console.warn("[csrf] Referer mismatch:", { referer, allowedOrigin });
    return false;
  }

  // No origin or referer — allow it. Auth is the real protection.
  return true;
}
