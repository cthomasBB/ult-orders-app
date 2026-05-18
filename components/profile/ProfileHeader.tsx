import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { formatCount } from "@/features/feed/useFeed";
import { STATUS_LABELS } from "@/types/profile";
import { StatusRing } from "./StatusRing";
import type { UserProfile, UserBadge, ViewerRelation } from "@/types/profile";

// ─── Avatar ───────────────────────────────────────────────────────────────────

const AVATAR_SIZE = 84;

function Avatar({ user }: { user: UserProfile }) {
  const initial = (user.display_name ?? user.username).charAt(0).toUpperCase();
  return (
    <StatusRing level={user.status_level} avatarSize={AVATAR_SIZE}>
      {user.avatar_url ? (
        <Image
          source={{ uri: user.avatar_url }}
          style={avatarStyles.img}
        />
      ) : (
        <View style={avatarStyles.placeholder}>
          <Text style={avatarStyles.initial}>{initial}</Text>
        </View>
      )}
    </StatusRing>
  );
}

const avatarStyles = StyleSheet.create({
  img: { width: AVATAR_SIZE, height: AVATAR_SIZE },
  placeholder: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    backgroundColor: Colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  initial: { fontSize: 34, fontWeight: "800", color: Colors.white },
});

// ─── Stat item ────────────────────────────────────────────────────────────────

function StatItem({
  value,
  label,
  onPress,
}: {
  value: number;
  label: string;
  onPress?: () => void;
}) {
  return (
    <Pressable style={statStyles.item} onPress={onPress} hitSlop={8}>
      <Text style={statStyles.value}>{formatCount(value)}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </Pressable>
  );
}

const statStyles = StyleSheet.create({
  item: { alignItems: "center", flex: 1 },
  value: { fontSize: 19, fontWeight: "800", color: Colors.ink, letterSpacing: -0.3 },
  label: { fontSize: 12, color: Colors.inkSecondary, marginTop: 1 },
});

// ─── Badge row ────────────────────────────────────────────────────────────────

const BADGE_EMOJIS: Record<string, string> = {
  first_ult_order:  "🍽️",
  taste_explorer:   "🗺️",
  trendsetter:      "🔥",
  week_streak:      "🔥",
  social_butterfly: "🦋",
  food_critic:      "✍️",
  tried_it:         "✅",
  collector:        "📚",
  og:               "⭐",
};

function BadgeRow({ badges }: { badges: UserBadge[] }) {
  if (badges.length === 0) return null;
  const visible = badges.slice(0, 3);
  const extra = badges.length - 3;

  return (
    <View style={badgeStyles.row}>
      {visible.map((b) => (
        <View key={b.id} style={badgeStyles.badge}>
          <Text style={badgeStyles.emoji}>{BADGE_EMOJIS[b.slug] ?? "🏅"}</Text>
        </View>
      ))}
      {extra > 0 && (
        <View style={badgeStyles.more}>
          <Text style={badgeStyles.moreText}>+{extra}</Text>
        </View>
      )}
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  row: { flexDirection: "row", gap: 6, alignItems: "center" },
  badge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: { fontSize: 16 },
  more: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  moreText: { fontSize: 11, fontWeight: "700", color: Colors.inkSecondary },
});

// ─── Taste tag pills ──────────────────────────────────────────────────────────

function TasteTags({ tags }: { tags: string[] }) {
  if (tags.length === 0) return null;
  return (
    <View style={tasteStyles.row}>
      {tags.map((tag) => (
        <View key={tag} style={tasteStyles.pill}>
          <Text style={tasteStyles.pillText}>{tag}</Text>
        </View>
      ))}
    </View>
  );
}

const tasteStyles = StyleSheet.create({
  row: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: Colors.accentLight,
    borderWidth: 1,
    borderColor: Colors.accent + "60",
  },
  pillText: { fontSize: 12, fontWeight: "600", color: Colors.accent },
});

// ─── Action buttons ───────────────────────────────────────────────────────────

type ActionBtnProps = {
  isOwn: boolean;
  isFollowing: boolean;
  onEdit: () => void;
  onFollow: () => void;
  onMessage: () => void;
};

function ActionButtons({
  isOwn,
  isFollowing,
  onEdit,
  onFollow,
  onMessage,
}: ActionBtnProps) {
  if (isOwn) {
    return (
      <View style={actionStyles.row}>
        <Pressable
          style={({ pressed }) => [actionStyles.btn, actionStyles.btnOutline, pressed && actionStyles.btnPressed]}
          onPress={onEdit}
        >
          <Ionicons name="pencil-outline" size={16} color={Colors.ink} />
          <Text style={actionStyles.btnOutlineText}>Edit Profile</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={actionStyles.row}>
      <Pressable
        style={({ pressed }) => [
          actionStyles.btn,
          isFollowing ? actionStyles.btnOutline : actionStyles.btnFill,
          pressed && actionStyles.btnPressed,
          { flex: 1 },
        ]}
        onPress={onFollow}
      >
        {isFollowing ? (
          <>
            <Ionicons name="checkmark" size={16} color={Colors.inkSecondary} />
            <Text style={actionStyles.btnOutlineText}>Following</Text>
          </>
        ) : (
          <Text style={actionStyles.btnFillText}>Follow</Text>
        )}
      </Pressable>
      <Pressable
        style={({ pressed }) => [
          actionStyles.iconBtn,
          pressed && actionStyles.btnPressed,
        ]}
      >
        <Ionicons name="chatbubble-outline" size={18} color={Colors.ink} />
      </Pressable>
    </View>
  );
}

const actionStyles = StyleSheet.create({
  row: { flexDirection: "row", gap: 8 },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 38,
    borderRadius: 10,
    paddingHorizontal: 16,
    gap: 6,
  },
  btnFill: { backgroundColor: Colors.accent },
  btnOutline: { borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.card },
  btnPressed: { opacity: 0.65 },
  btnFillText: { fontSize: 14, fontWeight: "700", color: Colors.white },
  btnOutlineText: { fontSize: 14, fontWeight: "600", color: Colors.ink },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
});

// ─── ProfileHeader ────────────────────────────────────────────────────────────

export type ProfileHeaderProps = {
  profile: UserProfile;
  badges: UserBadge[];
  tasteTags: string[];    // derived top-3 tags from orders
  relation: ViewerRelation;
  onFollow: () => void;
  onEdit: () => void;
};

export function ProfileHeader({
  profile,
  badges,
  tasteTags,
  relation,
  onFollow,
  onEdit,
}: ProfileHeaderProps) {
  const router = useRouter();

  const displayTags =
    tasteTags.length > 0
      ? tasteTags.slice(0, 3)
      : profile.taste_tags.slice(0, 3);

  return (
    <View style={styles.container}>
      {/* Top row: avatar + action buttons */}
      <View style={styles.topRow}>
        <Avatar user={profile} />
        <View style={styles.topRight}>
          <ActionButtons
            isOwn={relation.is_own_profile}
            isFollowing={relation.is_following}
            onEdit={onEdit}
            onFollow={onFollow}
            onMessage={() => {}}
          />
          {/* Status level badge */}
          <View style={styles.statusBadge}>
            <View
              style={[
                styles.statusDot,
                profile.status_level === "legend"
                  ? styles.statusDotLegend
                  : profile.status_level === "curator"
                  ? styles.statusDotCurator
                  : profile.status_level === "regular"
                  ? styles.statusDotRegular
                  : styles.statusDotRookie,
              ]}
            />
            <Text style={styles.statusText}>
              {STATUS_LABELS[profile.status_level]}
            </Text>
          </View>
        </View>
      </View>

      {/* Name + handle + city */}
      <View style={styles.nameBlock}>
        <View style={styles.nameRow}>
          <Text style={styles.displayName}>
            {profile.display_name ?? profile.username}
          </Text>
          {profile.is_verified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark" size={10} color={Colors.white} />
            </View>
          )}
        </View>
        <View style={styles.handleRow}>
          <Text style={styles.handle}>@{profile.username}</Text>
          {profile.city && (
            <>
              <Text style={styles.bullet}>·</Text>
              <Ionicons name="location-outline" size={12} color={Colors.inkSecondary} />
              <Text style={styles.city}>{profile.city}</Text>
            </>
          )}
        </View>
      </View>

      {/* Bio */}
      {profile.bio ? (
        <Text style={styles.bio} numberOfLines={2}>
          {profile.bio}
        </Text>
      ) : null}

      {/* Taste tags */}
      {displayTags.length > 0 && <TasteTags tags={displayTags} />}

      {/* Stats */}
      <View style={styles.statsRow}>
        <StatItem value={profile.ult_order_count} label="Orders" />
        <View style={styles.statDivider} />
        <StatItem
          value={profile.follower_count}
          label="Followers"
          onPress={() => router.push(`/profile/${profile.username}/followers` as any)}
        />
        <View style={styles.statDivider} />
        <StatItem
          value={profile.following_count}
          label="Following"
          onPress={() => router.push(`/profile/${profile.username}/following` as any)}
        />
      </View>

      {/* Badges */}
      {badges.length > 0 && <BadgeRow badges={badges} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 18,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  topRow: { flexDirection: "row", alignItems: "flex-start", gap: 14 },
  topRight: { flex: 1, gap: 10, paddingTop: 4 },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 5, alignSelf: "flex-start" },
  statusDot: { width: 7, height: 7, borderRadius: 3.5 },
  statusDotRookie:  { backgroundColor: Colors.inkDisabled },
  statusDotRegular: { backgroundColor: Colors.ringGold },
  statusDotCurator: { backgroundColor: Colors.ringGold },
  statusDotLegend:  { backgroundColor: Colors.accent },
  statusText: { fontSize: 11, fontWeight: "700", color: Colors.inkSecondary, textTransform: "uppercase", letterSpacing: 0.4 },
  nameBlock: { gap: 3 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  displayName: { fontSize: 20, fontWeight: "800", color: Colors.ink, letterSpacing: -0.3 },
  verifiedBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  handleRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  handle: { fontSize: 14, color: Colors.inkSecondary },
  bullet: { fontSize: 12, color: Colors.inkDisabled },
  city: { fontSize: 13, color: Colors.inkSecondary },
  bio: { fontSize: 14, color: Colors.inkSecondary, lineHeight: 20 },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: 28,
    backgroundColor: Colors.border,
  },
});
