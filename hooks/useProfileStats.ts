import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/services/supabase";

type ProfileStats = {
  orderCount: number;
  reviewCount: number;
  savedCount: number;
};

async function fetchStats(userId: string): Promise<ProfileStats> {
  const [orders, reviews, saved] = await Promise.all([
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("customer_id", userId),
    supabase
      .from("reviews")
      .select("id", { count: "exact", head: true })
      .eq("customer_id", userId),
    supabase
      .from("saved_restaurants")
      .select("restaurant_id", { count: "exact", head: true })
      .eq("user_id", userId),
  ]);

  return {
    orderCount: orders.count ?? 0,
    reviewCount: reviews.count ?? 0,
    savedCount: saved.count ?? 0,
  };
}

export function useProfileStats(userId: string | undefined) {
  return useQuery({
    queryKey: ["profile-stats", userId],
    queryFn: () => fetchStats(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 2, // 2 min
  });
}
