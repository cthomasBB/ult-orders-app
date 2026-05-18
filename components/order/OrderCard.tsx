import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { formatPrice, formatDate } from "@/utils";
import type { Order, OrderStatus } from "@/types";

const STATUS_META: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  pending:   { label: "Placed",    color: "#F57C00",        bg: "#FFF8E1"             },
  confirmed: { label: "Confirmed", color: "#1565C0",        bg: "#E3F2FD"             },
  preparing: { label: "Preparing", color: "#6A1B9A",        bg: "#F3E5F5"             },
  ready:     { label: "Ready",     color: Colors.saveGreen, bg: Colors.saveGreenLight },
  picked_up: { label: "Picked up", color: "#00695C",        bg: "#E0F2F1"             },
  delivered: { label: "Delivered", color: Colors.saveGreen, bg: Colors.saveGreenLight },
  cancelled: { label: "Cancelled", color: Colors.danger,    bg: Colors.accentLight    },
};

export function OrderCard({ order }: { order: Order }) {
  const router = useRouter();
  const meta = STATUS_META[order.status];
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => router.push(`/order/${order.id}`)}
    >
      <View style={styles.top}>
        <Text style={styles.name} numberOfLines={1}>{order.restaurant?.name ?? "Restaurant"}</Text>
        <View style={[styles.badge, { backgroundColor: meta.bg }]}>
          <Text style={[styles.badgeText, { color: meta.color }]}>{meta.label}</Text>
        </View>
      </View>
      <Text style={styles.date}>{formatDate(order.created_at)}</Text>
      <View style={styles.bottom}>
        <Text style={styles.items}>{order.items?.length ?? 0} item{order.items?.length !== 1 ? "s" : ""}</Text>
        <Text style={styles.total}>{formatPrice(order.total)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: Colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.border, gap: 5, shadowColor: Colors.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  cardPressed: { backgroundColor: Colors.surface },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  name: { fontSize: 16, fontWeight: "700", color: Colors.ink, flex: 1, marginRight: 8 },
  badge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 12, fontWeight: "600" },
  date: { fontSize: 13, color: Colors.inkSecondary },
  bottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  items: { fontSize: 14, color: Colors.inkSecondary },
  total: { fontSize: 16, fontWeight: "700", color: Colors.ink },
});
