import { useState, useCallback } from "react";
import {
  ActivityIndicator, Alert, Image, Modal, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View, KeyboardAvoidingView, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useAuthStore } from "@/features/auth/authStore";
import { useUserProfile } from "@/features/profile/useProfile";
import { supabase } from "@/services/supabase";
import { Colors } from "@/constants/colors";

const TABS = ["Deck", "Orders", "Saved"];

const ORDER_SELECT = `
  id, user_id, restaurant_id,
  title, caption, status, is_deck,
  total, currency,
  like_count, save_count, comment_count, try_count, view_count,
  published_at, created_at,
  author:users!user_id (id, username, display_name, avatar_url, is_verified),
  restaurant:restaurants!restaurant_id (id, name, address, city, cuisine_type, average_rating, cover_image_url),
  media:ult_order_media (id, media_type, url, thumbnail_url, sort_order),
  items:ult_order_items (id, name, quantity, unit_price, notes, sort_order)
`;

function normaliseOrder(row: any) {
  return {
    ...row,
    media: (row.media ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order),
    items: row.items ?? [],
    tags: [],
    viewer_has_liked: false,
    viewer_has_saved: false,
    viewer_has_tried: false,
  };
}

async function fetchMyOrders(userId: string) {
  const { data, error } = await supabase
    .from("ult_orders")
    .select(ORDER_SELECT)
    .eq("user_id", userId)
    .eq("status", "published")
    .order("published_at", { ascending: false });
  if (error) { console.log("[Me] orders error:", error.message); return []; }
  return (data ?? []).map(normaliseOrder);
}

async function fetchMySaves(userId: string) {
  const { data, error } = await supabase
    .from("saves")
    .select(`
      ult_order_id,
      order:ult_orders (
        id, title, total, currency, like_count, save_count, try_count,
        restaurant:restaurants!restaurant_id (id, name),
        items:ult_order_items (id, name, quantity, notes),
        media:ult_order_media (id, url, thumbnail_url, media_type, sort_order)
      )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) { console.log("[Me] saves error:", error.message); return []; }
  return (data ?? []).map((r: any) => r.order).filter(Boolean);
}

// ─── Deck Card ────────────────────────────────────────────────────────────────
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
        <Ionicons name="bookmark" size={10} color="#fff" />
        <Text style={styles.likeCount}>{item.save_count ?? 0}</Text>
      </View>
      <View style={styles.cardFooter}>
        <Text style={styles.cardRestaurant}>
          {(item.restaurant?.name ?? "Restaurant").toUpperCase()}
        </Text>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.title ?? item.restaurant?.name ?? "ULT Order"}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Order Card ───────────────────────────────────────────────────────────────
function OrderCard({ post, onPress, onDeckToggle }: { post: any; onPress: () => void; onDeckToggle?: () => void }) {
  return (
    <TouchableOpacity style={styles.postCard} onPress={onPress}>
      <View style={styles.postTop}>
        <Text style={styles.postRestaurant}>{post.restaurant?.name ?? "Restaurant"}</Text>
        <Text style={styles.postPrice}>${((post.total ?? 0) / 100).toFixed(2)}</Text>
      </View>
      <Text style={styles.postTitle} numberOfLines={1}>
        {post.title ?? post.restaurant?.name ?? "ULT Order"}
      </Text>
      {(post.items ?? []).slice(0, 2).map((item: any) => (
        <Text key={item.id} style={styles.postItem}>{item.quantity}x {item.name}</Text>
      ))}
      <View style={styles.postStatsRow}>
        <View style={styles.postStats}>
          <Text style={styles.postStat}>💾 {post.save_count ?? 0}</Text>
          <Text style={styles.postStat}>✅ {post.try_count ?? 0}</Text>
          <Text style={styles.postStat}>❤️ {post.like_count ?? 0}</Text>
        </View>
        {onDeckToggle && (
          <TouchableOpacity
            style={[styles.deckToggleBtn, post.is_deck && styles.deckToggleBtnActive]}
            onPress={onDeckToggle}
          >
            <Ionicons
              name={post.is_deck ? "albums" : "albums-outline"}
              size={13}
              color={post.is_deck ? Colors.white : Colors.accent}
            />
            <Text style={[styles.deckToggleText, post.is_deck && styles.deckToggleTextActive]}>
              {post.is_deck ? "On Deck" : "Add to Deck"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const [activeTab, setActiveTab] = useState("Deck");
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [mySaves, setMySaves] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editVisible, setEditVisible] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const { user, publicUser, signOut, setPublicUser } = useAuthStore();

  const openEdit = () => {
    setEditName(publicUser?.display_name ?? "");
    setEditBio((publicUser as any)?.bio ?? "");
    setEditVisible(true);
  };
  const saveProfile = async () => {
    if (!user?.id) return;
    setIsSaving(true);
    const { error } = await supabase
      .from("users")
      .update({ display_name: editName.trim(), bio: editBio.trim() })
      .eq("id", user.id);
    setIsSaving(false);
    if (error) {
      Alert.alert("Error", "Could not save profile. Try again.");
      return;
    }
    setPublicUser({ ...publicUser, display_name: editName.trim(), bio: editBio.trim() } as any);
    setEditVisible(false);
  };
  const toggleDeck = async (post: any) => {
    const deckPosts = myOrders.filter((p) => p.is_deck);
    if (!post.is_deck && deckPosts.length >= 5) {
      Alert.alert("Deck Full", "Your deck can hold up to 5 orders. Remove one first.");
      return;
    }
    const newValue = !post.is_deck;
    // Optimistic update
    setMyOrders((prev) =>
      prev.map((p) => (p.id === post.id ? { ...p, is_deck: newValue } : p))
    );
    const { error } = await supabase
      .from("ult_orders")
      .update({ is_deck: newValue })
      .eq("id", post.id);
    if (error) {
      // Revert on failure
      setMyOrders((prev) =>
        prev.map((p) => (p.id === post.id ? { ...p, is_deck: !newValue } : p))
      );
      Alert.alert("Error", "Could not update deck. Try again.");
    }
  };

  const displayName = publicUser?.display_name ?? publicUser?.username ?? user?.email?.split("@")[0] ?? "You";
  const username = publicUser?.username ?? user?.email?.split("@")[0] ?? "you";
  const avatarLetter = displayName[0]?.toUpperCase() ?? "U";
  const { data: profileStats } = useUserProfile(username);

  useFocusEffect(
    useCallback(() => {
      async function load() {
        if (!user?.id) { setIsLoading(false); return; }
        setIsLoading(true);
        const [orders, saves] = await Promise.all([
          fetchMyOrders(user.id),
          fetchMySaves(user.id),
        ]);
        setMyOrders(orders);
        setMySaves(saves);
        setIsLoading(false);
      }
      load();
    }, [user?.id])
  );

  const handleSignOut = async () => {
    Alert.alert("Sign Out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: async () => {
        await signOut();
        router.replace("/(auth)/sign-in");
      }},
    ]);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

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
            <Text style={styles.handle}>@{username}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={openEdit}
            >
              <Ionicons name="pencil-outline" size={13} color={Colors.accent} />
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
              <Ionicons name="log-out-outline" size={18} color={Colors.inkSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Bio */}
        <TouchableOpacity
          style={styles.bioWrap}
          onPress={openEdit}
        >
          <Text style={styles.bio}>
            {(publicUser as any)?.bio ?? "Tap to add your bio..."}
          </Text>
        </TouchableOpacity>

        {/* Taste tags */}
        {(publicUser?.taste_tags?.length ?? 0) > 0 && (
          <View style={styles.tags}>
            {publicUser!.taste_tags.map((tag: string) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{myOrders.length}</Text>
            <Text style={styles.statLabel}>Orders</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statNum}>{mySaves.length}</Text>
            <Text style={styles.statLabel}>Saved</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statNum}>{profileStats?.follower_count ?? 0}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statNum}>{profileStats?.following_count ?? 0}</Text>
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
        {activeTab === "Deck" && (() => {
          const deckPosts = myOrders.filter((p) => p.is_deck);
          return (
            <View style={styles.grid}>
              {deckPosts.length === 0 ? (
                <View style={styles.emptyWrap}>
                  <Text style={styles.empty}>No deck posts yet.</Text>
                  <Text style={styles.emptySubDeck}>Go to Orders tab and add posts to your deck.</Text>
                  <TouchableOpacity
                    style={styles.createBtn}
                    onPress={() => router.push("/create/restaurant" as any)}
                  >
                    <Text style={styles.createBtnText}>+ Post Your First ULT Order</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <View style={styles.gridRow}>
                    <DeckCard
                      item={deckPosts[0]}
                      style={styles.cardSmall}
                      onPress={() => router.push(`/ult-order/${deckPosts[0].id}` as any)}
                    />
                    {deckPosts[1] ? (
                      <DeckCard
                        item={deckPosts[1]}
                        style={styles.cardSmall}
                        onPress={() => router.push(`/ult-order/${deckPosts[1].id}` as any)}
                      />
                    ) : (
                      <TouchableOpacity
                        style={[styles.cardSmall, styles.cardAdd]}
                        onPress={() => router.push("/create/restaurant" as any)}
                      >
                        <Ionicons name="add" size={28} color={Colors.accent} />
                        <Text style={styles.addText}>Add Order</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  {deckPosts[2] && (
                    <DeckCard
                      item={deckPosts[2]}
                      style={styles.cardWide}
                      onPress={() => router.push(`/ult-order/${deckPosts[2].id}` as any)}
                    />
                  )}
                  {deckPosts[3] && (
                    <View style={styles.gridRow}>
                      <DeckCard
                        item={deckPosts[3]}
                        style={styles.cardSmall}
                        onPress={() => router.push(`/ult-order/${deckPosts[3].id}` as any)}
                      />
                      {deckPosts[4] ? (
                        <DeckCard
                          item={deckPosts[4]}
                          style={styles.cardSmall}
                          onPress={() => router.push(`/ult-order/${deckPosts[4].id}` as any)}
                        />
                      ) : (
                        <TouchableOpacity
                          style={[styles.cardSmall, styles.cardAdd]}
                          onPress={() => router.push("/create/restaurant" as any)}
                        >
                          <Ionicons name="add" size={28} color={Colors.accent} />
                          <Text style={styles.addText}>Add Order</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </>
              )}
            </View>
          );
        })()}

        {/* Orders tab */}
        {activeTab === "Orders" && (
          <View style={styles.postsList}>
            {myOrders.length === 0 ? (
              <Text style={styles.empty}>No orders yet.</Text>
            ) : (
              myOrders.map((post) => (
                <OrderCard
                  key={post.id}
                  post={post}
                  onPress={() => router.push(`/ult-order/${post.id}` as any)}
                  onDeckToggle={() => toggleDeck(post)}
                />
              ))
            )}
          </View>
        )}

        {/* Saved tab */}
        {activeTab === "Saved" && (
          <View style={styles.postsList}>
            {mySaves.length === 0 ? (
              <Text style={styles.empty}>Nothing saved yet. Save orders from the feed!</Text>
            ) : (
              mySaves.map((post) => (
                <OrderCard
                  key={post.id}
                  post={post}
                  onPress={() => router.push(`/ult-order/${post.id}` as any)}
                />
              ))
            )}
          </View>
        )}
      </ScrollView>

    {/* ── Edit Profile Modal ── */}
    <Modal
      visible={editVisible}
      animationType="slide"
      transparent
      onRequestClose={() => setEditVisible(false)}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={editStyles.overlay}
      >
        <View style={editStyles.sheet}>
          <View style={editStyles.handle} />
          <Text style={editStyles.title}>Edit Profile</Text>
          <Text style={editStyles.label}>Display Name</Text>
          <TextInput
            style={editStyles.input}
            value={editName}
            onChangeText={setEditName}
            placeholder="Your name"
            placeholderTextColor={Colors.inkDisabled}
            maxLength={50}
            autoCorrect={false}
          />
          <Text style={editStyles.label}>Bio</Text>
          <TextInput
            style={[editStyles.input, editStyles.bioInput]}
            value={editBio}
            onChangeText={setEditBio}
            placeholder="Tell people about your taste..."
            placeholderTextColor={Colors.inkDisabled}
            maxLength={160}
            multiline
            autoCorrect={false}
          />
          <Text style={editStyles.charCount}>{editBio.length}/160</Text>
          <TouchableOpacity
            style={[editStyles.saveBtn, isSaving && { opacity: 0.6 }]}
            onPress={saveProfile}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={editStyles.saveBtnText}>Save Profile</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={editStyles.cancelBtn}
            onPress={() => setEditVisible(false)}
          >
            <Text style={editStyles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 },
  avatarWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.accent, alignItems: "center", justifyContent: "center", marginRight: 12 },
  avatarImg: { width: 64, height: 64, borderRadius: 32 },
  avatarText: { fontSize: 28, fontWeight: "700", color: "#fff" },
  headerInfo: { flex: 1 },
  displayName: { fontSize: 20, fontWeight: "700", color: Colors.ink },
  handle: { fontSize: 13, color: Colors.inkSecondary, marginTop: 2 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  editBtn: { flexDirection: "row", alignItems: "center", gap: 4, borderWidth: 1.5, borderColor: Colors.accent, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  editBtnText: { color: Colors.accent, fontWeight: "600", fontSize: 12 },
  signOutBtn: { padding: 6 },
  bioWrap: { paddingHorizontal: 16, marginBottom: 12 },
  bio: { fontSize: 14, color: Colors.inkSecondary, lineHeight: 20 },
  tags: { flexDirection: "row", paddingHorizontal: 16, gap: 8, marginBottom: 16, flexWrap: "wrap" },
  tag: { backgroundColor: Colors.accentLight, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  tagText: { fontSize: 12, color: Colors.accent, fontWeight: "600" },
  statsRow: { flexDirection: "row", marginHorizontal: 16, backgroundColor: Colors.card, borderRadius: 16, paddingVertical: 16, marginBottom: 20, borderWidth: 1, borderColor: Colors.border },
  stat: { flex: 1, alignItems: "center" },
  statDivider: { width: 1, backgroundColor: Colors.border },
  statNum: { fontSize: 20, fontWeight: "700", color: Colors.ink },
  statLabel: { fontSize: 12, color: Colors.inkSecondary, marginTop: 2 },
  tabRow: { flexDirection: "row", marginHorizontal: 16, marginBottom: 16, backgroundColor: Colors.border, borderRadius: 12, padding: 4 },
  tabBtn: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 10 },
  tabActive: { backgroundColor: Colors.card, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  tabText: { fontSize: 13, color: Colors.inkSecondary, fontWeight: "500" },
  tabTextActive: { color: Colors.ink, fontWeight: "700" },
  grid: { paddingHorizontal: 16, gap: 8, paddingBottom: 32 },
  gridRow: { flexDirection: "row", gap: 8, height: 160 },
  cardSmall: { flex: 1, height: 160, borderRadius: 16, padding: 12, justifyContent: "space-between" },
  cardWide: { height: 200, borderRadius: 16, padding: 12, justifyContent: "space-between" },
  cardAdd: { backgroundColor: Colors.accentLight, alignItems: "center", justifyContent: "center" },
  addText: { color: Colors.accent, fontWeight: "600", fontSize: 12, marginTop: 4 },
  cardOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.38)", borderRadius: 16 },
  likeBadge: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(0,0,0,0.35)", alignSelf: "flex-end", borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, gap: 3 },
  likeCount: { color: "#fff", fontSize: 11, fontWeight: "600" },
  cardFooter: { gap: 2 },
  cardRestaurant: { fontSize: 9, color: "rgba(255,255,255,0.8)", fontWeight: "600", letterSpacing: 0.5 },
  cardTitle: { fontSize: 13, color: "#fff", fontWeight: "700", lineHeight: 17 },
  postsList: { paddingHorizontal: 16, paddingBottom: 40 },
  postCard: { backgroundColor: Colors.card, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  postTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  postRestaurant: { fontSize: 13, color: Colors.accent, fontWeight: "700" },
  postPrice: { fontSize: 13, fontWeight: "700", color: Colors.ink },
  postTitle: { fontSize: 15, fontWeight: "700", color: Colors.ink, marginBottom: 6 },
  postItem: { fontSize: 13, color: Colors.inkSecondary, marginBottom: 2 },
  postStatsRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 10 },
  postStats: { flexDirection: "row", gap: 12 },
  deckToggleBtn: { flexDirection: "row", alignItems: "center", gap: 4, borderWidth: 1.5, borderColor: Colors.accent, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  deckToggleBtnActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  deckToggleText: { fontSize: 11, fontWeight: "700", color: Colors.accent },
  deckToggleTextActive: { color: Colors.white },
  postStat: { fontSize: 13, color: Colors.inkSecondary },
  emptyWrap: { alignItems: "center", paddingVertical: 40, gap: 16 },
  empty: { textAlign: "center", color: Colors.inkSecondary, fontSize: 14, paddingVertical: 32 },
  createBtn: { backgroundColor: Colors.accent, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12 },
  createBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  emptySubDeck: { fontSize: 13, color: Colors.inkSecondary, textAlign: "center", paddingHorizontal: 20 },
});
const editStyles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.45)" },
  sheet: { backgroundColor: Colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, gap: 8 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: "center", marginBottom: 16 },
  title: { fontSize: 18, fontWeight: "700", color: Colors.ink, marginBottom: 8 },
  label: { fontSize: 12, fontWeight: "600", color: Colors.inkSecondary, textTransform: "uppercase", letterSpacing: 0.5, marginTop: 8 },
  input: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: Colors.ink },
  bioInput: { height: 90, textAlignVertical: "top" },
  charCount: { fontSize: 11, color: Colors.inkDisabled, textAlign: "right" },
  saveBtn: { backgroundColor: Colors.accent, borderRadius: 14, paddingVertical: 14, alignItems: "center", marginTop: 8 },
  saveBtnText: { fontSize: 16, fontWeight: "700", color: Colors.white },
  cancelBtn: { paddingVertical: 12, alignItems: "center" },
  cancelBtnText: { fontSize: 15, color: Colors.inkSecondary, fontWeight: "500" },
});
