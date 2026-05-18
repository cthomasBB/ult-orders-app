import { useRouter } from "expo-router";
import {
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { formatCount } from "@/features/feed/useFeed";
import { timeAgo } from "@/utils";
import type { RestaurantOrderGroup } from "@/types/profile";
import type { UltOrderFeedItem } from "@/types/feed";

const { width: SCREEN_W } = Dimensions.get("window");
const H_PAD = 16;
const GAP = 8;
const CARD_W_PAIR = (SCREEN_W - H_PAD * 2 - GAP) / 2;
const CARD_W_SOLO = SCREEN_W - H_PAD * 2;
const CARD_H = Math.round(CARD_W_PAIR * 1.3);

// ─── Mini order card ──────────────────────────────────────────────────────────

function MiniOrderCard({
  order,
  width,
}: {
  order: UltOrderFeedItem;
  width: number;
}) {
  const router = useRouter();
  const firstMedia = order.media[0];

  return (
    <Pressable
      style={({ pressed }) => [
        cardStyles.card,
        { width },
        pressed && cardStyles.cardPressed,
      ]}
      onPress={() => router.push(`/ult-order/${order.id}` as any)}
    >
      {/* Media */}
      <View style={[cardStyles.media, { height: CARD_H }]}>
        {firstMedia ? (
          <Image
            source={{ uri: firstMedia.thumbnail_url ?? firstMedia.url }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, cardStyles.mediaPlaceholder]}>
            <Text style={cardStyles.mediaEmoji}>🍽️</Text>
          </View>
        )}
        {firstMedia?.media_type === "video" && (
          <View style={cardStyles.videoPin}>
            <Ionicons name="play" size={12} color={Colors.white} />
          </View>
        )}
        {/* Save count chip */}
        <View style={cardStyles.saveChip}>
          <Ionicons name="bookmark" size={10} color={Colors.saveGreen} />
          <Text style={cardStyles.saveCount}>{formatCount(order.save_count)}</Text>
        </View>
      </View>

      {/* Body */}
      <View style={cardStyles.body}>
        {order.title && (
          <Text style={cardStyles.title} numberOfLines={2}>
            {order.title}
          </Text>
        )}
        <View style={cardStyles.meta}>
          <Text style={cardStyles.time}>{timeAgo(order.published_at ?? order.created_at)}</Text>
          {order.items.length > 0 && (
            <Text style={cardStyles.itemPreview} numberOfLines={1}>
              {order.items[0].name}
              {order.items.length > 1 ? ` +${order.items.length - 1}` : ""}
            </Text>
          )}
        </View>
        {/* Engagement micro-row */}
        <View style={cardStyles.engRow}>
          <View style={cardStyles.engItem}>
            <Ionicons name="heart" size={11} color={Colors.accent} />
            <Text style={cardStyles.engCount}>{formatCount(order.like_count)}</Text>
          </View>
          <View style={cardStyles.engItem}>
            <Ionicons name="checkmark-circle" size={11} color={Colors.triedPurple} />
            <Text style={cardStyles.engCount}>{formatCount(order.try_count)}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  cardPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  media: {
    backgroundColor: Colors.accentLight,
    position: "relative",
  },
  mediaPlaceholder: {
    backgroundColor: Colors.accentLight,
    alignItems: "center",
    justifyContent: "center",
  },
  mediaEmoji: { fontSize: 32 },
  videoPin: {
    position: "absolute",
    top: 6,
    left: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    paddingLeft: 1,
  },
  saveChip: {
    position: "absolute",
    top: 6,
    right: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 20,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  saveCount: { fontSize: 11, fontWeight: "700", color: Colors.white },
  body: {
    padding: 9,
    gap: 4,
  },
  title: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.ink,
    lineHeight: 17,
  },
  meta: { gap: 2 },
  time: { fontSize: 11, color: Colors.inkDisabled },
  itemPreview: { fontSize: 11, color: Colors.inkSecondary },
  engRow: { flexDirection: "row", gap: 8, marginTop: 2 },
  engItem: { flexDirection: "row", alignItems: "center", gap: 3 },
  engCount: { fontSize: 11, color: Colors.inkSecondary },
});

// ─── RestaurantPairModule ─────────────────────────────────────────────────────

type RestaurantPairModuleProps = {
  group: RestaurantOrderGroup;
};

export function RestaurantPairModule({ group }: RestaurantPairModuleProps) {
  const router = useRouter();

  // Show max 2 orders per module
  const visible = group.orders.slice(0, 2);
  const remaining = group.orders.length - 2;

  const cardWidth =
    visible.length === 1 ? CARD_W_SOLO : CARD_W_PAIR;

  return (
    <View style={moduleStyles.container}>
      {/* Restaurant header */}
      <Pressable
        style={({ pressed }) => [
          moduleStyles.header,
          pressed && moduleStyles.headerPressed,
        ]}
        onPress={() =>
          router.push(`/restaurant/${group.restaurant_id}`)
        }
      >
        <View style={moduleStyles.headerLeft}>
          <View style={moduleStyles.restaurantIcon}>
            <Text style={moduleStyles.restaurantEmoji}>🍽️</Text>
          </View>
          <View style={moduleStyles.headerText}>
            <Text style={moduleStyles.restaurantName} numberOfLines={1}>
              {group.restaurant_name}
            </Text>
            {group.cuisine_type.length > 0 && (
              <Text style={moduleStyles.cuisineType} numberOfLines={1}>
                {group.cuisine_type.slice(0, 2).join(" · ")}
              </Text>
            )}
          </View>
        </View>
        <View style={moduleStyles.headerRight}>
          <Text style={moduleStyles.orderCount}>
            {group.orders.length} order{group.orders.length !== 1 ? "s" : ""}
          </Text>
          <Ionicons name="chevron-forward" size={15} color={Colors.inkDisabled} />
        </View>
      </Pressable>

      {/* Order cards */}
      <View style={moduleStyles.cards}>
        {visible.map((order) => (
          <MiniOrderCard key={order.id} order={order} width={cardWidth} />
        ))}
      </View>

      {/* "+N more" if > 2 */}
      {remaining > 0 && (
        <Pressable
          style={({ pressed }) => [
            moduleStyles.moreBtn,
            pressed && moduleStyles.moreBtnPressed,
          ]}
        >
          <Text style={moduleStyles.moreText}>
            +{remaining} more order{remaining !== 1 ? "s" : ""} at {group.restaurant_name}
          </Text>
          <Ionicons name="chevron-forward" size={13} color={Colors.accent} />
        </Pressable>
      )}
    </View>
  );
}

const moduleStyles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: H_PAD,
    paddingVertical: 10,
    backgroundColor: Colors.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  headerPressed: { backgroundColor: Colors.surface },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  restaurantIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.accentLight,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  restaurantEmoji: { fontSize: 18 },
  headerText: { flex: 1 },
  restaurantName: { fontSize: 15, fontWeight: "700", color: Colors.ink },
  cuisineType: { fontSize: 12, color: Colors.inkSecondary, marginTop: 1 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 4 },
  orderCount: { fontSize: 12, color: Colors.inkSecondary },
  cards: {
    flexDirection: "row",
    paddingHorizontal: H_PAD,
    paddingTop: 10,
    gap: GAP,
  },
  moreBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: H_PAD,
    paddingTop: 8,
  },
  moreBtnPressed: { opacity: 0.6 },
  moreText: { fontSize: 13, color: Colors.accent, fontWeight: "600" },
});
