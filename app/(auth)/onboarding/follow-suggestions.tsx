import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LegacyColors } from "@/constants/colors";

// ─── Suggested users data ─────────────────────────────────────────────────────

type SuggestedUser = {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  emoji: string;
  tags: string[];
};

const SUGGESTED_USERS: SuggestedUser[] = [
  {
    id: "u1",
    username: "spice_oracle",
    display_name: "Spice Oracle",
    bio: "I eat fire for breakfast. Sichuan addict.",
    emoji: "🌶️",
    tags: ["Spicy", "Chinese", "Korean"],
  },
  {
    id: "u2",
    username: "ramen_ronin",
    display_name: "Ramen Ronin",
    bio: "Chasing the perfect bowl across the city.",
    emoji: "🍜",
    tags: ["Japanese", "Thai", "Late night"],
  },
  {
    id: "u3",
    username: "plant_palate",
    display_name: "Plant Palate",
    bio: "Vegan food that actually slaps.",
    emoji: "🌱",
    tags: ["Vegan", "Healthy", "Middle Eastern"],
  },
  {
    id: "u4",
    username: "brunch_boss",
    display_name: "Brunch Boss",
    bio: "Weekend brunches are a religion.",
    emoji: "🥞",
    tags: ["Brunch", "American", "French"],
  },
  {
    id: "u5",
    username: "street_eats_sam",
    display_name: "Street Eats Sam",
    bio: "Best food never comes from inside restaurants.",
    emoji: "🧆",
    tags: ["Street food", "Mexican", "Indian"],
  },
];

// ─── User row ─────────────────────────────────────────────────────────────────

function UserRow({
  user,
  isFollowing,
  onToggle,
}: {
  user: SuggestedUser;
  isFollowing: boolean;
  onToggle: () => void;
}) {
  return (
    <View style={rowStyles.row}>
      {/* Avatar */}
      <View style={rowStyles.avatar}>
        <Text style={rowStyles.avatarEmoji}>{user.emoji}</Text>
      </View>

      {/* Info */}
      <View style={rowStyles.info}>
        <Text style={rowStyles.displayName}>{user.display_name}</Text>
        <Text style={rowStyles.username}>@{user.username}</Text>
        <Text style={rowStyles.bio} numberOfLines={1}>{user.bio}</Text>
        <View style={rowStyles.tags}>
          {user.tags.slice(0, 3).map((tag) => (
            <View key={tag} style={rowStyles.tag}>
              <Text style={rowStyles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Follow button */}
      <Pressable
        style={({ pressed }) => [
          rowStyles.followBtn,
          isFollowing && rowStyles.followBtnActive,
          pressed && rowStyles.followBtnPressed,
        ]}
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityLabel={isFollowing ? `Unfollow ${user.display_name}` : `Follow ${user.display_name}`}
      >
        {isFollowing ? (
          <Ionicons name="checkmark" size={16} color={LegacyColors.accent} />
        ) : null}
        <Text
          style={[
            rowStyles.followBtnText,
            isFollowing && rowStyles.followBtnTextActive,
          ]}
        >
          {isFollowing ? "Following" : "Follow"}
        </Text>
      </Pressable>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: LegacyColors.border,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: LegacyColors.accentLight,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatarEmoji: { fontSize: 24 },
  info: { flex: 1, gap: 2 },
  displayName: { fontSize: 15, fontWeight: "700", color: LegacyColors.ink },
  username: { fontSize: 12, color: LegacyColors.inkSecondary },
  bio: { fontSize: 13, color: LegacyColors.inkSecondary, marginTop: 2 },
  tags: { flexDirection: "row", gap: 4, marginTop: 4, flexWrap: "wrap" },
  tag: {
    backgroundColor: LegacyColors.surface,
    borderWidth: 1,
    borderColor: LegacyColors.border,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tagText: { fontSize: 11, color: LegacyColors.inkSecondary, fontWeight: "500" },
  followBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: LegacyColors.accent,
    backgroundColor: LegacyColors.accent,
    flexShrink: 0,
  },
  followBtnActive: {
    backgroundColor: LegacyColors.card,
    borderColor: LegacyColors.border,
  },
  followBtnPressed: { opacity: 0.75 },
  followBtnText: { fontSize: 13, fontWeight: "700", color: LegacyColors.white },
  followBtnTextActive: { color: LegacyColors.inkSecondary },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function FollowSuggestionsScreen() {
  const router = useRouter();
  const [following, setFollowing] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setFollowing((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const handleFinish = () => {
    // In production: POST followed user IDs to your follows table
    // For now, navigate into the main app
    router.replace("/(tabs)/");
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.step}>Step 2 of 2</Text>
        <Text style={styles.title}>Follow some foodies</Text>
        <Text style={styles.subtitle}>
          Get inspired by people with similar taste.
        </Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: "100%" }]} />
        </View>
      </View>

      {/* User list */}
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {SUGGESTED_USERS.map((user) => (
          <UserRow
            key={user.id}
            user={user}
            isFollowing={following.has(user.id)}
            onToggle={() => toggle(user.id)}
          />
        ))}
      </ScrollView>

      {/* Footer actions */}
      <View style={styles.footer}>
        {following.size > 0 ? (
          <Pressable
            style={({ pressed }) => [
              styles.doneBtn,
              pressed && styles.doneBtnPressed,
            ]}
            onPress={handleFinish}
          >
            <Text style={styles.doneBtnText}>
              {`Done · Following ${following.size}`}
            </Text>
            <Ionicons name="arrow-forward" size={18} color={LegacyColors.white} />
          </Pressable>
        ) : (
          <Pressable
            style={({ pressed }) => [
              styles.doneBtn,
              pressed && styles.doneBtnPressed,
            ]}
            onPress={handleFinish}
          >
            <Text style={styles.doneBtnText}>Let's go</Text>
            <Ionicons name="arrow-forward" size={18} color={LegacyColors.white} />
          </Pressable>
        )}

        <Pressable style={styles.skipBtn} onPress={handleFinish}>
          <Text style={styles.skipText}>Skip for now</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: LegacyColors.surface },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 12,
    gap: 4,
  },
  step: {
    fontSize: 12,
    fontWeight: "700",
    color: LegacyColors.accent,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: LegacyColors.ink,
    letterSpacing: -0.3,
  },
  subtitle: { fontSize: 14, color: LegacyColors.inkSecondary, lineHeight: 20 },
  progressTrack: {
    height: 4,
    backgroundColor: LegacyColors.border,
    borderRadius: 2,
    marginTop: 12,
    overflow: "hidden",
  },
  progressFill: {
    height: 4,
    backgroundColor: LegacyColors.accent,
    borderRadius: 2,
  },
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 4,
    paddingBottom: 16,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 12,
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: LegacyColors.border,
    backgroundColor: LegacyColors.surface,
  },
  doneBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 54,
    borderRadius: 14,
    backgroundColor: LegacyColors.accent,
    gap: 8,
    shadowColor: LegacyColors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },
  doneBtnPressed: { backgroundColor: LegacyColors.accentDark },
  doneBtnText: { fontSize: 16, fontWeight: "700", color: LegacyColors.white },
  skipBtn: {
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  skipText: { fontSize: 14, color: LegacyColors.inkSecondary, fontWeight: "500" },
});
