import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { MOCK_FEED_ITEMS, MOCK_SAVED_ITEMS, MOCK_MY_ORDERS } from "@/features/feed/mockData";
import { useFollowStore } from "@/features/feed/followStore";
import { useAuthStore } from "@/features/auth/authStore";
import { supabase } from "@/services/supabase";
import { MediaCarousel } from "@/components/feed/MediaCarousel";

const { width: SCREEN_W } = Dimensions.get("window");
const PHOTO_H = Math.round(SCREEN_W * 3 / 4);
const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

// ─── Fetch order from Supabase ────────────────────────────────────────────────
async function fetchOrderById(id: string) {
  const { data, error } = await supabase
    .from("ult_orders")
    .select(`
      id, user_id, restaurant_id,
      title, caption, status,
      total, currency,
      like_count, save_count, comment_count, try_count, view_count,
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
    `)
    .eq("id", id)
    .single();

  if (error) return null;
  if (!data) return null;

  return {
    ...data,
    author: data.author ?? { id: data.user_id, username: "unknown", display_name: null, avatar_url: null, is_verified: false },
    restaurant: data.restaurant ?? { id: data.restaurant_id, name: "Restaurant", address: "", city: null, cuisine_type: [], average_rating: 0, cover_image_url: null },
    media: (data.media ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order).map((m: any) => ({ ...m, width: null, height: null, duration_seconds: null })),
    items: (data.items ?? []).map((i: any) => ({ ...i, notes: i.notes ?? null, dietary_tags: [] })),
    tags: [],
    viewer_has_liked: false,
    viewer_has_saved: false,
    viewer_has_tried: false,
  };
}

// ─── Follow button ────────────────────────────────────────────────────────────
function OrderDetailFollowButton({ post }: { post: any }) {
  const { isFollowing, toggleFollow, registerUser } = useFollowStore();
  const { user } = useAuthStore();

  useEffect(() => {
    registerUser(post.author.username, post.author.id);
  }, [post.author.username, post.author.id]);

  const following = isFollowing(post.author.id);
  if (user?.id === post.author.id) return null;

  return (
    <TouchableOpacity
      style={[styles.followBtn, following && styles.followBtnActive]}
      onPress={() => {
        if (!user?.id) return;
        toggleFollow(user.id, post.author.id, post.author.username);
      }}
    >
      <Text style={[styles.followBtnText, following && styles.followBtnTextActive]}>
        {following ? "Following" : "Follow"}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [post, setPost] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const postId = String(id);

    // Mock-only IDs (saved tab, no Supabase equivalent)
    const MOCK_ONLY_IDS = ["mock-saved-001", "mock-saved-002", "mock-saved-003", "mock-saved-004"];
    const ALL_MOCK = [...MOCK_FEED_ITEMS, ...MOCK_SAVED_ITEMS, ...MOCK_MY_ORDERS];

    if (MOCK_ONLY_IDS.includes(postId)) {
      // Saved tab posts — mock only, no Supabase record
      const mockPost = ALL_MOCK.find((item) => item.id === postId);
      setPost(mockPost ?? null);
      setIsLoading(false);
      return;
    }

    // All other posts — fetch from Supabase first (real data)
    fetchOrderById(postId).then((data) => {
      if (data) {
        setPost(data);
        setIsLoading(false);
        return;
      }
      // Fall back to mock if not found in Supabase
      const mockPost = ALL_MOCK.find((item) => item.id === postId);
      setPost(mockPost ?? null);
      setIsLoading(false);
    });
  }, [id]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#C8472B" />
        </View>
      </SafeAreaView>
    );
  }

  if (!post) {
    return (
      <SafeAreaView style={styles.container}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#111" />
        </TouchableOpacity>
        <Text style={styles.notFound}>Order not found.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#111" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>ULT Order</Text>
          <TouchableOpacity style={styles.moreBtn}>
            <Ionicons name="ellipsis-horizontal" size={22} color="#111" />
          </TouchableOpacity>
        </View>
        <View style={styles.authorSection}>
          <TouchableOpacity
            style={styles.authorRow}
            onPress={() => router.push(`/profile/${post.author.username}` as any)}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(post.author.display_name ?? post.author.username)[0].toUpperCase()}
              </Text>
            </View>
            <View style={styles.authorInfo}>
              <Text style={styles.authorName}>
                {post.author.display_name ?? post.author.username}
                {post.author.is_verified ? " ✓" : ""}
              </Text>
              <Text style={styles.authorHandle}>@{post.author.username}</Text>
            </View>
          </TouchableOpacity>
          <OrderDetailFollowButton post={post} />
        </View>
        <View style={styles.photoArea}>
          <MediaCarousel
            media={post.media ?? []}
            width={SCREEN_W}
            height={PHOTO_H}
            borderRadius={0}
            restaurantName={post.restaurant.name}
            showRestaurantPill
          />
        </View>
        <View style={styles.body}>
          <Text style={styles.title}>{post.title}</Text>
          {post.caption ? <Text style={styles.caption}>{post.caption}</Text> : null}
          <View style={styles.statsRow}>
            <View style={styles.statBtn}>
              <Ionicons name="bookmark-outline" size={20} color="#111" />
              <Text style={styles.statNum}>{post.save_count}</Text>
            </View>
            <View style={styles.statBtn}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#6B4FA0" />
              <Text style={[styles.statNum, { color: "#6B4FA0" }]}>{post.try_count}</Text>
            </View>
            <View style={styles.statBtn}>
              <Ionicons name="heart-outline" size={20} color="#111" />
              <Text style={styles.statNum}>{post.like_count}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <Text style={styles.sectionLabel}>WHAT THEY ORDERED</Text>
          {post.items.map((item: any) => (
            <View key={item.id} style={styles.itemRow}>
              <Text style={styles.itemQty}>{item.quantity}x</Text>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                {item.notes ? <Text style={styles.itemNote}>{item.notes}</Text> : null}
              </View>
            </View>
          ))}
          <View style={styles.priceRow}>
            <View style={styles.restaurantPill}>
              <Ionicons name="location-outline" size={13} color="#888" />
              <Text style={styles.restaurantText}>{post.restaurant.name}</Text>
            </View>
            <Text style={styles.price}>{formatPrice(post.total)}</Text>
          </View>
          {post.tags && post.tags.length > 0 && (
            <>
              <View style={styles.divider} />
              <View style={styles.tagsRow}>
                {post.tags.map((tag: string) => (
                  <View key={tag} style={styles.tag}>
                    <Text style={styles.tagText}>#{tag}</Text>
                  </View>
                ))}
              </View>
            </>
          )}
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.restaurantCTA}
            onPress={() => router.push(`/restaurant/${post.restaurant.id}` as any)}
          >
            <View>
              <Text style={styles.ctaTitle}>See all orders from</Text>
              <Text style={styles.ctaRestaurant}>{post.restaurant.name}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#C8472B" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9F9F8" },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 16, fontWeight: "700", color: "#111" },
  moreBtn: { padding: 4 },
  notFound: { fontSize: 18, color: "#999", textAlign: "center", marginTop: 60 },
  authorSection: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12 },
  authorRow: { flexDirection: "row", alignItems: "center", flex: 1 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#C8472B", alignItems: "center", justifyContent: "center", marginRight: 10 },
  avatarText: { fontSize: 18, fontWeight: "700", color: "#fff" },
  authorInfo: { flex: 1 },
  authorName: { fontSize: 15, fontWeight: "700", color: "#111" },
  authorHandle: { fontSize: 12, color: "#888", marginTop: 1 },
  followBtn: { borderWidth: 1.5, borderColor: "#C8472B", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5 },
  followBtnActive: { backgroundColor: "#C8472B" },
  followBtnTextActive: { color: "#fff" },
  followBtnText: { color: "#C8472B", fontWeight: "600", fontSize: 12 },
  photoArea: { width: "100%", height: 280, alignItems: "center", justifyContent: "center", backgroundColor: "#8B7355" },
  photoEmoji: { fontSize: 64 },
  photoLabel: { fontSize: 14, color: "rgba(255,255,255,0.8)", marginTop: 8, fontWeight: "600" },
  body: { padding: 16 },
  title: { fontSize: 22, fontWeight: "800", color: "#111", marginBottom: 8, lineHeight: 28 },
  caption: { fontSize: 15, color: "#444", lineHeight: 22, marginBottom: 16 },
  statsRow: { flexDirection: "row", gap: 20, marginBottom: 16 },
  statBtn: { flexDirection: "row", alignItems: "center", gap: 5 },
  statNum: { fontSize: 14, fontWeight: "600", color: "#111" },
  divider: { height: 1, backgroundColor: "#E5E5E5", marginVertical: 16 },
  sectionLabel: { fontSize: 12, fontWeight: "700", color: "#888", letterSpacing: 0.8, marginBottom: 12 },
  itemRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 10 },
  itemQty: { fontSize: 13, fontWeight: "700", color: "#C8472B", width: 28 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: "600", color: "#111" },
  itemNote: { fontSize: 12, color: "#888", marginTop: 2, fontStyle: "italic" },
  priceRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 12 },
  restaurantPill: { flexDirection: "row", alignItems: "center", gap: 4 },
  restaurantText: { fontSize: 13, color: "#888" },
  price: { fontSize: 18, fontWeight: "800", color: "#111" },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: { backgroundColor: "#F0EDE8", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  tagText: { fontSize: 12, color: "#555" },
  restaurantCTA: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#fff", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#E5E5E5" },
  ctaTitle: { fontSize: 12, color: "#888", marginBottom: 2 },
  ctaRestaurant: { fontSize: 16, fontWeight: "700", color: "#C8472B" },
});
