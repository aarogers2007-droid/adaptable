import type { MetadataRoute } from "next";

const BASE = "https://adaptable-one.vercel.app";

// Public, indexable pages only. Authenticated app routes are excluded (they
// redirect anonymous visitors to /login).
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${BASE}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/ask`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/start`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/terms`, changeFrequency: "yearly", priority: 0.3 },
  ];
}
