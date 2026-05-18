import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/features/auth/authStore";
import { useCreateOrderStore } from "@/features/orders/createOrderStore";
import { uploadMedia, BUCKETS } from "@/services/storage";
import { analytics } from "@/services/analytics";
import { supabase } from "@/services/supabase";
import { Colors } from "@/constants/colors";
import { FeedCard } from "@/components/feed/FeedCard";
import type { UltOrderFeedItem } from "@/types/feed";

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
  onProgress?: (msg: string) => void
): Promise<string> {
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
      restaurant_id: null,          // TODO: resolve/create restaurant in DB
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
      order_export_json: JSON.stringify({
        restaurant: draft.restaurant,
        items: draft.items,
      }),
      metadata: JSON.stringify({
        bestFor: draft.bestFor,
        valueRating: draft.valueRating,
        complexity: draft.complexity,
        tags: draft.tags,
      }),
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
          description: item.modifications || null,
          quantity: 1,
          unit_price: 0,
          sort_order: idx,
        }))
    );
    if (itemErr) throw new Error(`Failed to insert items: ${itemErr.message}`);
  }

  // 4. Insert media records
  if (uploadedMedia.length > 0) {
    const { error: mediaErr } = await supabase.from("ult_order_media").insert(
      uploadedMedia.map((m) => ({
        ult_order_id: ultOrderId,
        user_id: userId,
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

  onProgress?.("Done!");
  return ultOrderId;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function Step5PreviewScreen() {
  const router = useRouter();
  const { user, publicUser } = useAuthStore();
  const { draft, reset, setSubmitting, setSubmitError, setSubmittedId, goToStep } =
    useCreateOrderStore();

  const [progressMsg, setProgressMsg] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const [posted, setPosted] = useState(false);

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

      const id = await submitUltOrder(draft, user.id, setProgressMsg);
      setSubmittedId(id);
      analytics.capture("order_posted", {
        ult_order_id: id,
        restaurant_id: draft.restaurant?.placeId ?? null,
        item_count: draft.items.filter((i) => i.name.trim()).length,
        has_media: draft.media.length > 0,
        tag_count: draft.tags.length,
      });
      setShowConfetti(true);
      setPosted(true);

      setTimeout(() => {
        reset();
        router.dismissAll();
        router.push(`/(tabs)/` as any);
      }, 2200);
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
      </ScrollView>

      {/* Footer CTA */}
      <View style={styles.footer}>
        {draft.isSubmitting ? (
          <View style={styles.submittingRow}>
            <ActivityIndicator color={Colors.accent} />
            <Text style={styles.submittingText}>{progressMsg || "Posting…"}</Text>
          </View>
        ) : posted ? (
          <View style={styles.successRow}>
            <Ionicons name="checkmark-circle" size={22} color={Colors.saveGreen} />
            <Text style={styles.successText}>Posted! Redirecting…</Text>
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
  successRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", height: 56, gap: 10 },
  successText: { fontSize: 16, fontWeight: "700", color: Colors.saveGreen },
});
