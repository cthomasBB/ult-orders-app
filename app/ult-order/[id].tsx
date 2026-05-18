import { useLocalSearchParams, useRouter } from "expo-router";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { MOCK_FEED_ITEMS, MOCK_SAVED_ITEMS, MOCK_MY_ORDERS } from "@/features/feed/mockData";
import { useFollowStore } from "@/features/feed/followStore";

const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { isFollowing, toggleFollow } = useFollowStore();
  const ALL_POSTS = [...MOCK_FEED_ITEMS, ...MOCK_SAVED_ITEMS, ...MOCK_MY_ORDERS];
  const post = ALL_POSTS.find((item) => item.id === String(id));

  if (!post) {
    return (
      <SafeAreaView style={styles.container}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>Back</Text>
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
          <TouchableOpacity
            style={[styles.followBtn, isFollowing(post.author.username) && styles.followBtnActive]}
            onPress={() => toggleFollow(post.author.username)}
          >
            <Text style={[styles.followBtnText, isFollowing(post.author.username) && styles.followBtnTextActive]}>
              {isFollowing(post.author.username) ? "Following" : "Follow"}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.photoArea}>
          {post.media && post.media.length > 0 ? (
            <Image source={{ uri: post.media[0].url }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
          ) : (
            <>
              <Text style={styles.photoEmoji}>🍽️</Text>
              <Text style={styles.photoLabel}>{post.restaurant.name}</Text>
            </>
          )}
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
          {post.items.map((item) => (
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
          <View style={styles.divider} />
          <View style={styles.tagsRow}>
            {post.tags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>
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
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { padding: 4 },
  backText: { fontSize: 16, color: "#C8472B" },
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
