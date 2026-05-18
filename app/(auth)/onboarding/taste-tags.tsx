import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { useAuthStore } from "@/features/auth/authStore";
import { saveTasteTags } from "@/services/supabase";

// ─── Tag data ─────────────────────────────────────────────────────────────────

type TagCategory = { label: string; tags: { id: string; label: string; emoji: string }[] };

const TAG_CATEGORIES: TagCategory[] = [
  {
    label: "Cuisine",
    tags: [
      { id: "japanese",  label: "Japanese",  emoji: "🍣" },
      { id: "mexican",   label: "Mexican",   emoji: "🌮" },
      { id: "italian",   label: "Italian",   emoji: "🍕" },
      { id: "korean",    label: "Korean",    emoji: "🥩" },
      { id: "chinese",   label: "Chinese",   emoji: "🥡" },
      { id: "indian",    label: "Indian",    emoji: "🍛" },
      { id: "american",  label: "American",  emoji: "🍔" },
      { id: "thai",      label: "Thai",      emoji: "🍜" },
      { id: "middle_eastern", label: "Middle Eastern", emoji: "🧆" },
      { id: "french",    label: "French",    emoji: "🥐" },
    ],
  },
  {
    label: "Vibe",
    tags: [
      { id: "spicy",     label: "Spicy",     emoji: "🌶️" },
      { id: "comfort",   label: "Comfort food", emoji: "🫕" },
      { id: "healthy",   label: "Healthy",   emoji: "🥗" },
      { id: "sweet",     label: "Sweet",     emoji: "🍰" },
      { id: "street",    label: "Street food", emoji: "🧆" },
      { id: "brunch",    label: "Brunch",    emoji: "🥞" },
      { id: "late_night", label: "Late night", emoji: "🌙" },
      { id: "fine_dining", label: "Fine dining", emoji: "🥂" },
    ],
  },
  {
    label: "Dietary",
    tags: [
      { id: "vegetarian", label: "Vegetarian", emoji: "🥦" },
      { id: "vegan",      label: "Vegan",      emoji: "🌱" },
      { id: "gluten_free", label: "Gluten-free", emoji: "🌾" },
      { id: "halal",      label: "Halal",      emoji: "✅" },
      { id: "dairy_free", label: "Dairy-free", emoji: "🥛" },
    ],
  },
];

const MIN_TAGS = 3;

// ─── Tag pill ─────────────────────────────────────────────────────────────────

function TagPill({
  tag,
  selected,
  onPress,
}: {
  tag: TagCategory["tags"][number];
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.pill, selected && styles.pillSelected]}
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
    >
      <Text style={styles.pillEmoji}>{tag.emoji}</Text>
      <Text style={[styles.pillLabel, selected && styles.pillLabelSelected]}>
        {tag.label}
      </Text>
    </Pressable>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function TasteTagsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleNext = async () => {
    if (selected.size < MIN_TAGS) {
      setError(`Pick at least ${MIN_TAGS} tags to continue.`);
      return;
    }
    setError(null);
    setIsSaving(true);
    try {
      if (user?.id) {
        await saveTasteTags(user.id, Array.from(selected));
      }
      router.replace("/(auth)/onboarding/follow-suggestions");
    } catch (e: any) {
      setError(e.message ?? "Failed to save preferences.");
    } finally {
      setIsSaving(false);
    }
  };

  const remaining = Math.max(0, MIN_TAGS - selected.size);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.step}>Step 1 of 2</Text>
        <Text style={styles.title}>What are you into?</Text>
        <Text style={styles.subtitle}>
          Pick at least {MIN_TAGS} tags — we'll personalise your feed.
        </Text>
        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: "50%" }]} />
        </View>
      </View>

      {/* Tag list */}
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {TAG_CATEGORIES.map((cat) => (
          <View key={cat.label} style={styles.section}>
            <Text style={styles.sectionLabel}>{cat.label}</Text>
            <View style={styles.pillRow}>
              {cat.tags.map((tag) => (
                <TagPill
                  key={tag.id}
                  tag={tag}
                  selected={selected.has(tag.id)}
                  onPress={() => toggle(tag.id)}
                />
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        {error && <Text style={styles.errorText}>{error}</Text>}
        <Pressable
          style={({ pressed }) => [
            styles.ctaBtn,
            selected.size < MIN_TAGS && styles.ctaBtnDisabled,
            pressed && selected.size >= MIN_TAGS && styles.ctaBtnPressed,
          ]}
          onPress={handleNext}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.ctaBtnText}>
              {remaining > 0
                ? `Pick ${remaining} more to continue`
                : "Build My Deck →"}
            </Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.surface },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 12,
    gap: 4,
  },
  step: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.accent,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: Colors.ink,
    letterSpacing: -0.3,
  },
  subtitle: { fontSize: 14, color: Colors.inkSecondary, lineHeight: 20 },
  progressTrack: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    marginTop: 12,
    overflow: "hidden",
  },
  progressFill: {
    height: 4,
    backgroundColor: Colors.accent,
    borderRadius: 2,
  },
  scroll: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 24, gap: 20 },
  section: { gap: 10 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.inkSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  pillSelected: {
    backgroundColor: Colors.accentLight,
    borderColor: Colors.accent,
  },
  pillEmoji: { fontSize: 15 },
  pillLabel: { fontSize: 14, fontWeight: "500", color: Colors.ink },
  pillLabelSelected: { color: Colors.accent, fontWeight: "700" },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
    gap: 8,
    backgroundColor: Colors.surface,
  },
  errorText: {
    fontSize: 13,
    color: Colors.danger,
    textAlign: "center",
  },
  ctaBtn: {
    height: 54,
    borderRadius: 14,
    backgroundColor: Colors.accent,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaBtnDisabled: {
    backgroundColor: Colors.inkDisabled,
    shadowOpacity: 0,
    elevation: 0,
  },
  ctaBtnPressed: { backgroundColor: Colors.accentDark },
  ctaBtnText: { fontSize: 16, fontWeight: "700", color: Colors.white },
});
