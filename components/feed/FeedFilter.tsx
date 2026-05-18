import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFeedStore } from "@/features/feed/store";

const CUISINES = ["Pizza", "Sushi", "Burgers", "Mexican", "Ramen", "Indian", "Salads", "Chicken"];
const RATINGS = [4.5, 4, 3.5];
const DISTANCES = [2, 5, 10];

export function FeedFilter() {
  const { filters, setFilters, resetFilters } = useFeedStore();
  const hasActive =
    filters.cuisine.length > 0 ||
    filters.minRating > 0 ||
    filters.maxDistance < 10 ||
    filters.openNow;

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {/* Open now */}
        <Pressable
          style={[styles.chip, filters.openNow && styles.chipActive]}
          onPress={() => setFilters({ openNow: !filters.openNow })}
        >
          <Text style={[styles.chipText, filters.openNow && styles.chipTextActive]}>
            🟢 Open Now
          </Text>
        </Pressable>

        {/* Rating */}
        {RATINGS.map((r) => (
          <Pressable
            key={r}
            style={[styles.chip, filters.minRating === r && styles.chipActive]}
            onPress={() => setFilters({ minRating: filters.minRating === r ? 0 : r })}
          >
            <Text style={[styles.chipText, filters.minRating === r && styles.chipTextActive]}>
              ⭐ {r}+
            </Text>
          </Pressable>
        ))}

        {/* Distance */}
        {DISTANCES.map((d) => (
          <Pressable
            key={d}
            style={[styles.chip, filters.maxDistance === d && styles.chipActive]}
            onPress={() => setFilters({ maxDistance: filters.maxDistance === d ? 10 : d })}
          >
            <Text style={[styles.chipText, filters.maxDistance === d && styles.chipTextActive]}>
              📍 {d}km
            </Text>
          </Pressable>
        ))}

        {/* Cuisines */}
        {CUISINES.map((c) => (
          <Pressable
            key={c}
            style={[styles.chip, filters.cuisine.includes(c) && styles.chipActive]}
            onPress={() =>
              setFilters({
                cuisine: filters.cuisine.includes(c)
                  ? filters.cuisine.filter((x) => x !== c)
                  : [...filters.cuisine, c],
              })
            }
          >
            <Text style={[styles.chipText, filters.cuisine.includes(c) && styles.chipTextActive]}>
              {c}
            </Text>
          </Pressable>
        ))}

        {/* Reset */}
        {hasActive && (
          <Pressable style={styles.resetChip} onPress={resetFilters}>
            <Text style={styles.resetText}>✕ Clear</Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { borderBottomWidth: 1, borderBottomColor: Colors.surface },
  row: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  chipText: { fontSize: 13, color: Colors.inkSecondary, fontWeight: "500" },
  chipTextActive: { color: Colors.white },
  resetChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#FFF0EC",
    borderWidth: 1,
    borderColor: "#FFD4B8",
  },
  resetText: { fontSize: 13, color: Colors.accent, fontWeight: "600" },
});
