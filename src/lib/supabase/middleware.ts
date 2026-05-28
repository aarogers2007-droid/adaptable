import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { resolveTenant } from "@/lib/tenant/resolve";

export async function updateSession(request: NextRequest) {
  // Skip auth when Supabase isn't configured (local dev only)
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    if (process.env.NODE_ENV === "production") {
      // Fail closed in production: missing config = block all
      return new NextResponse("Server configuration error", { status: 500 });
    }
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session if expired
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ── Tenant resolution ──
  // Resolve org from subdomain and inject headers into the request.
  // Headers are overwritten unconditionally — prevents client spoofing.
  const hostname = request.headers.get("host") ?? "";
  const tenant = await resolveTenant(hostname);
  request.headers.set("x-tenant-id", tenant.id);
  request.headers.set("x-tenant-slug", tenant.slug);
  if (tenant.ragNamespace) {
    request.headers.set("x-tenant-rag-namespace", tenant.ragNamespace);
  } else {
    request.headers.delete("x-tenant-rag-namespace");
  }

  // Rebuild response to include tenant headers.
  // Preserve any cookies that setAll put on the previous response.
  const prevCookies = supabaseResponse.headers.getSetCookie();
  supabaseResponse = NextResponse.next({ request });
  for (const cookie of prevCookies) {
    supabaseResponse.headers.append("set-cookie", cookie);
  }

  // Detect branded subdomain (not the main Adaptable domain)
  const isBrandedSubdomain = tenant.id !== "00000000-0000-0000-0000-000000000001";

  // On branded subdomains, redirect root "/" to "/login" (branded login page)
  // Students should never see the generic Adaptable marketing homepage
  if (isBrandedSubdomain && request.nextUrl.pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = user ? "/dashboard" : "/login";
    return NextResponse.redirect(url);
  }

  // Redirect unauthenticated users to login (except public routes)
  const publicPaths = ["/", "/join", "/login", "/signup", "/teacher-signup", "/parent/view", "/auth/callback", "/auth/signout", "/for-schools", "/standards", "/demo", "/venture", "/privacy", "/c", "/go", "/start", "/api/stripe/webhook", "/terms"];
  const isPublicPath = publicPaths.some(
    (path) =>
      request.nextUrl.pathname === path ||
      request.nextUrl.pathname.startsWith("/parent/view") ||
      request.nextUrl.pathname.startsWith("/c/")
  );

  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
