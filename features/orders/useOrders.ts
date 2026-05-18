import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/services/supabase";
import type { UltOrderFeedItem } from "@/types/feed";
import type { RestaurantOrderGroup } from "@/types/profile";

// ─── Fetch ────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

const ULT_ORDER_SELECT = `
  id, user_id, restaurant_id,
  title, caption, status,
  total, currency,
  like_count, save_count, comment_count, try_count, view_count, trending_score,
  is_pinned, pin_order,
  published_at, created_at, updated_at,
  author:users!user_id (
    id, username, display_name, avatar_url, is_verified
  ),
  restaurant:restaurants!restaurant_id (
    id, name, address, city, cuisine_type, average_rating, cover_image_url
  ),
  media:ult_order_media (
    id, media_type, url, thumbnail_url, width, height, duration_seconds, sort_order
  ),
  items:ult_order_items (
    id, name, quantity, unit_price, notes, dietary_tags
  ),
  tags:ult_order_tags ( tag:tags!tag_id ( name ) )
`;

function normalise(row: any): UltOrderFeedItem {
  return {
    ...row,
    author: row.author ?? {
      id: row.user_id,
      username: "unknown",
      display_name: null,
      avatar_url: null,
      is_verified: false,
    },
    restaurant: row.restaurant ?? {
      id: row.restaurant_id,
      name: "Restaurant",
      address: "",
      city: null,
      cuisine_type: [],
      average_rating: 0,
      cover_image_url: null,
    },
    media: (row.media ?? []).sort(
      (a: any, b: any) => a.sort_order - b.sort_order
    ),
    items: row.items ?? [],
    tags: (row.tags ?? []).map((t: any) => t.tag?.name).filter(Boolean),
  };
}

async function fetchUserOrders(
  userId: string,
  page: number
): Promise<UltOrderFeedItem[]> {
  const { data, error } = await supabase
    .from("ult_orders")
    .select(ULT_ORDER_SELECT)
    .eq("user_id", userId)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

  if (error) throw error;
  return (data ?? []).map(normalise);
}

/** Group a flat list of ult_orders by their restaurant */
export function groupByRestaurant(
  orders: UltOrderFeedItem[]
): RestaurantOrderGroup[] {
  const map = new Map<string, RestaurantOrderGroup>();

  for (const order of orders) {
    const rid = order.restaurant_id;
    if (!map.has(rid)) {
      map.set(rid, {
        restaurant_id: rid,
        restaurant_name: order.restaurant.name,
        restaurant_cover_url: order.restaurant.cover_image_url,
        cuisine_type: order.restaurant.cuisine_type,
        orders: [],
      });
    }
    map.get(rid)!.orders.push(order);
  }

  // Sort groups by most recent order
  return Array.from(map.values()).sort(
    (a, b) =>
      new Date(b.orders[0].created_at).getTime() -
      new Date(a.orders[0].created_at).getTime()
  );
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useUserOrders(userId: string | undefined) {
  return useInfiniteQuery({
    queryKey: ["user-orders", userId],
    queryFn: ({ pageParam = 0 }) => fetchUserOrders(userId!, pageParam),
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length < PAGE_SIZE ? undefined : allPages.length,
    initialPageParam: 0,
    enabled: !!userId,
    staleTime: 1000 * 60 * 2,
  });
}

/** Derive top-N cuisine tags from a user's orders */
export function deriveTopTags(orders: UltOrderFeedItem[], n = 3): string[] {
  const counts: Record<string, number> = {};
  for (const order of orders) {
    for (const cuisine of order.restaurant.cuisine_type) {
      counts[cuisine] = (counts[cuisine] ?? 0) + 1;
    }
    for (const tag of order.tags) {
      counts[tag] = (counts[tag] ?? 0) + 1;
    }
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([tag]) => tag);
}
