import { useState } from "react";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { MOCK_FEED_ITEMS, MOCK_SAVED_ITEMS } from "@/features/feed/mockData";
import { useFollowStore } from "@/features/feed/followStore";

const ALL_POSTS = [...MOCK_FEED_ITEMS, ...MOCK_SAVED_ITEMS];

function DeckCard({ item, onPress }: { item: any; onPress: () => void }) {
  const imageUrl = item.media?.[0]?.url ?? null;
  return (
    <TouchableOpacity style={[deckStyles.card, { overflow: "hidden" }]} onPress={onPress} activeOpacity={0.92}>
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

const TABS = ["Deck", "Orders", "Saved"];

export default function UserProfileScreen() {
  const { username } = useLocalSearchParams();
  const router = useRouter();
  const { isFollowing, toggleFollow } = useFollowStore();
  const [activeTab, setActiveTab] = useState("Deck");

  const usernameStr = String(username);
  const following = isFollowing(usernameStr);

  const userPosts = ALL_POSTS.filter(
    (item) => item.author.username === usernameStr
  );
  const author = userPosts[0]?.author ?? null;
  const totalSaves = userPosts.reduce((sum, p) => sum + p.save_count, 0);
  const totalLikes = userPosts.reduce((sum, p) => sum + p.like_count, 0);
  const totalTried = userPosts.reduce((sum, p) => sum + p.try_count, 0);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#111" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={{ width: 30 }} />
        </View>

        {/* Profile section */}
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {author ? (author.display_name ?? author.username)[0].toUpperCase() : "?"}
            </Text>
          </View>
          <Text style={styles.displayName}>
            {author?.display_name ?? username}
            {author?.is_verified ? " ✓" : ""}
          </Text>
          <Text style={styles.username}>@{username}</Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{userPosts.length}</Text>
              <Text style={styles.statLabel}>Orders</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{totalSaves}</Text>
              <Text style={styles.statLabel}>Saves</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{totalLikes}</Text>
              <Text style={styles.statLabel}>Likes</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{totalTried}</Text>
              <Text style={styles.statLabel}>Tried</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.followBtn, following && styles.followBtnActive]}
            onPress={() => toggleFollow(usernameStr)}
          >
            <Text style={[styles.followBtnText, following && styles.followBtnTextActive]}>
              {following ? "Following" : "Follow"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tabs — only show when following */}
        {following ? (
          <>
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

            {activeTab === "Deck" && (
              <View style={styles.grid}>
                {userPosts.length === 0 ? (
                  <Text style={styles.empty}>No orders yet.</Text>
                ) : (
                  <>
                    {userPosts.length >= 2 && (
                      <View style={styles.gridRow}>
                        <DeckCard
                          item={userPosts[0]}
                          onPress={() => router.push(`/ult-order/${userPosts[0].id}` as any)}
                        />
                        <DeckCard
                          item={userPosts[1]}
                          onPress={() => router.push(`/ult-order/${userPosts[1].id}` as any)}
                        />
                      </View>
                    )}
                    {userPosts.length >= 3 && (
                      <View style={[styles.cardWide]}>
                        <DeckCard
                          item={userPosts[2]}
                          onPress={() => router.push(`/ult-order/${userPosts[2].id}` as any)}
                        />
                      </View>
                    )}
                    {userPosts.length === 1 && (
                      <View style={[styles.cardWide]}>
                        <DeckCard
                          item={userPosts[0]}
                          onPress={() => router.push(`/ult-order/${userPosts[0].id}` as any)}
                        />
                      </View>
                    )}
                  </>
                )}
              </View>
            )}

            {activeTab === "Orders" && (
              <View style={styles.postsList}>
                {userPosts.map((post) => (
                  <TouchableOpacity
                    key={post.id}
                    style={styles.postCard}
                    onPress={() => router.push(`/ult-order/${post.id}` as any)}
                  >
                    <View style={styles.postTop}>
                      <Text style={styles.postRestaurant}>{post.restaurant.name}</Text>
                      <Text style={styles.postPrice}>${(post.total / 100).toFixed(2)}</Text>
                    </View>
                    {post.title ? <Text style={styles.postTitle}>{post.title}</Text> : null}
                    {post.items.slice(0, 2).map((item) => (
                      <Text key={item.id} style={styles.postItem}>{item.quantity}x {item.name}</Text>
                    ))}
                    <View style={styles.postStats}>
                      <Text style={styles.postStat}>💾 {post.save_count}</Text>
                      <Text style={styles.postStat}>✅ {post.try_count}</Text>
                      <Text style={styles.postStat}>❤️ {post.like_count}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {activeTab === "Saved" && (
              <View style={styles.emptyTab}>
                <Ionicons name="bookmark-outline" size={40} color="#ccc" />
                <Text style={styles.emptyTitle}>Saved orders private</Text>
                <Text style={styles.emptySub}>Only visible to this user</Text>
              </View>
            )}
          </>
        ) : (
          /* Not following — show basic post list */
          <View style={styles.postsList}>
            <Text style={styles.sectionTitle}>ULT Orders</Text>
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
                  {post.title ? <Text style={styles.postTitle}>{post.title}</Text> : null}
                  {post.items.slice(0, 2).map((item) => (
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
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 16, fontWeight: "700", color: "#111" },
  profileSection: { alignItems: "center", paddingHorizontal: 24, paddingVertical: 20 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#C8472B", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  avatarText: { fontSize: 32, fontWeight: "700", color: "#fff" },
  displayName: { fontSize: 20, fontWeight: "800", color: "#111", marginBottom: 4 },
  username: { fontSize: 14, color: "#888", marginBottom: 16 },
  statsRow: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  statItem: { alignItems: "center", paddingHorizontal: 16 },
  statNum: { fontSize: 18, fontWeight: "800", color: "#111" },
  statLabel: { fontSize: 11, color: "#888", marginTop: 2 },
  statDivider: { width: 1, height: 30, backgroundColor: "#E5E5E5" },
  followBtn: { borderWidth: 1.5, borderColor: "#C8472B", borderRadius: 24, paddingHorizontal: 40, paddingVertical: 10 },
  followBtnActive: { backgroundColor: "#C8472B" },
  followBtnText: { color: "#C8472B", fontWeight: "700", fontSize: 15 },
  followBtnTextActive: { color: "#fff" },
  tabRow: { flexDirection: "row", marginHorizontal: 16, marginBottom: 16, backgroundColor: "#EFEFEF", borderRadius: 12, padding: 4 },
  tabBtn: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 10 },
  tabActive: { backgroundColor: "#fff", shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  tabText: { fontSize: 13, color: "#888", fontWeight: "500" },
  tabTextActive: { color: "#111", fontWeight: "700" },
  grid: { paddingHorizontal: 16, gap: 8, paddingBottom: 32 },
  gridRow: { flexDirection: "row", gap: 8, height: 160 },
  cardWide: { height: 200, marginHorizontal: 0 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#111", marginBottom: 12, paddingHorizontal: 16 },
  empty: { fontSize: 14, color: "#888", textAlign: "center", marginTop: 40 },
  postsList: { paddingHorizontal: 16, paddingBottom: 40 },
  postCard: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "#E5E5E5" },
  postTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  postRestaurant: { fontSize: 13, color: "#C8472B", fontWeight: "700" },
  postPrice: { fontSize: 13, fontWeight: "700", color: "#111" },
  postTitle: { fontSize: 15, fontWeight: "700", color: "#111", marginBottom: 6 },
  postItem: { fontSize: 13, color: "#555", marginBottom: 2 },
  postStats: { flexDirection: "row", gap: 12, marginTop: 10 },
  postStat: { fontSize: 13, color: "#888" },
  emptyTab: { alignItems: "center", paddingVertical: 60, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#111", marginTop: 16, marginBottom: 8 },
  emptySub: { fontSize: 13, color: "#888", textAlign: "center" },
});
