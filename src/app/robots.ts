import type { MetadataRoute } from "next";

// Allow all crawlers (incl. AI search crawlers: OAI-SearchBot, PerplexityBot,
// Googlebot, Bingbot, etc.) onto public pages; keep them off API endpoints.
// Authenticated app routes are already gated by middleware (anonymous hits
// redirect to /login), so no content leaks there.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: "/api/" }],
    sitemap: "https://adaptable-one.vercel.app/sitemap.xml",
  };
}
