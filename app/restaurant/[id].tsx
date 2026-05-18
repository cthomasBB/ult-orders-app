import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { MOCK_FEED_ITEMS } from "@/features/feed/mockData";

export default function RestaurantScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const restaurantPosts = MOCK_FEED_ITEMS.filter(
    (item) => item.restaurant.id === String(id)
  );
  const restaurant = restaurantPosts[0]?.restaurant ?? null;
  const totalSaves = restaurantPosts.reduce((sum, p) => sum + p.save_count, 0);
  const totalLikes = restaurantPosts.reduce((sum, p) => sum + p.like_count, 0);
  const avgRating = restaurant?.average_rating ?? 0;

  if (!restaurant) {
    return (
      <SafeAreaView style={styles.container}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#111" />
        </TouchableOpacity>
        <View style={styles.center}>
          <Text style={styles.notFound}>Restaurant not found.</Text>
        </View>
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
          <Text style={styles.headerTitle}>Restaurant</Text>
          <View style={{ width: 30 }} />
        </View>

        <View style={styles.heroSection}>
          <View style={styles.heroImage}>
            <Text style={styles.heroEmoji}>🍽️</Text>
          </View>
          <View style={styles.heroInfo}>
            <Text style={styles.restaurantName}>{restaurant.name}</Text>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={14} color="#F59E0B" />
              <Text style={styles.rating}>{avgRating.toFixed(1)}</Text>
            </View>
            <View style={styles.cuisineRow}>
              {restaurant.cuisine_type.map((c) => (
                <View key={c} style={styles.cuisineTag}>
                  <Text style={styles.cuisineText}>{c}</Text>
                </View>
              ))}
            </View>
            <View style={styles.addressRow}>
              <Ionicons name="location-outline" size={13} color="#888" />
              <Text style={styles.address}>{restaurant.address}</Text>
            </View>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{restaurantPosts.length}</Text>
            <Text style={styles.statLabel}>ULT Orders</Text>
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
        </View>

        <View style={styles.postsSection}>
          <Text style={styles.sectionTitle}>ULT Orders from here</Text>
          {restaurantPosts.length === 0 ? (
            <Text style={styles.empty}>No orders yet.</Text>
          ) : (
            restaurantPosts.map((post) => (
              <TouchableOpacity
                key={post.id}
                style={styles.postCard}
                onPress={() => router.push(`/ult-order/${post.id}` as any)}
              >
                <View style={styles.postHeader}>
                  <View style={styles.postAvatar}>
                    <Text style={styles.postAvatarText}>
                      {(post.author.display_name ?? post.author.username)[0].toUpperCase()}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.postAuthor}>
                      {post.author.display_name ?? post.author.username}
                      {post.author.is_verified ? " ✓" : ""}
                    </Text>
                    <Text style={styles.postUsername}>@{post.author.username}</Text>
                  </View>
                  <Text style={styles.postPrice}>${(post.total / 100).toFixed(2)}</Text>
                </View>
                {post.title ? (
                  <Text style={styles.postTitle}>{post.title}</Text>
                ) : null}
                {post.items.slice(0, 2).map((item) => (
                  <Text key={item.id} style={styles.postItem}>
                    {item.quantity}x {item.name}
                  </Text>
                ))}
                {post.items.length > 2 ? (
                  <Text style={styles.postMore}>+{post.items.length - 2} more items</Text>
                ) : null}
                <View style={styles.postStats}>
                  <Text style={styles.postStat}>💾 {post.save_count}</Text>
                  <Text style={styles.postStat}>✅ {post.try_count}</Text>
                  <Text style={styles.postStat}>❤️ {post.like_count}</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9F9F8" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 16, fontWeight: "700", color: "#111" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  notFound: { fontSize: 18, color: "#999", textAlign: "center", marginTop: 60 },
  heroSection: { backgroundColor: "#fff", marginBottom: 8 },
  heroImage: { width: "100%", height: 200, backgroundColor: "#8B7355", alignItems: "center", justifyContent: "center" },
  heroEmoji: { fontSize: 64 },
  heroInfo: { padding: 16 },
  restaurantName: { fontSize: 22, fontWeight: "800", color: "#111", marginBottom: 6 },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 8 },
  rating: { fontSize: 14, fontWeight: "700", color: "#111" },
  cuisineRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 8 },
  cuisineTag: { backgroundColor: "#F0EDE8", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  cuisineText: { fontSize: 12, color: "#555", fontWeight: "600" },
  addressRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  address: { fontSize: 13, color: "#888", flex: 1 },
  statsRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", paddingVertical: 16, marginBottom: 8 },
  statItem: { flex: 1, alignItems: "center" },
  statNum: { fontSize: 18, fontWeight: "800", color: "#111" },
  statLabel: { fontSize: 11, color: "#888", marginTop: 2 },
  statDivider: { width: 1, height: 30, backgroundColor: "#E5E5E5" },
  postsSection: { paddingHorizontal: 16, paddingBottom: 40 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#111", marginBottom: 12 },
  empty: { fontSize: 14, color: "#888", textAlign: "center", marginTop: 40 },
  postCard: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "#E5E5E5" },
  postHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  postAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#C8472B", alignItems: "center", justifyContent: "center" },
  postAvatarText: { fontSize: 14, fontWeight: "700", color: "#fff" },
  postAuthor: { fontSize: 13, fontWeight: "700", color: "#111" },
  postUsername: { fontSize: 11, color: "#888" },
  postPrice: { marginLeft: "auto", fontSize: 14, fontWeight: "800", color: "#111" },
  postTitle: { fontSize: 15, fontWeight: "700", color: "#111", marginBottom: 6 },
  postItem: { fontSize: 13, color: "#555", marginBottom: 2 },
  postMore: { fontSize: 12, color: "#C8472B", fontWeight: "600", marginTop: 4 },
  postStats: { flexDirection: "row", gap: 12, marginTop: 10 },
  postStat: { fontSize: 13, color: "#888" },
});
