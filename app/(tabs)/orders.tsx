import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/services/supabase";
import { useAuthStore } from "@/features/auth/authStore";
import { LegacyColors } from "@/constants/colors";
import { formatPrice, formatDate } from "@/utils";
import type { Order, OrderStatus } from "@/types";

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_META: Record<OrderStatus, { label: string; color: string; bg: string; icon: string }> = {
  pending:   { label: "Placed",     color: "#F57C00", bg: "#FFF8E1", icon: "time-outline"           },
  confirmed: { label: "Confirmed",  color: "#1565C0", bg: "#E3F2FD", icon: "checkmark-circle-outline"},
  preparing: { label: "Preparing",  color: "#6A1B9A", bg: "#F3E5F5", icon: "restaurant-outline"     },
  ready:     { label: "Ready",      color: "#2E7D32", bg: "#E8F5E9", icon: "bag-handle-outline"     },
  picked_up: { label: "Picked up",  color: "#00695C", bg: "#E0F2F1", icon: "bicycle-outline"        },
  delivered: { label: "Delivered",  color: LegacyColors.saveGreen, bg: LegacyColors.saveGreenLight, icon: "checkmark-done-circle-outline" },
  cancelled: { label: "Cancelled",  color: LegacyColors.danger, bg: LegacyColors.accentLight, icon: "close-circle-outline" },
};

// ─── Order card ───────────────────────────────────────────────────────────────

function OrderCard({ order }: { order: Order }) {
  const router = useRouter();
  const meta = STATUS_META[order.status];
  return (
    <Pressable
      style={cardStyles.card}
      onPress={() => router.push(`/order/${order.id}`)}
    >
      {/* Top row */}
      <View style={cardStyles.top}>
        <Text style={cardStyles.restaurantName} numberOfLines={1}>
          {order.restaurant?.name ?? "Restaurant"}
        </Text>
        <View style={[cardStyles.badge, { backgroundColor: meta.bg }]}>
          <Ionicons name={meta.icon as any} size={12} color={meta.color} />
          <Text style={[cardStyles.badgeText, { color: meta.color }]}>{meta.label}</Text>
        </View>
      </View>
      {/* Meta */}
      <Text style={cardStyles.date}>{formatDate(order.created_at)}</Text>
      {/* Bottom row */}
      <View style={cardStyles.bottom}>
        <Text style={cardStyles.items}>
          {order.items?.length ?? 0} item{order.items?.length !== 1 ? "s" : ""}
        </Text>
        <Text style={cardStyles.total}>{formatPrice(order.total)}</Text>
      </View>
      {/* Active order indicator */}
      {(order.status === "preparing" || order.status === "ready" || order.status === "picked_up") && (
        <View style={cardStyles.activePill}>
          <View style={cardStyles.activeDot} />
          <Text style={cardStyles.activeText}>Live update</Text>
        </View>
      )}
    </Pressable>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: LegacyColors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: LegacyColors.border,
    gap: 6,
    shadowColor: LegacyColors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  restaurantName: { fontSize: 16, fontWeight: "700", color: LegacyColors.ink, flex: 1, marginRight: 8 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: { fontSize: 12, fontWeight: "600" },
  date: { fontSize: 13, color: LegacyColors.inkSecondary },
  bottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  items: { fontSize: 14, color: LegacyColors.inkSecondary },
  total: { fontSize: 16, fontWeight: "700", color: LegacyColors.ink },
  activePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 6,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: LegacyColors.border,
  },
  activeDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: LegacyColors.saveGreen,
  },
  activeText: { fontSize: 12, color: LegacyColors.saveGreen, fontWeight: "600" },
});

// ─── Fetch ────────────────────────────────────────────────────────────────────

async function fetchOrders(userId: string): Promise<Order[]> {
  const { data, error } = await supabase
    .from("orders")
    .select("*, restaurant:restaurants(*), items:order_items(*, menu_item:menu_items(*))")
    .eq("customer_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as Order[]) ?? [];
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function OrdersScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["orders", user?.id],
    queryFn: () => fetchOrders(user!.id),
    enabled: !!user,
    refetchInterval: 30_000, // poll for live status updates
  });

  const activeOrders = data?.filter(
    (o) => !["delivered", "cancelled"].includes(o.status)
  ) ?? [];
  const pastOrders = data?.filter(
    (o) => ["delivered", "cancelled"].includes(o.status)
  ) ?? [];

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <FlatList
        data={pastOrders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={LegacyColors.accent}
          />
        }
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <Text style={styles.title}>Orders</Text>
            </View>

            {isLoading ? (
              <ActivityIndicator color={LegacyColors.accent} style={styles.loader} />
            ) : (
              <>
                {/* Active orders */}
                {activeOrders.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Active</Text>
                    {activeOrders.map((o) => (
                      <OrderCard key={o.id} order={o} />
                    ))}
                  </View>
                )}

                {/* Past orders header */}
                {pastOrders.length > 0 && (
                  <Text style={[styles.sectionLabel, { marginBottom: 0 }]}>Past orders</Text>
                )}
              </>
            )}
          </View>
        }
        renderItem={({ item }) => <OrderCard order={item} />}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>📋</Text>
              <Text style={styles.emptyTitle}>No orders yet</Text>
              <Text style={styles.emptySubtitle}>Your order history will appear here.</Text>
              <Pressable
                style={styles.startBtn}
                onPress={() => router.push("/create/restaurant")}
              >
                <Text style={styles.startBtnText}>Start an order</Text>
              </Pressable>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: LegacyColors.surface },
  list: { padding: 16, gap: 10, paddingBottom: 40 },
  header: { marginBottom: 16 },
  title: { fontSize: 28, fontWeight: "800", color: LegacyColors.ink, letterSpacing: -0.3 },
  loader: { marginTop: 40 },
  section: { gap: 10, marginBottom: 20 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: LegacyColors.inkSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  empty: { alignItems: "center", paddingTop: 60, gap: 8 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 20, fontWeight: "700", color: LegacyColors.ink },
  emptySubtitle: { fontSize: 14, color: LegacyColors.inkSecondary },
  startBtn: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: LegacyColors.accent,
    borderRadius: 12,
  },
  startBtnText: { fontSize: 15, fontWeight: "700", color: LegacyColors.white },
});
