// ─── UltOrder feed types ──────────────────────────────────────────────────────
// The "UltOrder" is the core social object: a user's documented food order
// that appears in the feed. It wraps a real order and adds social metadata.

export type UltOrderStatus = "draft" | "published" | "unlisted" | "archived" | "removed";

export type FeedAuthor = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  is_verified: boolean;
};

export type FeedRestaurant = {
  id: string;
  name: string;
  address: string;
  city: string | null;
  cuisine_type: string[];
  average_rating: number;
  cover_image_url: string | null;
};

export type FeedMedia = {
  id: string;
  media_type: "photo" | "video";
  url: string;
  thumbnail_url: string | null;
  width: number | null;
  height: number | null;
  duration_seconds: number | null;
  sort_order: number;
};

export type FeedOrderItem = {
  id: string;
  name: string;
  quantity: number;
  unit_price: number;
  notes: string | null;
  dietary_tags: string[];
};

export type UltOrderFeedItem = {
  // Identity
  id: string;
  user_id: string;
  restaurant_id: string;

  // Content
  title: string | null;
  caption: string | null;
  status: UltOrderStatus;

  // Financials
  total: number;   // cents
  currency: string;

  // Relationships (joined)
  author: FeedAuthor;
  restaurant: FeedRestaurant;
  media: FeedMedia[];
  items: FeedOrderItem[];
  tags: string[];

  // Engagement counters
  like_count: number;
  save_count: number;
  comment_count: number;
  try_count: number;
  view_count: number;
  trending_score: number;

  // Viewer-specific state (populated client-side from stores)
  viewer_has_liked?: boolean;
  viewer_has_saved?: boolean;
  viewer_has_tried?: boolean;

  // Timestamps
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

// Feed type for the three segments
export type FeedType = "following" | "trending" | "nearby";

// Pagination cursor
export type FeedCursor = {
  page: number;
  hasMore: boolean;
};
