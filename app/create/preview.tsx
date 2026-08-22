import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/features/auth/authStore";
import { useCreateOrderStore } from "@/features/orders/createOrderStore";
import { uploadMedia, BUCKETS } from "@/services/storage";
import { analytics } from "@/services/analytics";
import { supabase } from "@/services/supabase";
import { resolveRestaurant } from "@/services/restaurant";
import { useMyDeckOrders } from "@/features/profile/useProfile";
import { Colors } from "@/constants/colors";
import { FeedCard } from "@/components/feed/FeedCard";
import type { UltOrderFeedItem } from "@/types/feed";
import type { DeckOrder } from "@/types/profile";

const MAX_DECK_SIZE = 5;

// ─── Confetti ─────────────────────────────────────────────────────────────────

const CONFETTI_COLORS = [
  Colors.accent,
  Colors.saveGreen,
  Colors.triedPurple,
  Colors.confettiAmber,
  Colors.confettiBlue,
];

type Particle = {
  id: number;
  x: Animated.Value;
  y: Animated.Value;
  rotate: Animated.Value;
  opacity: Animated.Value;
  color: string;
  size: number;
};

function Confetti({ visible }: { visible: boolean }) {
  const particles = useRef<Particle[]>(
    Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      rotate: new Animated.Value(0),
      opacity: new Animated.Value(0),
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      size: 6 + (i % 4) * 3,
    }))
  ).current;

  const fired = useRef(false);

  useEffect(() => {
    if (!visible || fired.current) return;
    fired.current = true;

    const { width } = require("react-native").Dimensions.get("window");
    const anims = particles.map((p) => {
      const startX = Math.random() * width;
      const endX = startX + (Math.random() - 0.5) * 300;
      p.x.setValue(startX);
      p.y.setValue(-10);
      p.rotate.setValue(0);
      p.opacity.setValue(1);

      return Animated.parallel([
        Animated.timing(p.y, { toValue: 700 + Math.random() * 200, duration: 2200 + Math.random() * 800, useNativeDriver: true }),
        Animated.timing(p.x, { toValue: endX, duration: 2200 + Math.random() * 800, useNativeDriver: true }),
        Animated.timing(p.rotate, { toValue: 360 * (2 + Math.floor(Math.random() * 3)), duration: 2200, useNativeDriver: true }),
        Animated.sequence([
          Animated.delay(1400),
          Animated.timing(p.opacity, { toValue: 0, duration: 800, useNativeDriver: true }),
        ]),
      ]);
    });

    Animated.stagger(25, anims).start();
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={confStyles.container} pointerEvents="none">
      {particles.map((p) => (
        <Animated.View
          key={p.id}
          style={[
            confStyles.particle,
            {
              width: p.size,
              height: p.size,
              borderRadius: p.size / 4,
              backgroundColor: p.color,
              transform: [
                { translateX: p.x },
                { translateY: p.y },
                {
                  rotate: p.rotate.interpolate({
                    inputRange: [0, 360],
                    outputRange: ["0deg", "360deg"],
                  }),
                },
              ],
              opacity: p.opacity,
            },
          ]}
        />
      ))}
    </View>
  );
}

const confStyles = StyleSheet.create({
  container: { ...StyleSheet.absoluteFillObject, zIndex: 99 },
  particle: { position: "absolute", top: 0, left: 0 },
});

// ─── Draft → FeedItem adapter ─────────────────────────────────────────────────

function buildPreviewItem(
  draft: ReturnType<typeof useCreateOrderStore>["draft"],
  publicUser: any
): UltOrderFeedItem {
  return {
    id: "preview",
    user_id: publicUser?.id ?? "me",
    restaurant_id: draft.restaurant?.placeId ?? "preview-rest",
    title: draft.title || null,
    caption: draft.caption || null,
    status: "published",
    total: Math.round(
      draft.items
        .filter((i) => i.name.trim())
        .reduce((sum, i) => sum + (parseFloat(i.price) || 0), 0) * 100
    ),
    currency: "USD",
    author: {
      id: publicUser?.id ?? "me",
      username: publicUser?.username ?? "you",
      display_name: publicUser?.display_name ?? publicUser?.username ?? "You",
      avatar_url: publicUser?.avatar_url ?? null,
      is_verified: false,
    },
    restaurant: {
      id: draft.restaurant?.placeId ?? "r",
      name: draft.restaurant?.name ?? "Restaurant",
      address: draft.restaurant?.address ?? "",
      city: draft.restaurant?.city ?? null,
      cuisine_type: [],
      average_rating: 0,
      cover_image_url: null,
    },
    media: draft.media.map((m, i) => ({
      id: m.id,
      media_type: m.type,
      url: m.localUri,
      thumbnail_url: m.localUri,
      width: null,
      height: null,
      duration_seconds: null,
      sort_order: i,
    })),
    items: draft.items
      .filter((i) => i.name.trim())
      .map((i, idx) => ({
        id: i.id,
        name: i.name,
        quantity: 1,
        unit_price: Math.round((parseFloat(i.price) || 0) * 100),
        notes: i.modifications || null,
        dietary_tags: [],
      })),
    tags: draft.tags,
    like_count: 0,
    save_count: 0,
    comment_count: 0,
    try_count: 0,
    view_count: 0,
    trending_score: 0,
    viewer_has_liked: false,
    viewer_has_saved: false,
    viewer_has_tried: false,
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

// ─── Submit function ──────────────────────────────────────────────────────────

async function submitUltOrder(
  draft: ReturnType<typeof useCreateOrderStore>["draft"],
  userId: string,
  deckChoice: { addToDeck: boolean; swapOutId: string | null },
  onProgress?: (msg: string) => void
): Promise<{ id: string; deckWarning: string | null }> {
  // 0. Refresh session to ensure JWT is valid
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not logged in. Please sign in and try again.");
  // Force token refresh if close to expiry
  await supabase.auth.refreshSession();
  // 1. Upload media
  const uploadedMedia: Array<{
    url: string;
    path: string;
    type: "photo" | "video";
    index: number;
  }> = [];

  for (let i = 0; i < draft.media.length; i++) {
    const m = draft.media[i];
    onProgress?.(`Uploading media ${i + 1}/${draft.media.length}…`);
    const result = await uploadMedia(m.asset, userId);
    uploadedMedia.push({ url: result.publicUrl, path: result.path, type: m.type, index: i });
  }

  onProgress?.("Creating your ULT order…");

  // 2. Insert ult_order row
  const { data: ultOrder, error: ultErr } = await supabase
    .from("ult_orders")
    .insert({
      user_id: userId,
      restaurant_id: await resolveRestaurant(draft.restaurant!).catch(() => null),
      title: draft.title || null,
      caption: draft.caption || null,
      status: "published",
      published_at: new Date().toISOString(),
      total: Math.round(
      draft.items
        .filter((i) => i.name.trim())
        .reduce((sum, i) => sum + (parseFloat(i.price) || 0), 0) * 100
    ),
      currency: "USD",

    })
    .select("id")
    .single();

  if (ultErr) throw new Error(`Failed to create ULT order: ${ultErr.message}`);
  const ultOrderId = ultOrder.id as string;

  // 3. Insert items
  if (draft.items.filter((i) => i.name.trim()).length > 0) {
    const { error: itemErr } = await supabase.from("ult_order_items").insert(
      draft.items
        .filter((i) => i.name.trim())
        .map((item, idx) => ({
          ult_order_id: ultOrderId,
          name: item.name.trim(),
          notes: item.modifications || null,
          quantity: 1,
          unit_price: 0,
          sort_order: idx,
        }))
    );
    if (itemErr) {
      await supabase.from("ult_orders").delete().eq("id", ultOrderId);
      throw new Error(`Failed to insert items: ${itemErr.message}`);
    }
  }

  // 4. Insert media records
  if (uploadedMedia.length > 0) {
    const { error: mediaErr } = await supabase.from("ult_order_media").insert(
      uploadedMedia.map((m) => ({
        ult_order_id: ultOrderId,
        media_type: m.type,
        url: m.url,
        thumbnail_url: m.url,
        storage_path: m.path,
        sort_order: m.index,
      }))
    );
    if (mediaErr) throw new Error(`Failed to insert media: ${mediaErr.message}`);
  }

  // 5. Insert tags
  if (draft.tags.length > 0) {
    for (const tagName of draft.tags) {
      // Upsert tag and get its ID
      const { data: tag } = await supabase
        .from("tags")
        .upsert({ name: tagName, display_name: tagName, category: "custom" }, { onConflict: "name" })
        .select("id")
        .single();

      if (tag) {
        await supabase
          .from("ult_order_tags")
          .upsert({ ult_order_id: ultOrderId, tag_id: tag.id });
      }
    }
  }

  // 6. Add to Signature Deck (best-effort — must never block the post itself)
  let deckWarning: string | null = null;
  if (deckChoice.addToDeck) {
    onProgress?.("Updating your Deck…");
    try {
      if (deckChoice.swapOutId) {
        const { error: swapErr } = await supabase
          .from("ult_orders")
          .update({ is_deck: false })
          .eq("id", deckChoice.swapOutId);
        if (swapErr) throw swapErr;
      }
      const { error: pinErr } = await supabase
        .from("ult_orders")
        .update({ is_deck: true })
        .eq("id", ultOrderId);
      if (pinErr) throw pinErr;
    } catch (e: any) {
      deckWarning =
        "Posted, but your Deck already had 5 orders, so this one wasn't added. Add it from your profile.";
    }
  }

  onProgress?.("Done!");
  return { id: ultOrderId, deckWarning };
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function Step5PreviewScreen() {
  const router = useRouter();
  const { user, publicUser } = useAuthStore();
  const { draft, reset, setSubmitting, setSubmitError, setSubmittedId, goToStep } =
    useCreateOrderStore();

  const queryClient = useQueryClient();
  const [progressMsg, setProgressMsg] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const [posted, setPosted] = useState(false);
  const [postDeckWarning, setPostDeckWarning] = useState<string | null>(null);

  // ── Add to Deck ──────────────────────────────────────────────────────────
  const { data: deckOrders = [], isLoading: deckLoading } = useMyDeckOrders(user?.id);
  const [addToDeck, setAddToDeckLocal] = useState(false);
  const [swapOutOrder, setSwapOutOrder] = useState<DeckOrder | null>(null);
  const [showSwapPicker, setShowSwapPicker] = useState(false);

  const deckIsFull = deckOrders.length >= MAX_DECK_SIZE;

  const handleToggleDeck = (next: boolean) => {
    if (!next) {
      setAddToDeckLocal(false);
      setSwapOutOrder(null);
      return;
    }
    if (deckIsFull) {
      setShowSwapPicker(true);
      return;
    }
    setAddToDeckLocal(true);
  };

  const handleChooseSwap = (order: DeckOrder) => {
    setSwapOutOrder(order);
    setAddToDeckLocal(true);
    setShowSwapPicker(false);
  };

  const previewItem = buildPreviewItem(draft, publicUser);

  const handlePost = async () => {
    setSubmitting(true);
    setSubmitError(null);

    try {
      // ── Mock mode: no real user logged in yet ──
      if (!user?.id) {
        setProgressMsg("Posting your ULT order...");
        await new Promise((r) => setTimeout(r, 1200));
        setShowConfetti(true);
        setPosted(true);
        setTimeout(() => {
          reset();
          router.dismissAll();
          router.push(`/(tabs)/` as any);
        }, 2200);
        return;
      }

      const { id, deckWarning } = await submitUltOrder(
        draft,
        user.id,
        { addToDeck, swapOutId: swapOutOrder?.id ?? null },
        setProgressMsg
      );
      setSubmittedId(id);
      analytics.capture("order_posted", {
        ult_order_id: id,
        restaurant_id: draft.restaurant?.placeId ?? null,
        item_count: draft.items.filter((i) => i.name.trim()).length,
        has_media: draft.media.length > 0,
        tag_count: draft.tags.length,
        added_to_deck: addToDeck && !deckWarning,
      });
      queryClient.invalidateQueries({ queryKey: ["feed", "following"] });
      queryClient.invalidateQueries({ queryKey: ["feed", "trending"] });
      queryClient.invalidateQueries({ queryKey: ["feed", "nearby"] });
      queryClient.invalidateQueries({ queryKey: ["my-deck-orders", user.id] });
      setShowConfetti(true);
      setPosted(true);
      setPostDeckWarning(deckWarning);

      setTimeout(() => {
        reset();
        router.dismissAll();
        router.push(`/(tabs)/` as any);
      }, deckWarning ? 3400 : 2200);
    } catch (e: any) {
      setSubmitError(e.message ?? "Something went wrong.");
      Alert.alert("Error", e.message ?? "Failed to post. Please try again.");
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    goToStep(4);
    router.back();
  };

  return (
    <View style={styles.flex}>
      <Confetti visible={showConfetti} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={handleBack} hitSlop={12} disabled={draft.isSubmitting}>
          <Ionicons name="arrow-back" size={20} color={Colors.ink} />
        </Pressable>
        <Text style={styles.headerTitle}>Preview</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* Preview hint */}
      <View style={styles.hintBanner}>
        <Ionicons name="eye-outline" size={14} color={Colors.inkSecondary} />
        <Text style={styles.hintText}>This is exactly how your ULT order will appear</Text>
      </View>

      {/* The card */}
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <FeedCard item={previewItem} onPress={() => {}} />

        {/* Metadata summary */}
        {(draft.bestFor || draft.valueRating || draft.complexity) && (
          <View style={styles.metaCard}>
            <Text style={styles.metaLabel}>Extras</Text>
            <View style={styles.metaRow}>
              {draft.bestFor && (
                <View style={styles.metaPill}>
                  <Text style={styles.metaPillText}>
                    {draft.bestFor.replace("_", " ")}
                  </Text>
                </View>
              )}
              {draft.valueRating && (
                <View style={styles.metaPill}>
                  <Text style={styles.metaPillText}>
                    {"●".repeat(draft.valueRating)}{"○".repeat(5 - draft.valueRating)} value
                  </Text>
                </View>
              )}
              {draft.complexity && (
                <View style={styles.metaPill}>
                  <Text style={styles.metaPillText}>{draft.complexity}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Add to Signature Deck */}
        {user?.id && (
          <View style={styles.deckCard}>
            <View style={styles.deckRow}>
              <View style={styles.deckRowText}>
                <Text style={styles.deckTitle}>Add to Signature Deck</Text>
                <Text style={styles.deckSubtitle}>
                  {addToDeck
                    ? swapOutOrder
                      ? "Swapping into your Deck on publish"
                      : "Will be pinned to your Deck"
                    : "Pin your best orders to your profile (5 max)"}
                </Text>
              </View>
              {deckLoading ? (
                <ActivityIndicator size="small" color={Colors.accent} />
              ) : (
                <Switch
                  value={addToDeck}
                  onValueChange={handleToggleDeck}
                  trackColor={{ false: Colors.border, true: Colors.accentLight }}
                  thumbColor={addToDeck ? Colors.accent : Colors.card}
                />
              )}
            </View>

            {/* Explicit swap notice — never a silent demotion */}
            {swapOutOrder && (
              <View style={styles.swapNotice}>
                <Ionicons name="swap-horizontal" size={16} color={Colors.warning} />
                <Text style={styles.swapNoticeText}>
                  <Text style={styles.swapNoticeBold}>
                    "{swapOutOrder.title || swapOutOrder.restaurant_name}"
                  </Text>{" "}
                  will move out of your Deck to make room.
                </Text>
                <Pressable onPress={() => setShowSwapPicker(true)} hitSlop={8}>
                  <Text style={styles.swapChangeLink}>Change</Text>
                </Pressable>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Footer CTA */}
      <View style={styles.footer}>
        {draft.isSubmitting ? (
          <View style={styles.submittingRow}>
            <ActivityIndicator color={Colors.accent} />
            <Text style={styles.submittingText}>{progressMsg || "Posting…"}</Text>
          </View>
        ) : posted ? (
          <View style={styles.successCol}>
            <View style={styles.successRow}>
              <Ionicons name="checkmark-circle" size={22} color={Colors.saveGreen} />
              <Text style={styles.successText}>Posted! Redirecting…</Text>
            </View>
            {postDeckWarning && (
              <Text style={styles.postDeckWarningText}>{postDeckWarning}</Text>
            )}
          </View>
        ) : (
          <Pressable
            style={({ pressed }) => [
              styles.postBtn,
              pressed && styles.postBtnPressed,
            ]}
            onPress={handlePost}
          >
            <Ionicons name="paper-plane" size={20} color={Colors.white} />
            <Text style={styles.postBtnText}>Post ULT Order</Text>
          </Pressable>
        )}
      </View>

      {/* Swap picker — Deck is full, user must explicitly choose what to demote */}
      <Modal
        visible={showSwapPicker}
        animationType="slide"
        transparent
        onRequestClose={() => setShowSwapPicker(false)}
      >
        <View style={swapStyles.overlay}>
          <View style={swapStyles.sheet}>
            <View style={swapStyles.handle} />
            <Text style={swapStyles.title}>Your Deck is full</Text>
            <Text style={swapStyles.subtitle}>
              Choose an order to swap out. It'll stay on your profile — just off the Deck.
            </Text>

            {deckOrders.map((order) => (
              <Pressable
                key={order.id}
                style={({ pressed }) => [
                  swapStyles.row,
                  pressed && swapStyles.rowPressed,
                ]}
                onPress={() => handleChooseSwap(order)}
              >
                {order.cover_url ? (
                  <Image source={{ uri: order.cover_url }} style={swapStyles.thumb} />
                ) : (
                  <View style={[swapStyles.thumb, swapStyles.thumbPlaceholder]}>
                    <Text style={swapStyles.thumbEmoji}>🍽️</Text>
                  </View>
                )}
                <View style={swapStyles.rowInfo}>
                  <Text style={swapStyles.rowRestaurant} numberOfLines={1}>
                    {order.restaurant_name}
                  </Text>
                  <Text style={swapStyles.rowTitle} numberOfLines={1}>
                    {order.title || order.restaurant_name}
                  </Text>
                  <View style={swapStyles.saveRow}>
                    <Ionicons name="bookmark" size={12} color={Colors.saveGreen} />
                    <Text style={swapStyles.saveCount}>{order.save_count} saves</Text>
                  </View>
                </View>
                <View style={swapStyles.swapOutBtn}>
                  <Text style={swapStyles.swapOutBtnText}>Swap Out</Text>
                </View>
              </Pressable>
            ))}

            <Pressable
              style={swapStyles.cancelBtn}
              onPress={() => setShowSwapPicker(false)}
            >
              <Text style={swapStyles.cancelBtnText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.surface },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 13, backgroundColor: Colors.card, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
  backBtn: { width: 38, height: 38, borderRadius: 10, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700", color: Colors.ink },
  hintBanner: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: Colors.surface, paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
  hintText: { fontSize: 12, color: Colors.inkSecondary },
  scroll: { paddingVertical: 16, paddingBottom: 24 },
  metaCard: { marginHorizontal: 16, marginTop: 12, backgroundColor: Colors.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border, gap: 8 },
  metaLabel: { fontSize: 11, fontWeight: "700", color: Colors.inkSecondary, textTransform: "uppercase", letterSpacing: 0.5 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  metaPill: { paddingHorizontal: 10, paddingVertical: 4, backgroundColor: Colors.accentLight, borderRadius: 20, borderWidth: 1, borderColor: Colors.accent },
  metaPillText: { fontSize: 12, color: Colors.accent, fontWeight: "600" },
  footer: { padding: 16, paddingBottom: Platform.OS === "ios" ? 32 : 16, backgroundColor: Colors.card, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.border },
  postBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", height: 56, backgroundColor: Colors.accent, borderRadius: 14, gap: 10, shadowColor: Colors.accent, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 5 },
  postBtnPressed: { backgroundColor: Colors.accentDark },
  postBtnText: { fontSize: 17, fontWeight: "800", color: Colors.white, letterSpacing: 0.2 },
  submittingRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", height: 56, gap: 12 },
  submittingText: { fontSize: 15, color: Colors.inkSecondary },
  successCol: { alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 8 },
  successRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", height: 56, gap: 10 },
  successText: { fontSize: 16, fontWeight: "700", color: Colors.saveGreen },
  postDeckWarningText: { fontSize: 12, color: Colors.warning, textAlign: "center", paddingHorizontal: 24, lineHeight: 17 },
  // Add to Deck
  deckCard: { marginHorizontal: 16, marginTop: 12, backgroundColor: Colors.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border, gap: 10 },
  deckRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  deckRowText: { flex: 1, gap: 2 },
  deckTitle: { fontSize: 15, fontWeight: "700", color: Colors.ink },
  deckSubtitle: { fontSize: 12, color: Colors.inkSecondary },
  swapNotice: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#FEF3E7", borderRadius: 10, padding: 10 },
  swapNoticeText: { flex: 1, fontSize: 12, color: Colors.warning, lineHeight: 17 },
  swapNoticeBold: { fontWeight: "700" },
  swapChangeLink: { fontSize: 12, fontWeight: "700", color: Colors.accent },
});

const swapStyles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.45)" },
  sheet: { backgroundColor: Colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: Platform.OS === "ios" ? 40 : 24, gap: 12, maxHeight: "80%" },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: "center", marginBottom: 4 },
  title: { fontSize: 18, fontWeight: "700", color: Colors.ink },
  subtitle: { fontSize: 13, color: Colors.inkSecondary, lineHeight: 18, marginBottom: 4 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
  rowPressed: { backgroundColor: Colors.surface },
  thumb: { width: 52, height: 52, borderRadius: 10 },
  thumbPlaceholder: { backgroundColor: Colors.accentLight, alignItems: "center", justifyContent: "center" },
  thumbEmoji: { fontSize: 20 },
  rowInfo: { flex: 1, gap: 2 },
  rowRestaurant: { fontSize: 11, fontWeight: "700", color: Colors.inkSecondary, textTransform: "uppercase", letterSpacing: 0.3 },
  rowTitle: { fontSize: 14, fontWeight: "700", color: Colors.ink },
  saveRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  saveCount: { fontSize: 12, color: Colors.inkSecondary },
  swapOutBtn: { borderWidth: 1.5, borderColor: Colors.warning, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  swapOutBtnText: { fontSize: 12, fontWeight: "700", color: Colors.warning },
  cancelBtn: { paddingVertical: 12, alignItems: "center", marginTop: 4 },
  cancelBtnText: { fontSize: 15, color: Colors.inkSecondary, fontWeight: "500" },
});
