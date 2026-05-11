import "server-only";
import { headers } from "next/headers";
import type { TenantInfo } from "./types";

/**
 * Read tenant info injected by middleware.
 * For server components and page.tsx files ONLY.
 *
 * Server actions must NOT use this — x-tenant headers can be spoofed
 * if someone calls the action API directly. Server actions should
 * read org_id from the authenticated user's profile instead.
 */
export async function getTenant(): Promise<TenantInfo> {
  const h = await headers();
  const id = h.get("x-tenant-id") ?? "00000000-0000-0000-0000-000000000001";
  const slug = h.get("x-tenant-slug") ?? "adaptable";
  const ragNamespace = h.get("x-tenant-rag-namespace") ?? null;

  return { id, slug, ragNamespace };
}
