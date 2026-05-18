import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/services/supabase";
import { Colors } from "@/constants/colors";
import { formatPrice, formatDate } from "@/utils";
import type { Order, OrderStatus } from "@/types";

const STATUS_STEPS: OrderStatus[] = [
  "pending","confirmed","preparing","ready","picked_up","delivered",
];
const STATUS_LABEL: Record<OrderStatus, string> = {
  pending:   "Order Placed",
  confirmed: "Confirmed",
  preparing: "Being Prepared",
  ready:     "Ready for Pickup",
  picked_up: "Picked Up",
  delivered: "Delivered",
  cancelled: "Cancelled",
};
const STATUS_ICON: Record<OrderStatus, string> = {
  pending:   "time-outline",
  confirmed: "checkmark-circle-outline",
  preparing: "restaurant-outline",
  ready:     "bag-handle-outline",
  picked_up: "bicycle-outline",
  delivered: "checkmark-done-circle-outline",
  cancelled: "close-circle-outline",
};

async function fetchOrder(id: string): Promise<Order> {
  const { data, error } = await supabase
    .from("orders")
    .select("*, restaurant:restaurants(*), items:order_items(*, menu_item:menu_items(*))")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as Order;
}

function StatusTracker({ status }: { status: OrderStatus }) {
  if (status === "cancelled") {
    return (
      <View style={trackerStyles.cancelledBox}>
        <Ionicons name="close-circle" size={20} color={Colors.danger} />
        <Text style={trackerStyles.cancelledText}>Order Cancelled</Text>
      </View>
    );
  }
  const currentIdx = STATUS_STEPS.indexOf(status);
  return (
    <View style={trackerStyles.track}>
      {STATUS_STEPS.map((step, idx) => {
        const done = idx <= currentIdx;
        const active = idx === currentIdx;
        return (
          <View key={step} style={trackerStyles.row}>
            {idx > 0 && <View style={[trackerStyles.line, done && trackerStyles.lineDone]} />}
            <View style={[trackerStyles.node, done && trackerStyles.nodeDone, active && trackerStyles.nodeActive]}>
              {done
                ? <Ionicons name={STATUS_ICON[step] as any} size={14} color={Colors.white} />
                : <View style={trackerStyles.nodeDot} />}
            </View>
            <View style={trackerStyles.labelCol}>
              <Text style={[trackerStyles.label, done && trackerStyles.labelDone, active && trackerStyles.labelActive]}>
                {STATUS_LABEL[step]}
              </Text>
              {active && <Text style={trackerStyles.activeHint}>In progress…</Text>}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const trackerStyles = StyleSheet.create({
  track: { gap: 0 },
  row: { flexDirection: "row", alignItems: "flex-start", gap: 14, minHeight: 48 },
  line: { position: "absolute", left: 15, top: -24, width: 2, height: 28, backgroundColor: Colors.border, zIndex: -1 },
  lineDone: { backgroundColor: Colors.accent },
  node: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.border, alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 6 },
  nodeDone: { backgroundColor: Colors.accent },
  nodeActive: { backgroundColor: Colors.accent, shadowColor: Colors.accent, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 6, elevation: 4 },
  nodeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.inkDisabled },
  labelCol: { flex: 1, paddingTop: 8 },
  label: { fontSize: 14, color: Colors.inkDisabled, fontWeight: "500" },
  labelDone: { color: Colors.ink, fontWeight: "600" },
  labelActive: { color: Colors.accent, fontWeight: "700" },
  activeHint: { fontSize: 12, color: Colors.inkSecondary, marginTop: 2 },
  cancelledBox: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: Colors.accentLight, borderRadius: 12, padding: 14 },
  cancelledText: { fontSize: 15, fontWeight: "700", color: Colors.danger },
});

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={secStyles.card}>
      <Text style={secStyles.title}>{title}</Text>
      {children}
    </View>
  );
}
const secStyles = StyleSheet.create({
  card: { backgroundColor: Colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.border, gap: 12 },
  title: { fontSize: 11, fontWeight: "700", color: Colors.inkSecondary, textTransform: "uppercase", letterSpacing: 0.6 },
});

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: order, isLoading, error } = useQuery({
    queryKey: ["order", id],
    queryFn: () => fetchOrder(id!),
    enabled: !!id,
    refetchInterval: 30_000,
  });

  if (isLoading) return (
    <SafeAreaView style={styles.safe}>
      <ActivityIndicator style={styles.loader} size="large" color={Colors.accent} />
    </SafeAreaView>
  );

  if (error || !order) return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.errorState}>
        <Text style={styles.errorTitle}>Order not found</Text>
        <Pressable style={styles.backLink} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={16} color={Colors.accent} />
          <Text style={styles.backLinkText}>Go back</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <View style={styles.nav}>
        <Pressable style={styles.navBack} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={Colors.ink} />
        </Pressable>
        <Text style={styles.navTitle}>Order Details</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.headline}>
          <Text style={styles.restaurantName}>{order.restaurant?.name ?? "Restaurant"}</Text>
          <Text style={styles.orderDate}>{formatDate(order.created_at)}</Text>
        </View>

        <SectionCard title="Order Status">
          <StatusTracker status={order.status} />
        </SectionCard>

        <SectionCard title="Items">
          {order.items?.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <View style={styles.qtyBadge}><Text style={styles.qtyText}>{item.quantity}×</Text></View>
              <Text style={styles.itemName} numberOfLines={1}>{item.menu_item?.name ?? "Item"}</Text>
              <Text style={styles.itemPrice}>{formatPrice(item.unit_price * item.quantity)}</Text>
            </View>
          ))}
        </SectionCard>

        <SectionCard title="Payment">
          {[
            { label: "Subtotal",     value: formatPrice(order.subtotal)      },
            { label: "Delivery fee", value: formatPrice(order.delivery_fee)  },
            { label: "Tax",          value: formatPrice(order.tax)           },
          ].map(({ label, value }) => (
            <View key={label} style={styles.totalRow}>
              <Text style={styles.totalLabel}>{label}</Text>
              <Text style={styles.totalValue}>{value}</Text>
            </View>
          ))}
          <View style={styles.totalDivider} />
          <View style={styles.totalRow}>
            <Text style={styles.grandLabel}>Total</Text>
            <Text style={styles.grandValue}>{formatPrice(order.total)}</Text>
          </View>
        </SectionCard>

        <SectionCard title="Delivery Address">
          <View style={styles.addressRow}>
            <Ionicons name="location-outline" size={18} color={Colors.accent} />
            <Text style={styles.addressText}>{order.delivery_address}</Text>
          </View>
        </SectionCard>

        {order.notes && (
          <SectionCard title="Notes">
            <Text style={styles.notesText}>{order.notes}</Text>
          </SectionCard>
        )}

        {order.status === "delivered" && (
          <Pressable
            style={({ pressed }) => [styles.reorderBtn, pressed && styles.reorderBtnPressed]}
            onPress={() => router.push(`/restaurant/${order.restaurant_id}`)}
          >
            <Ionicons name="refresh" size={18} color={Colors.white} />
            <Text style={styles.reorderText}>Order Again</Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.surface },
  loader: { flex: 1 },
  nav: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border, backgroundColor: Colors.card },
  navBack: { width: 38, height: 38, borderRadius: 10, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, alignItems: "center", justifyContent: "center" },
  navTitle: { fontSize: 16, fontWeight: "700", color: Colors.ink },
  errorState: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  errorTitle: { fontSize: 18, fontWeight: "700", color: Colors.inkSecondary },
  backLink: { flexDirection: "row", alignItems: "center", gap: 6 },
  backLinkText: { fontSize: 15, color: Colors.accent, fontWeight: "600" },
  scroll: { padding: 16, gap: 12, paddingBottom: 40 },
  headline: { gap: 4 },
  restaurantName: { fontSize: 24, fontWeight: "800", color: Colors.ink, letterSpacing: -0.3 },
  orderDate: { fontSize: 13, color: Colors.inkSecondary },
  itemRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  qtyBadge: { width: 32, height: 32, borderRadius: 8, backgroundColor: Colors.accentLight, alignItems: "center", justifyContent: "center" },
  qtyText: { fontSize: 13, fontWeight: "700", color: Colors.accent },
  itemName: { flex: 1, fontSize: 14, fontWeight: "500", color: Colors.ink },
  itemPrice: { fontSize: 14, fontWeight: "600", color: Colors.ink },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  totalLabel: { fontSize: 14, color: Colors.inkSecondary },
  totalValue: { fontSize: 14, color: Colors.ink },
  totalDivider: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.border, marginVertical: 4 },
  grandLabel: { fontSize: 16, fontWeight: "800", color: Colors.ink },
  grandValue: { fontSize: 16, fontWeight: "800", color: Colors.accent },
  addressRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  addressText: { flex: 1, fontSize: 14, color: Colors.ink, lineHeight: 20 },
  notesText: { fontSize: 14, color: Colors.inkSecondary, lineHeight: 20, fontStyle: "italic" },
  reorderBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", height: 54, backgroundColor: Colors.accent, borderRadius: 14, gap: 8, shadowColor: Colors.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.28, shadowRadius: 8, elevation: 4 },
  reorderBtnPressed: { backgroundColor: Colors.accentDark },
  reorderText: { fontSize: 16, fontWeight: "700", color: Colors.white },
});
