/**
 * Maps free-text business niches from the Ikigai wizard into
 * sponsor-friendly categories for the admin dashboard.
 */

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "Food & Beverage": ["food", "cook", "bak", "pizza", "restaurant", "cafe", "coffee", "snack", "meal", "recipe", "kitchen", "catering", "lemonade", "candy", "cake"],
  "Services": ["tutor", "teach", "clean", "walk", "pet", "lawn", "babysit", "car wash", "repair", "organiz", "errand", "coaching", "consult", "groom", "sit"],
  "Technology": ["app", "tech", "code", "game", "software", "web", "robot", "program", "comput", "digital", "cyber", "hack"],
  "Creative": ["art", "music", "draw", "photo", "video", "design", "paint", "craft", "jewel", "fashion", "style", "film", "animat", "writing", "blog", "content"],
  "Retail": ["sell", "shop", "store", "product", "merch", "resell", "thrift", "cloth", "brand", "custom"],
  "Health & Fitness": ["fitness", "gym", "health", "yoga", "sport", "train", "nutri", "wellness", "meditat"],
};

export function categorizeNiche(niche: string): string {
  const lower = niche.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return category;
    }
  }
  return "Other";
}

export const CATEGORY_COLORS: Record<string, string> = {
  "Food & Beverage": "#F59E0B",
  "Services": "#3B82F6",
  "Technology": "#8B5CF6",
  "Creative": "#EC4899",
  "Retail": "#10B981",
  "Health & Fitness": "#EF4444",
  "Other": "#6B7280",
};
