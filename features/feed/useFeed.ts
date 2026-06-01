import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/services/supabase";
import { analytics } from "@/services/analytics";
import { useAuthStore } from "@/features/auth/authStore";
import { MOCK_FOLLOWING, MOCK_TRENDING, MOCK_NEARBY } from "./mockData";
import type { FeedType, UltOrderFeedItem } from "@/types/feed";

// ─── Config ───────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;
const USE_MOCK = false; // Near You only
const USE_MOCK_FOLLOWING = false; // Following feed uses real Supabase data

// ─── Supabase query helpers ───────────────────────────────────────────────────

const ULT_ORDER_SELECT = `
  id, user_id, restaurant_id,
  title, caption, status,
  total, currency,
  like_count, save_count, comment_count, try_count, view_count, trending_score,
  published_at, created_at, updated_at,
  author:users!user_id (
    id, username, display_name, avatar_url, is_verified
  ),
  restaurant:restaurants!restaurant_id (
    id, name, address, city, cuisine_type, average_rating, cover_image_url
  ),
  media:ult_order_media (
    id, media_type, url, thumbnail_url, sort_order
  ),
  items:ult_order_items (
    id, name, quantity, unit_price, notes, sort_order
  )
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
    media: (row.media ?? [])
      .sort((a: any, b: any) => a.sort_order - b.sort_order)
      .map((m: any) => ({
        ...m,
        width: m.width ?? null,
        height: m.height ?? null,
        duration_seconds: m.duration_seconds ?? null,
      })),
    items: (row.items ?? []).map((i: any) => ({
      ...i,
      notes: i.notes ?? null,
      dietary_tags: i.dietary_tags ?? [],
    })),
    tags: (row.tags ?? []).map((t: any) => t.tag?.name).filter(Boolean),
  };
}

// ─── Feed fetchers ────────────────────────────────────────────────────────────

async function fetchFollowingFeed(userId: string, page: number): Promise<UltOrderFeedItem[]> {
  if (USE_MOCK_FOLLOWING) {
    await new Promise((r) => setTimeout(r, 600));
    return MOCK_FOLLOWING.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  }

  // Step 1 — get the list of user IDs the current user follows
  const { data: followData, error: followError } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", userId);

  if (followError) throw followError;

  const followingIds = (followData ?? []).map((r: any) => r.following_id as string);
  // Always include your own posts in your Following feed
  if (!followingIds.includes(userId)) followingIds.push(userId);

  if (followingIds.length === 0) return [];

  // Step 2 — fetch published orders from those users
  const { data, error } = await supabase
    .from("ult_orders")
    .select(ULT_ORDER_SELECT)
    .eq("status", "published")
    .in("user_id", followingIds)
    .order("created_at", { ascending: false })
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

  if (error) throw error;
  return (data ?? []).map(normalise);
}

async function fetchTrendingFeed(page: number): Promise<UltOrderFeedItem[]> {
  const { data, error } = await supabase
    .from("ult_orders")
    .select(ULT_ORDER_SELECT)
    .eq("status", "published")
    .order("save_count", { ascending: false })
    .order("created_at", { ascending: false })
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
  if (error) throw error;
  return (data ?? []).map(normalise);
}

async function fetchNearbyFeed(lat: number, lng: number, page: number): Promise<UltOrderFeedItem[]> {
  const { data, error } = await supabase
    .from("ult_orders")
    .select(ULT_ORDER_SELECT)
    .eq("status", "published")
    .order("trending_score", { ascending: false })
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
  if (error) throw error;
  return (data ?? []).map(normalise);
}

// ─── React Query hooks ────────────────────────────────────────────────────────

export function useFollowingFeed() {
  const { user } = useAuthStore();
  return useInfiniteQuery({
    queryKey: ["feed", "following", user?.id],
    queryFn: ({ pageParam = 0 }) => fetchFollowingFeed(user?.id ?? "", pageParam),
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length < PAGE_SIZE ? undefined : allPages.length,
    initialPageParam: 0,
    enabled: !!user?.id,
    staleTime: 0,
  });
}

export function useTrendingFeed() {
  return useInfiniteQuery({
    queryKey: ["feed", "trending"],
    queryFn: ({ pageParam = 0 }) => fetchTrendingFeed(pageParam),
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length < PAGE_SIZE ? undefined : allPages.length,
    initialPageParam: 0,
    staleTime: 1000 * 60 * 3,
  });
}

export function useNearbyFeed(coords: { lat: number; lng: number } | null) {
  return useInfiniteQuery({
    queryKey: ["feed", "nearby", coords?.lat, coords?.lng],
    queryFn: ({ pageParam = 0 }) => fetchNearbyFeed(coords!.lat, coords!.lng, pageParam),
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length < PAGE_SIZE ? undefined : allPages.length,
    initialPageParam: 0,
    enabled: !!coords,
    staleTime: 1000 * 60 * 5,
  });
}

// ─── Engagement mutations ─────────────────────────────────────────────────────

export function useToggleLike() {
  const qc = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: async ({
      ultOrderId,
      currentlyLiked,
    }: {
      ultOrderId: string;
      currentlyLiked: boolean;
      restaurantId?: string;
    }) => {
      if (!user?.id) throw new Error("Not authenticated");
      if (currentlyLiked) {
        await supabase.from("likes").delete()
          .eq("user_id", user.id)
          .eq("ult_order_id", ultOrderId);
      } else {
        await supabase.from("likes").upsert({ user_id: user.id, ult_order_id: ultOrderId });
      }
    },
    onMutate: async ({ ultOrderId, currentlyLiked, restaurantId }) => {
      updateFeedCache(qc, ultOrderId, (item) => ({
        ...item,
        viewer_has_liked: !currentlyLiked,
        like_count: item.like_count + (currentlyLiked ? -1 : 1),
      }));
      // ── PostHog event ──
      analytics.capture(currentlyLiked ? "order_unliked" : "order_liked", {
        ult_order_id: ultOrderId,
        restaurant_id: restaurantId ?? "",
      });
    },
    onError: (_, { ultOrderId, currentlyLiked }) => {
      updateFeedCache(qc, ultOrderId, (item) => ({
        ...item,
        viewer_has_liked: currentlyLiked,
        like_count: item.like_count + (currentlyLiked ? 1 : -1),
      }));
    },
  });
}

export function useToggleSave() {
  const qc = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: async ({
      ultOrderId,
      currentlySaved,
    }: {
      ultOrderId: string;
      currentlySaved: boolean;
      restaurantId?: string;
    }) => {
      if (!user?.id) throw new Error("Not authenticated");
      if (currentlySaved) {
        await supabase.from("saves").delete()
          .eq("user_id", user.id)
          .eq("ult_order_id", ultOrderId);
      } else {
        await supabase.from("saves").upsert({ user_id: user.id, ult_order_id: ultOrderId });
      }
    },
    onMutate: async ({ ultOrderId, currentlySaved, restaurantId }) => {
      updateFeedCache(qc, ultOrderId, (item) => ({
        ...item,
        viewer_has_saved: !currentlySaved,
        save_count: item.save_count + (currentlySaved ? -1 : 1),
      }));
      // ── PostHog event ──
      analytics.capture(currentlySaved ? "order_unsaved" : "order_saved", {
        ult_order_id: ultOrderId,
        restaurant_id: restaurantId ?? "",
      });
    },
    onError: (_, { ultOrderId, currentlySaved }) => {
      updateFeedCache(qc, ultOrderId, (item) => ({
        ...item,
        viewer_has_saved: currentlySaved,
        save_count: item.save_count + (currentlySaved ? 1 : -1),
      }));
    },
  });
}

export function useToggleTried() {
  const qc = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: async ({
      ultOrderId,
      currentlyTried,
    }: {
      ultOrderId: string;
      currentlyTried: boolean;
      restaurantId?: string;
    }) => {
      if (!user?.id) throw new Error("Not authenticated");
      if (currentlyTried) {
        await supabase.from("tried_orders").delete()
          .eq("user_id", user.id)
          .eq("ult_order_id", ultOrderId);
      } else {
        await supabase.from("tried_orders").upsert({ user_id: user.id, ult_order_id: ultOrderId });
      }
    },
    onMutate: async ({ ultOrderId, currentlyTried, restaurantId }) => {
      updateFeedCache(qc, ultOrderId, (item) => ({
        ...item,
        viewer_has_tried: !currentlyTried,
        try_count: item.try_count + (currentlyTried ? -1 : 1),
      }));
      // ── PostHog event ──
      analytics.capture(currentlyTried ? "order_untried" : "order_tried", {
        ult_order_id: ultOrderId,
        restaurant_id: restaurantId ?? "",
      });
    },
    onError: (_, { ultOrderId, currentlyTried }) => {
      updateFeedCache(qc, ultOrderId, (item) => ({
        ...item,
        viewer_has_tried: currentlyTried,
        try_count: item.try_count + (currentlyTried ? 1 : -1),
      }));
    },
  });
}

// ─── Cache helpers ────────────────────────────────────────────────────────────

function updateFeedCache(
  qc: ReturnType<typeof useQueryClient>,
  ultOrderId: string,
  updater: (item: UltOrderFeedItem) => UltOrderFeedItem
) {
  const keys = [
    ["feed", "following"],
    ["feed", "trending"],
    ["feed", "nearby"],
  ];
  keys.forEach((baseKey) => {
    qc.setQueriesData<{ pages: UltOrderFeedItem[][] }>(
      { queryKey: baseKey, exact: false },
      (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) =>
            page.map((item) =>
              item.id === ultOrderId ? updater(item) : item
            )
          ),
        };
      }
    );
  });
}

/** Format an engagement count: 1234 → "1.2k" */
export function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}m`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}
