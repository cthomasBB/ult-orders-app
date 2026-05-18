import { useState } from "react";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuthStore } from "@/features/auth/authStore";
import { MOCK_MY_ORDERS, MOCK_SAVED_ITEMS } from "@/features/feed/mockData";
import { Colors } from "@/constants/colors";

const TABS = ["Deck", "Orders", "Saved"];

function DeckCard({ item, onPress, style }: { item: any; onPress: () => void; style: any }) {
  const imageUrl = item.media?.[0]?.url ?? null;
  return (
    <TouchableOpacity style={[style, { overflow: "hidden" }]} onPress={onPress} activeOpacity={0.92}>
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
      ) : (
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: "#8B7355" }]} />
      )}
      <View style={styles.cardOverlay} />
      <View style={styles.likeBadge}>
        <Ionicons name="flame" size={10} color="#fff" />
        <Text style={styles.likeCount}>{item.save_count}</Text>
      </View>
      <View style={styles.cardFooter}>
        <Text style={styles.cardRestaurant}>{item.restaurant.name.toUpperCase()}</Text>
        <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const [activeTab, setActiveTab] = useState("Deck");
  const { user, publicUser, signOut } = useAuthStore();

  const displayName = publicUser?.display_name ?? publicUser?.username ?? user?.email?.split("@")[0] ?? "You";
  const username = publicUser?.username ?? user?.email?.split("@")[0] ?? "you";
  const avatarLetter = displayName[0].toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    router.replace("/(auth)/sign-in");
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarWrap}>
            {publicUser?.avatar_url ? (
              <Image source={{ uri: publicUser.avatar_url }} style={styles.avatarImg} />
            ) : (
              <Text style={styles.avatarText}>{avatarLetter}</Text>
            )}
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.displayName}>{displayName}</Text>
            <Text style={styles.handle}>@{username} · Las Vegas, NV</Text>
          </View>
          <TouchableOpacity style={styles.editBtn} onPress={handleSignOut}>
            <Text style={styles.editBtnText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* Bio */}
        <Text style={styles.bio}>Building the future of food discovery. 🍽️ Las Vegas local.</Text>

        {/* Taste tags */}
        <View style={styles.tags}>
          {["Steakhouse", "Ramen", "Pizza", "Late Night"].map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{MOCK_MY_ORDERS.length}</Text>
            <Text style={styles.statLabel}>Orders</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statNum}>1.2k</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statNum}>84</Text>
            <Text style={styles.statLabel}>Following</Text>
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
            <View style={styles.gridRow}>
              <DeckCard
                item={MOCK_MY_ORDERS[0]}
                style={styles.cardSmall}
                onPress={() => router.push(`/ult-order/${MOCK_MY_ORDERS[0].id}` as any)}
              />
              <DeckCard
                item={MOCK_MY_ORDERS[1]}
                style={styles.cardSmall}
                onPress={() => router.push(`/ult-order/${MOCK_MY_ORDERS[1].id}` as any)}
              />
            </View>
            <DeckCard
              item={MOCK_MY_ORDERS[2]}
              style={styles.cardWide}
              onPress={() => router.push(`/ult-order/${MOCK_MY_ORDERS[2].id}` as any)}
            />
            <View style={styles.gridRow}>
              <DeckCard
                item={MOCK_MY_ORDERS[3]}
                style={styles.cardSmall}
                onPress={() => router.push(`/ult-order/${MOCK_MY_ORDERS[3].id}` as any)}
              />
              <TouchableOpacity
                style={[styles.cardSmall, styles.cardAdd]}
                onPress={() => router.push("/create/restaurant" as any)}
              >
                <Ionicons name="add" size={32} color="#C8472B" />
                <Text style={styles.addText}>Add Order</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Orders tab */}
        {activeTab === "Orders" && (
          <View style={styles.postsList}>
            {MOCK_MY_ORDERS.map((post) => (
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

        {/* Saved tab */}
        {activeTab === "Saved" && (
          <View style={styles.postsList}>
            {MOCK_SAVED_ITEMS.slice(0, 3).map((post) => (
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

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9F9F8" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 },
  avatarWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#C8472B", alignItems: "center", justifyContent: "center", marginRight: 12 },
  avatarImg: { width: 64, height: 64, borderRadius: 32 },
  avatarText: { fontSize: 28, fontWeight: "700", color: "#fff" },
  headerInfo: { flex: 1 },
  displayName: { fontSize: 20, fontWeight: "700", color: "#111" },
  handle: { fontSize: 13, color: "#888", marginTop: 2 },
  editBtn: { borderWidth: 1.5, borderColor: "#C8472B", borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6 },
  editBtnText: { color: "#C8472B", fontWeight: "600", fontSize: 13 },
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
  cardSmall: { flex: 1, height: 160, borderRadius: 16, padding: 12, justifyContent: "space-between" },
  cardWide: { height: 200, borderRadius: 16, padding: 12, justifyContent: "space-between" },
  cardAdd: { backgroundColor: "#F0EDE8", alignItems: "center", justifyContent: "center" },
  addText: { color: "#C8472B", fontWeight: "600", fontSize: 12, marginTop: 4 },
  cardOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.35)", borderRadius: 16 },
  likeBadge: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(0,0,0,0.35)", alignSelf: "flex-end", borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, gap: 3 },
  likeCount: { color: "#fff", fontSize: 11, fontWeight: "600" },
  cardFooter: { gap: 2 },
  cardRestaurant: { fontSize: 9, color: "rgba(255,255,255,0.8)", fontWeight: "600", letterSpacing: 0.5 },
  cardTitle: { fontSize: 13, color: "#fff", fontWeight: "700", lineHeight: 17 },
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
