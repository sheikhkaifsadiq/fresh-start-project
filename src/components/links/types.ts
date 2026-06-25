/**
 * @file src/components/links/types.ts
 * @description Domain type for a Link row. Mirrors the legacy
 * `LinkRecord` from
 * `legacy/compliance-link-router/src/components/links/LinksDataTable.tsx`
 * so existing Supabase queries return the same shape with no adapter.
 */

export type LinkRecord = {
  id: string;
  destination_url: string;
  slug: string;
  active: boolean;
  created_at: string;
  click_count: number;
  user_id: string;
  is_shielded?: boolean;
  tags?: string[];
  expiration_date?: string;
};

export type SortField = "created_at" | "click_count" | "slug" | "destination_url";
export type SortOrder = "asc" | "desc";
