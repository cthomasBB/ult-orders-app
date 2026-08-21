import type { UltOrderFeedItem } from "./feed";

// ─── Status level ──────────────────────────────────────────────────────────────
// Determined by ult_order_count on the user's profile

export type StatusLevel = "rookie" | "regular" | "curator" | "legend";

export function getStatusLevel(ultOrderCount: number): StatusLevel {
  if (ultOrderCount >= 100) return "legend";
  if (ultOrderCount >= 30)  return "curator";
  if (ultOrderCount >= 10)  return "regular";
  return "rookie";
}

export const STATUS_LABELS: Record<StatusLevel, string> = {
  rookie:  "Rookie",
  regular: "Regular",
  curator: "Curator",
  legend:  "Legend",
};

// ─── Full profile (fetched from public.users + join stats) ────────────────────

export type UserProfile = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  taste_tags: string[];
  city: string | null;
  is_verified: boolean;
  is_suggested: boolean;

  // Aggregate stats (from DB counters)
  follower_count: number;
  following_count: number;
  ult_order_count: number;

  // Derived
  status_level: StatusLevel;

  created_at: string;
};

// ─── Badge ────────────────────────────────────────────────────────────────────

export type UserBadge = {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon_url: string | null;
  category: string;
  is_featured: boolean;
  awarded_at: string;
};

// ─── Orders grouped by restaurant ────────────────────────────────────────────

export type RestaurantOrderGroup = {
  restaurant_id: string;
  restaurant_name: string;
  restaurant_cover_url: string | null;
  cuisine_type: string[];
  orders: UltOrderFeedItem[];
};

// ─── Viewer relationship state ────────────────────────────────────────────────

export type ViewerRelation = {
  is_following: boolean;
  is_followed_by: boolean;
  is_own_profile: boolean;
};
