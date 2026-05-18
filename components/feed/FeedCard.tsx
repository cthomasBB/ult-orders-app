import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Dimensions,
  Image,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { timeAgo, formatPrice, truncate } from "@/utils";
import {
  formatCount,
  useToggleLike,
  useToggleSave,
  useToggleTried,
} from "@/features/feed/useFeed";
import type { UltOrderFeedItem } from "@/types/feed";
import { useFollowStore } from "@/features/feed/followStore";

const { width: SCREEN_W } = Dimensions.get("window");
const CARD_PADDING = 16;
const MEDIA_WIDTH = SCREEN_W - CARD_PADDING * 2;
const MEDIA_HEIGHT = Math.round((MEDIA_WIDTH * 3) / 4); // 4:3

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({
  name,
  url,
  size = 36,
}: {
  name: string;
  url: string | null;
  size?: number;
}) {
  const initial = (name ?? "?").charAt(0).toUpperCase();
  if (url) {
    return (
      <Image
        source={{ uri: url }}
        style={[
          avatarStyles.img,
          { width: size, height: size, borderRadius: size / 2 },
        ]}
      />
    );
  }
  return (
    <View
      style={[
        avatarStyles.placeholder,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <Text style={[avatarStyles.initial, { fontSize: size * 0.4 }]}>
        {initial}
      </Text>
    </View>
  );
}

const avatarStyles = StyleSheet.create({
  img: { backgroundColor: Colors.border },
  placeholder: {
    backgroundColor: Colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  initial: { color: Colors.white, fontWeight: "800" },
});

// ─── Status dot ───────────────────────────────────────────────────────────────

function StatusDot({ isVerified }: { isVerified: boolean }) {
  if (!isVerified) return null;
  return (
    <View style={dotStyles.dot}>
      <Ionicons name="checkmark" size={8} color={Colors.white} />
    </View>
  );
}

const dotStyles = StyleSheet.create({
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.accent,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 4,
    borderWidth: 1.5,
    borderColor: Colors.card,
  },
});

// ─── Media block ──────────────────────────────────────────────────────────────

function MediaBlock({
  item,
  onPress,
}: {
  item: UltOrderFeedItem;
  onPress: () => void;
}) {
  const firstMedia = item.media[0];

  return (
    <Pressable onPress={onPress} style={mediaStyles.container}>
      {firstMedia ? (
        <Image
          source={{ uri: firstMedia.thumbnail_url ?? firstMedia.url }}
          style={mediaStyles.image}
          resizeMode="cover"
        />
      ) : (
        // Placeholder when no media uploaded
        <View style={mediaStyles.imagePlaceholder}>
          <Text style={mediaStyles.placeholderEmoji}>🍽️</Text>
        </View>
      )}

      {/* Video play icon */}
      {firstMedia?.media_type === "video" && (
        <View style={mediaStyles.playOverlay}>
          <View style={mediaStyles.playButton}>
            <Ionicons name="play" size={22} color={Colors.white} />
          </View>
        </View>
      )}

      {/* Multi-photo indicator */}
      {item.media.length > 1 && (
        <View style={mediaStyles.multiIndicator}>
          <Ionicons name="copy-outline" size={14} color={Colors.white} />
        </View>
      )}

      {/* Restaurant name pill */}
      <View style={mediaStyles.restaurantPill}>
        <Text style={mediaStyles.restaurantPillText} numberOfLines={1}>
          {item.restaurant.name}
        </Text>
      </View>
    </Pressable>
  );
}

const mediaStyles = StyleSheet.create({
  container: {
    width: MEDIA_WIDTH,
    height: MEDIA_HEIGHT,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: Colors.surface,
  },
  image: { width: "100%", height: "100%" },
  imagePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: Colors.accentLight,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderEmoji: { fontSize: 60 },
  playOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  playButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    paddingLeft: 4,
  },
  multiIndicator: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 6,
    padding: 4,
  },
  restaurantPill: {
    position: "absolute",
    bottom: 10,
    left: 10,
    backgroundColor: "rgba(0,0,0,0.60)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    maxWidth: MEDIA_WIDTH * 0.65,
  },
  restaurantPillText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.1,
  },
});

// ─── Items preview ────────────────────────────────────────────────────────────

function ItemsPreview({ item }: { item: UltOrderFeedItem }) {
  const preview = item.items.slice(0, 2);
  const extra = item.items.length - 2;

  if (item.items.length === 0) return null;

  return (
    <View style={itemsStyles.container}>
      {preview.map((orderItem) => (
        <View key={orderItem.id} style={itemsStyles.row}>
          <Text style={itemsStyles.qty}>{orderItem.quantity}×</Text>
          <Text style={itemsStyles.name} numberOfLines={1}>
            {orderItem.name}
          </Text>
          {orderItem.notes ? (
            <Text style={itemsStyles.mod} numberOfLines={1}>
              {truncate(orderItem.notes, 22)}
            </Text>
          ) : null}
          {orderItem.dietary_tags.length > 0 ? (
            <View style={itemsStyles.dietTag}>
              <Text style={itemsStyles.dietTagText}>
                {orderItem.dietary_tags[0]}
              </Text>
            </View>
          ) : null}
        </View>
      ))}
      {extra > 0 && (
        <Text style={itemsStyles.more}>+ {extra} more item{extra > 1 ? "s" : ""}</Text>
      )}
    </View>
  );
}

const itemsStyles = StyleSheet.create({
  container: {
    gap: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  qty: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.accent,
    width: 22,
    flexShrink: 0,
  },
  name: {
    fontSize: 13,
    color: Colors.ink,
    fontWeight: "500",
    flex: 1,
  },
  mod: {
    fontSize: 12,
    color: Colors.inkSecondary,
    fontStyle: "italic",
    flexShrink: 1,
  },
  dietTag: {
    backgroundColor: Colors.saveGreenLight,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
    flexShrink: 0,
  },
  dietTagText: {
    fontSize: 10,
    color: Colors.saveGreen,
    fontWeight: "700",
  },
  more: {
    fontSize: 12,
    color: Colors.accent,
    fontWeight: "600",
    marginTop: 2,
  },
});

// ─── Action button ────────────────────────────────────────────────────────────

function ActionBtn({
  icon,
  activeIcon,
  count,
  isActive,
  activeColor,
  onPress,
  size = "normal",
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  activeIcon: React.ComponentProps<typeof Ionicons>["name"];
  count: number;
  isActive: boolean;
  activeColor: string;
  onPress: () => void;
  size?: "large" | "normal";
}) {
  const isLarge = size === "large";
  return (
    <Pressable
      style={({ pressed }) => [
        actionStyles.btn,
        isLarge && actionStyles.btnLarge,
        pressed && actionStyles.btnPressed,
      ]}
      onPress={onPress}
      hitSlop={8}
    >
      <Ionicons
        name={isActive ? activeIcon : icon}
        size={isLarge ? 22 : 18}
        color={isActive ? activeColor : Colors.inkSecondary}
      />
      <Text
        style={[
          actionStyles.count,
          isLarge && actionStyles.countLarge,
          isActive && { color: activeColor },
        ]}
      >
        {formatCount(count)}
      </Text>
    </Pressable>
  );
}

const actionStyles = StyleSheet.create({
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  btnLarge: {
    paddingHorizontal: 10,
  },
  btnPressed: { opacity: 0.6 },
  count: {
    fontSize: 13,
    color: Colors.inkSecondary,
    fontWeight: "500",
  },
  countLarge: {
    fontSize: 15,
    fontWeight: "700",
  },
});

// ─── Follow Button ───────────────────────────────────────────────────────────

function FollowButton({ username }: { username: string }) {
  const { isFollowing, toggleFollow } = useFollowStore();
  const following = isFollowing(username);
  return (
    <Pressable
      style={[followStyles.btn, following && followStyles.btnActive]}
      onPress={() => toggleFollow(username)}
      hitSlop={8}
    >
      <Text style={[followStyles.text, following && followStyles.textActive]}>
        {following ? "Following" : "Follow"}
      </Text>
    </Pressable>
  );
}

const followStyles = StyleSheet.create({
  btn: {
    borderWidth: 1.5,
    borderColor: "#C8472B",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  btnActive: {
    backgroundColor: "#C8472B",
  },
  text: {
    fontSize: 12,
    fontWeight: "600",
    color: "#C8472B",
  },
  textActive: {
    color: "#fff",
  },
});

// ─── FeedCard ─────────────────────────────────────────────────────────────────

type FeedCardProps = {
  item: UltOrderFeedItem;
  onPress?: () => void;
};

export function FeedCard({ item, onPress }: FeedCardProps) {
  const router = useRouter();
  const likeMutation = useToggleLike();
  const saveMutation = useToggleSave();
  const triedMutation = useToggleTried();

  const [notForMe, setNotForMe] = useState(false);
  const [liked, setLiked] = useState(item.viewer_has_liked ?? false);
  const [saved, setSaved] = useState(item.viewer_has_saved ?? false);
  const [tried, setTried] = useState(item.viewer_has_tried ?? false);
  const [likeCount, setLikeCount] = useState(item.like_count);
  const [saveCount, setSaveCount] = useState(item.save_count);
  const [tryCount, setTryCount] = useState(item.try_count);

  const handleLike = () => {
    const newLiked = !liked;
    setLiked(newLiked);
    setLikeCount((c) => c + (newLiked ? 1 : -1));
    likeMutation.mutate({ ultOrderId: item.id, currentlyLiked: liked });
  };
  const handleSave = () => {
    const newSaved = !saved;
    setSaved(newSaved);
    setSaveCount((c) => c + (newSaved ? 1 : -1));
    saveMutation.mutate({ ultOrderId: item.id, currentlySaved: saved });
  };
  const handleTried = () => {
    const newTried = !tried;
    setTried(newTried);
    setTryCount((c) => c + (newTried ? 1 : -1));
    triedMutation.mutate({ ultOrderId: item.id, currentlyTried: tried });
  };

  const handleNotForMe = () => {
    setNotForMe(true);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this order${item.title ? ` — ${item.title}` : ""} at ${item.restaurant.name} on ULT Orders`,
        url: `ultorders://ult-order/${item.id}`,
      });
    } catch {}
  };

  const handleCardPress = () => {
    if (onPress) { onPress(); return; }
    router.push(`/ult-order/${item.id}` as any);
  };

  const handleAuthorPress = () => {
    router.push(`/profile/${item.author.username}`);
  };

  const handleRestaurantPress = () => {
    router.push(`/restaurant/${item.restaurant_id}`);
  };
  if (notForMe) {
    return (
      <View style={styles.notForMeCard}>
        <Text style={styles.notForMeText}>Not for me</Text>
        <Pressable onPress={() => setNotForMe(false)} hitSlop={8}>
          <Text style={styles.notForMeUndo}>Undo</Text>
        </Pressable>
      </View>
    );
  }

  return (

    <View style={styles.card}>
      {/* ── Header row ── */}
      <View style={styles.header}>
        <Pressable style={styles.authorRow} onPress={handleAuthorPress}>
          <Avatar
            name={item.author.display_name ?? item.author.username}
            url={item.author.avatar_url}
            size={38}
          />
          <View style={styles.authorInfo}>
            <View style={styles.authorNameRow}>
              <Text style={styles.authorName}>
                {item.author.display_name ?? item.author.username}
              </Text>
              <StatusDot isVerified={item.author.is_verified} />
            </View>
            <Text style={styles.metaText}>
              @{item.author.username} · {timeAgo(item.published_at ?? item.created_at)}
            </Text>
          </View>
        </Pressable>

        {/* Follow button */}
        <FollowButton username={item.author.username} />
      </View>

      {/* ── Media ── */}
      <MediaBlock item={item} onPress={handleCardPress} />

      {/* ── Body ── */}
      <View style={styles.body}>
        {/* Title */}
        {item.title ? (
          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>
        ) : null}

        {/* Items preview */}
        <ItemsPreview item={item} />

        {/* Caption */}
        {item.caption ? (
          <Text style={styles.caption} numberOfLines={2}>
            {item.caption}
          </Text>
        ) : null}

        {/* Total */}
        <View style={styles.totalRow}>
          <Pressable onPress={handleRestaurantPress} style={styles.restaurantLink}>
            <Ionicons name="location-outline" size={12} color={Colors.inkSecondary} />
            <Text style={styles.restaurantLinkText} numberOfLines={1}>
              {item.restaurant.name}
            </Text>
          </Pressable>
          <Text style={styles.totalText}>{formatPrice(item.total)}</Text>
        </View>

        {/* ── Actions row ── */}
        <View style={styles.actions}>
          {/* Save — LARGEST, sage green when active */}
          <ActionBtn
            icon="bookmark-outline"
            activeIcon="bookmark"
            count={saveCount}
            isActive={saved}
            activeColor={Colors.saveGreen}
            onPress={handleSave}
            size="large"
          />

          {/* Tried */}
          <ActionBtn
            icon="checkmark-circle-outline"
            activeIcon="checkmark-circle"
            count={tryCount}
            isActive={tried}
            activeColor={Colors.triedPurple}
            onPress={handleTried}
          />

          {/* Like */}
          <ActionBtn
            icon="heart-outline"
            activeIcon="heart"
            count={likeCount}
            isActive={liked}
            activeColor={Colors.accent}
            onPress={handleLike}
          />
          {/* Not For Me */}
          <Pressable style={actionStyles.btn} onPress={handleNotForMe} hitSlop={8}>
            <Ionicons name="thumbs-down-outline" size={18} color={Colors.inkSecondary} />
          </Pressable>

          {/* Spacer */}
          <View style={{ flex: 1 }} />

          {/* Share */}
          <Pressable style={actionStyles.btn} onPress={handleShare} hitSlop={8}>
            <Ionicons
              name="arrow-redo-outline"
              size={18}
              color={Colors.inkSecondary}
            />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  notForMeCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F5F5F5",
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginBottom: 12,
  },
  notForMeText: {
    fontSize: 14,
    color: "#888",
    fontWeight: "500",
  },
  notForMeUndo: {
    fontSize: 13,
    color: "#C8472B",
    fontWeight: "600",
  },
  card: {
    backgroundColor: Colors.card,
    marginHorizontal: CARD_PADDING,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 10,
    gap: 10,
  },
  authorRow: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  authorInfo: { flex: 1, gap: 1 },
  authorNameRow: { flexDirection: "row", alignItems: "center" },
  authorName: { fontSize: 14, fontWeight: "700", color: Colors.ink },
  metaText: { fontSize: 12, color: Colors.inkSecondary },
  moreBtn: { padding: 4 },
  // Body
  body: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 4,
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.ink,
    lineHeight: 22,
    letterSpacing: -0.1,
  },
  caption: {
    fontSize: 14,
    color: Colors.inkSecondary,
    lineHeight: 20,
  },
  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 2,
  },
  restaurantLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
  },
  restaurantLinkText: {
    fontSize: 12,
    color: Colors.inkSecondary,
    flex: 1,
  },
  totalText: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.ink,
  },
  // Actions
  actions: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    gap: 0,
    marginTop: 2,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
});
