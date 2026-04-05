/**
 * CSRF protection for Route Handlers.
 * Server Actions get CSRF protection automatically from Next.js.
 * Route Handlers (used for streaming) need manual Origin/Referer validation.
 */
export function validateOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  // In development, allow localhost
  if (process.env.NODE_ENV === "development") return true;

  const allowedOrigin = process.env.NEXT_PUBLIC_SITE_URL;
  if (!allowedOrigin) {
    // Fail CLOSED in production — missing config should block requests, not allow them
    console.error("[csrf] NEXT_PUBLIC_SITE_URL is not set. Blocking request.");
    return false;
  }

  if (origin) {
    return origin === allowedOrigin || origin === allowedOrigin.replace(/\/$/, "");
  }

  if (referer) {
    return referer.startsWith(allowedOrigin);
  }

  // No origin or referer header — reject (likely cross-origin POST)
  return false;
}
