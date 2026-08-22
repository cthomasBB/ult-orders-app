import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LegacyColors } from "@/constants/colors";
import type { Restaurant } from "@/types";

type Props = { restaurant: Restaurant };

export function RestaurantCard({ restaurant }: Props) {
  const router = useRouter();
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => router.push(`/restaurant/${restaurant.id}`)}
    >
      <View style={styles.thumb}>
        <Text style={styles.thumbEmoji}>🍽️</Text>
        {restaurant.status === "open" && <View style={styles.openDot} />}
      </View>
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>{restaurant.name}</Text>
        <Text style={styles.cuisine} numberOfLines={1}>
          {restaurant.cuisine_type.slice(0, 2).join(" · ")}
        </Text>
        <View style={styles.footer}>
          <Text style={styles.rating}>⭐ {restaurant.average_rating.toFixed(1)}</Text>
          <View style={styles.sep} />
          <Ionicons name="location-outline" size={11} color={LegacyColors.inkSecondary} />
          <Text style={styles.address} numberOfLines={1}>
            {restaurant.address.split(",")[0]}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={LegacyColors.inkDisabled} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
    backgroundColor: LegacyColors.card,
    borderWidth: 1,
    borderColor: LegacyColors.border,
    gap: 12,
    shadowColor: LegacyColors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  cardPressed: { backgroundColor: LegacyColors.surface },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 14,
    backgroundColor: LegacyColors.accentLight,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    position: "relative",
  },
  thumbEmoji: { fontSize: 28 },
  openDot: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: LegacyColors.saveGreen,
    borderWidth: 2,
    borderColor: LegacyColors.card,
  },
  body: { flex: 1, gap: 3 },
  name: { fontSize: 15, fontWeight: "700", color: LegacyColors.ink },
  cuisine: { fontSize: 13, color: LegacyColors.inkSecondary },
  footer: { flexDirection: "row", alignItems: "center", gap: 4 },
  rating: { fontSize: 12, fontWeight: "600", color: LegacyColors.ink },
  sep: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: LegacyColors.border },
  address: { flex: 1, fontSize: 12, color: LegacyColors.inkSecondary },
});
