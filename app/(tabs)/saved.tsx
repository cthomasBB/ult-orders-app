import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { Colors } from "@/constants/colors";
import { FeedCard } from "@/components/feed/FeedCard";
import { supabase } from "@/services/supabase";
import { useAuthStore } from "@/features/auth/authStore";

const SAVED_SELECT = `
  ult_order_id,
  order:ult_orders (
    id, user_id, restaurant_id,
    title, caption, status,
    total, currency,
    like_count, save_count, comment_count, try_count, view_count,
    published_at, created_at,
    author:users!user_id (id, username, display_name, avatar_url, is_verified),
    restaurant:restaurants!restaurant_id (id, name, address, city, cuisine_type, average_rating, cover_image_url),
    media:ult_order_media (id, media_type, url, thumbnail_url, sort_order),
    items:ult_order_items (id, name, quantity, unit_price, notes, sort_order)
  )
`;

async function fetchSavedOrders(userId: string) {
  const { data, error } = await supabase
    .from("saves")
    .select(SAVED_SELECT)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) { console.log("[Saved] error:", error.message); return []; }
  return (data ?? [])
    .map((r: any) => r.order)
    .filter(Boolean)
    .map((row: any) => ({
      ...row,
      media: (row.media ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order),
      items: (row.items ?? []),
      tags: [],
      viewer_has_liked: false,
      viewer_has_saved: true,
      viewer_has_tried: false,
    }));
}

export default function SavedScreen() {
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuthStore();

  useFocusEffect(
    useCallback(() => {
      async function load() {
        if (!user?.id) { setIsLoading(false); return; }
        setIsLoading(true);
        const saved = await fetchSavedOrders(user.id);
        setItems(saved);
        setIsLoading(false);
      }
      load();
    }, [user?.id])
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Saved</Text>
        {items.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{items.length}</Text>
          </View>
        )}
      </View>
      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.accent} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => <FeedCard item={item} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🔖</Text>
              <Text style={styles.emptyTitle}>Nothing saved yet</Text>
              <Text style={styles.emptySub}>
                Tap the bookmark on any order to save it here
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.surface },
  header: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
  title: { fontSize: 28, fontWeight: "800", color: Colors.ink, letterSpacing: -0.3 },
  countBadge: { backgroundColor: Colors.accent, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  countText: { fontSize: 14, fontWeight: "700", color: Colors.white },
  list: { paddingVertical: 12, paddingBottom: 40 },
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  empty: { alignItems: "center", paddingTop: 80, paddingHorizontal: 40, gap: 10 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 20, fontWeight: "800", color: Colors.ink },
  emptySub: { fontSize: 14, color: Colors.inkSecondary, textAlign: "center", lineHeight: 20 },
});
