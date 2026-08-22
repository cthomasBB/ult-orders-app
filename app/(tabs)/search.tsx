import { useState, useMemo } from "react";
import { Image, FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LegacyColors } from "@/constants/colors";
import { MOCK_FEED_ITEMS, MOCK_SAVED_ITEMS } from "@/features/feed/mockData";

const ALL_POSTS = [...MOCK_FEED_ITEMS, ...MOCK_SAVED_ITEMS];

const CUISINE_FILTERS = [
  { id: "all",      label: "All"         },
  { id: "Japanese", label: "🍣 Japanese" },
  { id: "Korean",   label: "🥩 Korean"   },
  { id: "Mexican",  label: "🌮 Mexican"  },
  { id: "American", label: "🍔 American" },
  { id: "Vegan",    label: "🥗 Vegan"    },
  { id: "Sushi",    label: "🍱 Sushi"    },
  { id: "Burgers",  label: "🍔 Burgers"  },
  { id: "Tacos",    label: "🌮 Tacos"    },
];

const TRENDING_SEARCHES = [
  "Halal", "Ramen", "Wings", "Sushi", "Tacos", "Burgers", "Vegan", "Late Night",
];

export default function FindScreen() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeCuisine, setActiveCuisine] = useState("all");

  const results = useMemo(() => {
    const q = query.toLowerCase().trim();
    return ALL_POSTS.filter((post) => {
      const matchesQuery = q === "" || (
        post.title?.toLowerCase().includes(q) ||
        post.restaurant.name.toLowerCase().includes(q) ||
        post.author.username.toLowerCase().includes(q) ||
        post.author.display_name?.toLowerCase().includes(q) ||
        post.items.some((i) => i.name.toLowerCase().includes(q)) ||
        post.tags.some((t) => t.toLowerCase().includes(q))
      );
      const matchesCuisine = activeCuisine === "all" ||
        post.restaurant.cuisine_type.some((c) =>
          c.toLowerCase() === activeCuisine.toLowerCase()
        ) ||
        post.tags.some((t) => t.toLowerCase() === activeCuisine.toLowerCase());
      return matchesQuery && matchesCuisine;
    });
  }, [query, activeCuisine]);

  const uniqueRestaurants = useMemo(() => {
    const seen = new Set<string>();
    return ALL_POSTS.filter((post) => {
      if (seen.has(post.restaurant.id)) return false;
      seen.add(post.restaurant.id);
      return true;
    }).map((post) => post.restaurant);
  }, []);

  const showEmpty = query.length === 0 && activeCuisine === "all";

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>

      {/* Search bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={LegacyColors.inkSecondary} />
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Search orders, restaurants, creators..."
          placeholderTextColor={LegacyColors.inkDisabled}
          returnKeyType="search"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery("")}>
            <Ionicons name="close-circle" size={18} color={LegacyColors.inkDisabled} />
          </Pressable>
        )}
      </View>

      {/* Cuisine filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {CUISINE_FILTERS.map((f) => (
          <Pressable
            key={f.id}
            style={[styles.filterChip, activeCuisine === f.id && styles.filterChipActive]}
            onPress={() => setActiveCuisine(f.id)}
          >
            <Text style={[styles.filterChipText, activeCuisine === f.id && styles.filterChipTextActive]}>
              {f.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {showEmpty ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.emptyScroll}>

          {/* Trending searches */}
          <Text style={styles.sectionTitle}>Trending Searches</Text>
          <View style={styles.trendingRow}>
            {TRENDING_SEARCHES.map((t) => (
              <Pressable key={t} style={styles.trendingChip} onPress={() => setQuery(t)}>
                <Ionicons name="trending-up" size={12} color={LegacyColors.accent} />
                <Text style={styles.trendingText}>{t}</Text>
              </Pressable>
            ))}
          </View>

          {/* Browse restaurants */}
          <Text style={styles.sectionTitle}>Browse Restaurants</Text>
          {uniqueRestaurants.map((restaurant) => (
            <Pressable
              key={restaurant.id}
              style={styles.restaurantRow}
              onPress={() => router.push(`/restaurant/${restaurant.id}` as any)}
            >
              <View style={styles.restaurantThumb}>
                <Text style={styles.thumbEmoji}>🍽️</Text>
              </View>
              <View style={styles.restaurantInfo}>
                <Text style={styles.restaurantName}>{restaurant.name}</Text>
                <Text style={styles.restaurantMeta}>
                  {restaurant.cuisine_type.slice(0, 2).join(" · ")} · ⭐ {restaurant.average_rating.toFixed(1)}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={LegacyColors.inkDisabled} />
            </Pressable>
          ))}

          {/* Top orders */}
          <Text style={styles.sectionTitle}>Top Orders</Text>
          {[...ALL_POSTS].sort((a, b) => b.save_count - a.save_count).slice(0, 5).map((post) => (
            <Pressable
              key={post.id}
              style={styles.orderRow}
              onPress={() => router.push(`/ult-order/${post.id}` as any)}
            >
              <View style={styles.orderThumb}>
                {post.media?.[0]?.url ? (
                  <Image source={{ uri: post.media[0].url }} style={styles.orderThumbImg} />
                ) : (
                  <Text style={styles.thumbEmoji}>🍽️</Text>
                )}
              </View>
              <View style={styles.orderInfo}>
                <Text style={styles.orderTitle} numberOfLines={1}>{post.title}</Text>
                <Text style={styles.orderMeta}>{post.restaurant.name}</Text>
              </View>
              <View style={styles.saveCount}>
                <Ionicons name="bookmark" size={12} color={LegacyColors.saveGreen} />
                <Text style={styles.saveCountText}>{post.save_count}</Text>
              </View>
            </Pressable>
          ))}

        </ScrollView>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.resultsList}
          ListHeaderComponent={
            results.length > 0 ? (
              <Text style={styles.resultCount}>{results.length} result{results.length !== 1 ? "s" : ""}</Text>
            ) : null
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.orderRow}
              onPress={() => router.push(`/ult-order/${item.id}` as any)}
            >
              <View style={styles.orderThumb}>
                {item.media?.[0]?.url ? (
                  <Image source={{ uri: item.media[0].url }} style={styles.orderThumbImg} />
                ) : (
                  <Text style={styles.thumbEmoji}>🍽️</Text>
                )}
              </View>
              <View style={styles.orderInfo}>
                <Text style={styles.orderTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.orderMeta}>{item.restaurant.name}</Text>
                <Text style={styles.orderAuthor}>@{item.author.username}</Text>
              </View>
              <View style={styles.saveCount}>
                <Ionicons name="bookmark" size={12} color={LegacyColors.saveGreen} />
                <Text style={styles.saveCountText}>{item.save_count}</Text>
              </View>
            </Pressable>
          )}
          ListEmptyComponent={
            <View style={styles.noResults}>
              <Text style={styles.noResultsEmoji}>🔍</Text>
              <Text style={styles.noResultsTitle}>No results found</Text>
              <Text style={styles.noResultsSub}>Try a different search or filter</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: LegacyColors.surface },
  searchBar: { flexDirection: "row", alignItems: "center", gap: 10, margin: 16, marginBottom: 8, paddingHorizontal: 14, height: 48, borderRadius: 14, backgroundColor: LegacyColors.card, borderWidth: 1.5, borderColor: LegacyColors.border },
  searchInput: { flex: 1, fontSize: 15, color: LegacyColors.ink },
  filterRow: { paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: LegacyColors.border, backgroundColor: LegacyColors.surface, height: 34, alignItems: "center", justifyContent: "center" },
  filterChipActive: { backgroundColor: LegacyColors.accentLight, borderColor: LegacyColors.accent },
  filterChipText: { fontSize: 13, color: LegacyColors.ink, fontWeight: "500" },
  filterChipTextActive: { color: LegacyColors.accent, fontWeight: "700" },
  emptyScroll: { paddingHorizontal: 16, paddingBottom: 40 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: LegacyColors.ink, marginTop: 20, marginBottom: 12 },
  trendingRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  trendingChip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: LegacyColors.card, borderWidth: 1, borderColor: LegacyColors.border },
  trendingText: { fontSize: 13, color: LegacyColors.ink, fontWeight: "500" },
  restaurantRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: LegacyColors.border },
  restaurantThumb: { width: 48, height: 48, borderRadius: 12, backgroundColor: LegacyColors.accentLight, alignItems: "center", justifyContent: "center" },
  thumbEmoji: { fontSize: 22 },
  restaurantInfo: { flex: 1 },
  restaurantName: { fontSize: 15, fontWeight: "700", color: LegacyColors.ink },
  restaurantMeta: { fontSize: 13, color: LegacyColors.inkSecondary, marginTop: 2 },
  orderRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: LegacyColors.border },
  orderThumb: { width: 52, height: 52, borderRadius: 12, backgroundColor: LegacyColors.accentLight, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  orderThumbImg: { width: 52, height: 52 },
  orderInfo: { flex: 1 },
  orderTitle: { fontSize: 14, fontWeight: "700", color: LegacyColors.ink, flexShrink: 1 },
  orderMeta: { fontSize: 12, color: LegacyColors.inkSecondary, marginTop: 2 },
  orderAuthor: { fontSize: 12, color: LegacyColors.accent, marginTop: 2 },
  saveCount: { flexDirection: "row", alignItems: "center", gap: 3 },
  saveCountText: { fontSize: 12, fontWeight: "600", color: LegacyColors.inkSecondary },
  resultsList: { paddingHorizontal: 16, paddingBottom: 40 },
  resultCount: { fontSize: 12, color: LegacyColors.inkSecondary, fontWeight: "600", paddingVertical: 8, textTransform: "uppercase", letterSpacing: 0.5 },
  noResults: { alignItems: "center", paddingTop: 60, gap: 8 },
  noResultsEmoji: { fontSize: 40 },
  noResultsTitle: { fontSize: 18, fontWeight: "700", color: LegacyColors.ink },
  noResultsSub: { fontSize: 14, color: LegacyColors.inkSecondary },
});
