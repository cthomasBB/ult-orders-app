import { useState, useEffect, useCallback } from "react";
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { MOCK_FEED_ITEMS, MOCK_SAVED_ITEMS, MOCK_MY_ORDERS } from "@/features/feed/mockData";
import { useFollowStore } from "@/features/feed/followStore";
import { useAuthStore } from "@/features/auth/authStore";
import { supabase } from "@/services/supabase";

// ─── Supabase fetch ───────────────────────────────────────────────────────────

async function fetchUserByUsername(username: string) {
  const { data, error } = await supabase
    .from("users")
    .select("id, username, display_name, avatar_url, is_verified, follower_count, following_count, ult_order_count, bio, taste_tags, is_active")
    .eq("username", username)
    .single();
  if (error) return null;
  return data;
}

async function fetchUserOrders(userId: string) {
  const { data, error } = await supabase
    .from("ult_orders")
    .select(`
      id, user_id, restaurant_id,
      title, caption, status,
      total, currency,
      like_count, save_count, comment_count, try_count, view_count,
      published_at, created_at,
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
    .eq("user_id", userId)
    .eq("status", "published")
    .order("published_at", { ascending: false });
  if (error) return [];
  return (data ?? []).map((row: any) => ({
    ...row,
    media: (row.media ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order).map((m: any) => ({ ...m, width: null, height: null, duration_seconds: null })),
    items: (row.items ?? []).map((i: any) => ({ ...i, notes: i.notes ?? null, dietary_tags: [] })),
    tags: [],
    viewer_has_liked: false,
    viewer_has_saved: false,
    viewer_has_tried: false,
  }));
}

// ─── Deck card ────────────────────────────────────────────────────────────────

function DeckCard({ item, onPress }: { item: any; onPress: () => void }) {
  const imageUrl = item.media?.[0]?.url ?? null;
  return (
    <TouchableOpacity style={[deckStyles.card, { overflow: "hidden", flex: 1 }]} onPress={onPress} activeOpacity={0.92}>
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
      ) : (
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: "#8B7355" }]} />
      )}
      <View style={deckStyles.overlay} />
      <View style={deckStyles.badge}>
        <Ionicons name="flame" size={10} color="#fff" />
        <Text style={deckStyles.badgeText}>{item.save_count}</Text>
      </View>
      <View style={deckStyles.footer}>
        <Text style={deckStyles.restaurant}>{item.restaurant.name.toUpperCase()}</Text>
        <Text style={deckStyles.title}>{item.title}</Text>
      </View>
    </TouchableOpacity>
  );
}

const deckStyles = StyleSheet.create({
  card: { borderRadius: 16, padding: 12, justifyContent: "space-between" },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.35)", borderRadius: 16 },
  badge: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(0,0,0,0.35)", alignSelf: "flex-end", borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, gap: 3 },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "600" },
  footer: { gap: 2 },
  restaurant: { fontSize: 9, color: "rgba(255,255,255,0.8)", fontWeight: "600", letterSpacing: 0.5 },
  title: { fontSize: 13, color: "#fff", fontWeight: "700", lineHeight: 17 },
});

const TABS = ["Deck", "Orders"];

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function UserProfileScreen() {
  const { username } = useLocalSearchParams();
  const router = useRouter();
  const { isFollowing, toggleFollow, registerUser } = useFollowStore();
  const { user: currentUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState("Deck");
  const [profileUser, setProfileUser] = useState<any>(null);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const usernameStr = String(username);

  useFocusEffect(useCallback(() => {
    async function load() {
      setIsLoading(true);

      // Try Supabase first
      const supabaseUser = await fetchUserByUsername(usernameStr);

      if (supabaseUser) {
        registerUser(supabaseUser.username, supabaseUser.id);
        const orders = await fetchUserOrders(supabaseUser.id);
        setProfileUser(supabaseUser);
        setUserPosts(orders);
        setIsLoading(false);
        return;
      }

      // Fall back to mock data
      const ALL_MOCK = [...MOCK_FEED_ITEMS, ...MOCK_SAVED_ITEMS, ...MOCK_MY_ORDERS];
      const mockPosts = ALL_MOCK.filter((item) => item.author.username === usernameStr);
      const mockAuthor = mockPosts[0]?.author ?? null;

      if (mockAuthor) {
        setProfileUser({
          id: mockAuthor.id,
          username: mockAuthor.username,
          display_name: mockAuthor.display_name,
          avatar_url: mockAuthor.avatar_url,
          is_verified: mockAuthor.is_verified,
          follower_count: 0,
          following_count: 0,
          ult_order_count: mockPosts.length,
          bio: null,
          taste_tags: [],
        });
        setUserPosts(mockPosts);
      }

      setIsLoading(false);
    }

    load();
  }, [usernameStr]));


  const following = isFollowing(profileUser?.id ?? usernameStr);

  const totalSaves = userPosts.reduce((sum, p) => sum + p.save_count, 0);
  const totalLikes = userPosts.reduce((sum, p) => sum + p.like_count, 0);

  const isOwnProfile = currentUser && profileUser && currentUser.id === profileUser.id;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#C8472B" />
        </View>
      </SafeAreaView>
    );
  }

  if (!profileUser) {
    return (
      <SafeAreaView style={styles.container}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#111" />
        </TouchableOpacity>
        <Text style={styles.notFound}>User not found.</Text>
      </SafeAreaView>
    );
  }

  const displayName = profileUser.display_name ?? profileUser.username;
  const avatarLetter = displayName[0].toUpperCase();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#111" />
          </TouchableOpacity>
          <View style={styles.avatarWrap}>
            {profileUser.avatar_url ? (
              <Image source={{ uri: profileUser.avatar_url }} style={styles.avatarImg} />
            ) : (
              <Text style={styles.avatarText}>{avatarLetter}</Text>
            )}
          </View>
          <View style={styles.headerInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.displayName}>{displayName}</Text>
              {profileUser.is_verified && (
                <Ionicons name="checkmark-circle" size={16} color="#C8472B" style={{ marginLeft: 4 }} />
              )}
            </View>
            <Text style={styles.handle}>@{profileUser.username}</Text>
          </View>
          {!isOwnProfile && (
            <TouchableOpacity
              style={[styles.followBtn, following && styles.followBtnActive]}
              onPress={() => {
                if (!currentUser?.id) return;
                toggleFollow(currentUser.id, profileUser.id, profileUser.username);
              }}
            >
              <Text style={[styles.followBtnText, following && styles.followBtnTextActive]}>
                {following ? "Following" : "Follow"}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Bio */}
        {profileUser.bio ? (
          <Text style={styles.bio}>{profileUser.bio}</Text>
        ) : null}

        {/* Taste tags */}
        {profileUser.taste_tags?.length > 0 && (
          <View style={styles.tags}>
            {profileUser.taste_tags.slice(0, 4).map((tag: string) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{userPosts.length}</Text>
            <Text style={styles.statLabel}>Orders</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statNum}>{profileUser.follower_count ?? 0}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statNum}>{totalSaves}</Text>
            <Text style={styles.statLabel}>Total Saves</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabRow}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabBtn, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Deck tab */}
        {activeTab === "Deck" && (
          <View style={styles.grid}>
            {userPosts.length === 0 ? (
              <Text style={styles.empty}>No orders yet.</Text>
            ) : (
              <>
                {/* Row 1: first two posts side by side */}
                {userPosts.length >= 1 && (
                  <View style={styles.gridRow}>
                    {userPosts.slice(0, 2).map((post) => (
                      <View key={post.id} style={styles.gridCell}>
                        <DeckCard
                          item={post}
                          onPress={() => router.push(`/ult-order/${post.id}` as any)}
                        />
                      </View>
                    ))}
                  </View>
                )}
                {/* Row 2: wide single post */}
                {userPosts.length >= 3 && (
                  <View style={styles.gridWide}>
                    <DeckCard
                      item={userPosts[2]}
                      onPress={() => router.push(`/ult-order/${userPosts[2].id}` as any)}
                    />
                  </View>
                )}
                {/* Row 3: next two posts side by side */}
                {userPosts.length >= 4 && (
                  <View style={styles.gridRow}>
                    {userPosts.slice(3, 5).map((post) => (
                      <View key={post.id} style={styles.gridCell}>
                        <DeckCard
                          item={post}
                          onPress={() => router.push(`/ult-order/${post.id}` as any)}
                        />
                      </View>
                    ))}
                  </View>
                )}
                {/* Row 4: any remaining posts */}
                {userPosts.length >= 6 && (
                  <View style={styles.gridRow}>
                    {userPosts.slice(5, 7).map((post) => (
                      <View key={post.id} style={styles.gridCell}>
                        <DeckCard
                          item={post}
                          onPress={() => router.push(`/ult-order/${post.id}` as any)}
                        />
                      </View>
                    ))}
                  </View>
                )}
              </>
            )}
          </View>
        )}

        {/* Orders tab */}
        {activeTab === "Orders" && (
          <View style={styles.postsList}>
            {userPosts.length === 0 ? (
              <Text style={styles.empty}>No orders yet.</Text>
            ) : (
              userPosts.map((post) => (
                <TouchableOpacity
                  key={post.id}
                  style={styles.postCard}
                  onPress={() => router.push(`/ult-order/${post.id}` as any)}
                >
                  <View style={styles.postTop}>
                    <Text style={styles.postRestaurant}>{post.restaurant.name}</Text>
                    <Text style={styles.postPrice}>${(post.total / 100).toFixed(2)}</Text>
                  </View>
                  <Text style={styles.postTitle} numberOfLines={1}>{post.title}</Text>
                  {post.items.slice(0, 2).map((item: any) => (
                    <Text key={item.id} style={styles.postItem}>{item.quantity}x {item.name}</Text>
                  ))}
                  <View style={styles.postStats}>
                    <Text style={styles.postStat}>💾 {post.save_count}</Text>
                    <Text style={styles.postStat}>✅ {post.try_count}</Text>
                    <Text style={styles.postStat}>❤️ {post.like_count}</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9F9F8" },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  notFound: { fontSize: 18, color: "#999", textAlign: "center", marginTop: 60 },
  backBtn: { padding: 4, marginBottom: 12 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, gap: 12 },
  avatarWrap: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#C8472B", alignItems: "center", justifyContent: "center" },
  avatarImg: { width: 56, height: 56, borderRadius: 28 },
  avatarText: { fontSize: 24, fontWeight: "700", color: "#fff" },
  headerInfo: { flex: 1 },
  nameRow: { flexDirection: "row", alignItems: "center" },
  displayName: { fontSize: 18, fontWeight: "700", color: "#111" },
  handle: { fontSize: 13, color: "#888", marginTop: 2 },
  followBtn: { borderWidth: 1.5, borderColor: "#C8472B", borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6 },
  followBtnActive: { backgroundColor: "#C8472B" },
  followBtnText: { color: "#C8472B", fontWeight: "600", fontSize: 13 },
  followBtnTextActive: { color: "#fff" },
  bio: { paddingHorizontal: 16, fontSize: 14, color: "#333", lineHeight: 20, marginBottom: 12 },
  tags: { flexDirection: "row", paddingHorizontal: 16, gap: 8, marginBottom: 16, flexWrap: "wrap" },
  tag: { backgroundColor: "#F0EDE8", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  tagText: { fontSize: 12, color: "#555", fontWeight: "500" },
  statsRow: { flexDirection: "row", marginHorizontal: 16, backgroundColor: "#fff", borderRadius: 16, paddingVertical: 16, marginBottom: 20, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  stat: { flex: 1, alignItems: "center" },
  statDivider: { width: 1, backgroundColor: "#E5E5E5" },
  statNum: { fontSize: 20, fontWeight: "700", color: "#111" },
  statLabel: { fontSize: 12, color: "#888", marginTop: 2 },
  tabRow: { flexDirection: "row", marginHorizontal: 16, marginBottom: 16, backgroundColor: "#EFEFEF", borderRadius: 12, padding: 4 },
  tabBtn: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 10 },
  tabActive: { backgroundColor: "#fff", shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  tabText: { fontSize: 13, color: "#888", fontWeight: "500" },
  tabTextActive: { color: "#111", fontWeight: "700" },
  grid: { paddingHorizontal: 16, gap: 8, paddingBottom: 32 },
  gridRow: { flexDirection: "row", gap: 8, height: 160 },
  gridCell: { flex: 1, height: 160 },
  gridWide: { height: 200 },
  empty: { textAlign: "center", color: "#999", marginTop: 40, fontSize: 14 },
  postsList: { paddingHorizontal: 16, paddingBottom: 40 },
  postCard: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "#E5E5E5" },
  postTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  postRestaurant: { fontSize: 13, color: "#C8472B", fontWeight: "700" },
  postPrice: { fontSize: 13, fontWeight: "700", color: "#111" },
  postTitle: { fontSize: 15, fontWeight: "700", color: "#111", marginBottom: 6 },
  postItem: { fontSize: 13, color: "#555", marginBottom: 2 },
  postStats: { flexDirection: "row", gap: 12, marginTop: 10 },
  postStat: { fontSize: 13, color: "#888" },
});
