import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/services/supabase";
import { useAuthStore } from "@/features/auth/authStore";
import { useOrdersStore } from "@/features/orders/store";
import { Colors } from "@/constants/colors";
import { formatPrice } from "@/utils";
import type { Order } from "@/types";

const DELIVERY_FEE = 299;
const TAX_RATE = 0.08875;

export default function Step5ConfirmScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { draft, resetDraft, upsertOrder } = useOrdersStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);

  const subtotal = 0; // computed server-side via trigger
  const tax = Math.round(subtotal * TAX_RATE);
  const total = subtotal + DELIVERY_FEE + tax;

  const handleConfirm = async () => {
    if (!user || !draft.restaurant_id || !draft.items.length) return;
    setIsLoading(true); setError(null);
    try {
      const { data: order, error: oErr } = await supabase
        .from("orders")
        .insert({ customer_id: user.id, restaurant_id: draft.restaurant_id, status: "pending", delivery_address: draft.delivery_address, delivery_latitude: draft.delivery_latitude, delivery_longitude: draft.delivery_longitude, notes: draft.notes, subtotal, delivery_fee: DELIVERY_FEE, tax, total })
        .select().single();
      if (oErr) throw oErr;
      const { error: iErr } = await supabase.from("order_items").insert(
        draft.items.map((i) => ({ order_id: order.id, menu_item_id: i.menu_item_id, quantity: i.quantity, notes: i.notes ?? null, unit_price: 0 }))
      );
      if (iErr) throw iErr;
      upsertOrder(order as Order);
      setCreatedOrder(order as Order);
      resetDraft();
    } catch (e: any) {
      setError(e.message ?? "Failed to place order. Please try again.");
    } finally { setIsLoading(false); }
  };

  // ── Success state ──────────────────────────────────────────────────────────
  if (createdOrder) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}><Ionicons name="checkmark" size={56} color={Colors.white} /></View>
          <Text style={styles.successTitle}>Order Placed! 🎉</Text>
          <Text style={styles.successSubtitle}>
            Your order is being processed. We'll notify you when it's ready.
          </Text>
          <Pressable style={({ pressed }) => [styles.trackBtn, pressed && styles.trackBtnPressed]}
            onPress={() => { router.dismissAll(); router.push(`/order/${createdOrder.id}`); }}>
            <Ionicons name="navigate-outline" size={18} color={Colors.white} />
            <Text style={styles.trackBtnText}>Track Order</Text>
          </Pressable>
          <Pressable style={styles.homeBtn}
            onPress={() => { router.dismissAll(); router.replace("/(tabs)/"); }}>
            <Text style={styles.homeBtnText}>Back to Home</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ── Confirm state ──────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} disabled={isLoading} hitSlop={10}><Ionicons name="arrow-back" size={22} color={Colors.ink} /></Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.stepLabel}>Step 5 of 5</Text>
          <Text style={styles.title}>Confirm & Pay</Text>
        </View>
        <View style={{ width: 22 }} />
      </View>
      <View style={styles.progressTrack}><View style={[styles.progressFill, { width: "100%" }]} /></View>

      <View style={styles.content}>
        {error && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={16} color={Colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Payment placeholder */}
        <View style={styles.paymentCard}>
          <View style={styles.paymentIconWrap}><Ionicons name="card" size={22} color={Colors.inkSecondary} /></View>
          <View style={styles.paymentInfo}>
            <Text style={styles.paymentLabel}>Payment Method</Text>
            <Text style={styles.paymentValue}>•••• •••• •••• 4242</Text>
          </View>
          <Pressable><Text style={styles.changeText}>Change</Text></Pressable>
        </View>

        {/* Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{draft.items.reduce((s, i) => s + i.quantity, 0)} items</Text>
            <Text style={styles.summaryValue}>—</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery fee</Text>
            <Text style={styles.summaryValue}>{formatPrice(DELIVERY_FEE)}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryGrandLabel}>Total (est.)</Text>
            <Text style={styles.summaryGrandValue}>—</Text>
          </View>
        </View>

        <Text style={styles.disclaimer}>
          By placing your order you agree to our Terms of Service. Final total is calculated based on item prices at time of order.
        </Text>
      </View>

      <View style={styles.footer}>
        <Pressable style={[styles.confirmBtn, isLoading && styles.confirmBtnDisabled]} onPress={handleConfirm} disabled={isLoading}>
          {isLoading ? <ActivityIndicator color={Colors.white} /> : (
            <><Ionicons name="checkmark-circle" size={20} color={Colors.white} /><Text style={styles.confirmBtnText}>Place Order</Text></>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.surface },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14, gap: 12 },
  headerCenter: { flex: 1 },
  stepLabel: { fontSize: 12, fontWeight: "700", color: Colors.accent, textTransform: "uppercase", letterSpacing: 0.6 },
  title: { fontSize: 20, fontWeight: "800", color: Colors.ink },
  progressTrack: { height: 4, backgroundColor: Colors.border, marginHorizontal: 20, borderRadius: 2, marginBottom: 24, overflow: "hidden" },
  progressFill: { height: 4, backgroundColor: Colors.accent, borderRadius: 2 },
  content: { flex: 1, paddingHorizontal: 16, gap: 14 },
  errorBanner: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: Colors.accentLight, borderRadius: 10, padding: 12 },
  errorText: { flex: 1, fontSize: 13, color: Colors.danger },
  paymentCard: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: Colors.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: Colors.border },
  paymentIconWrap: { width: 40, height: 40, borderRadius: 10, backgroundColor: Colors.surface, alignItems: "center", justifyContent: "center" },
  paymentInfo: { flex: 1 },
  paymentLabel: { fontSize: 12, color: Colors.inkSecondary },
  paymentValue: { fontSize: 15, fontWeight: "600", color: Colors.ink, marginTop: 2 },
  changeText: { fontSize: 13, color: Colors.accent, fontWeight: "600" },
  summaryCard: { backgroundColor: Colors.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: Colors.border, gap: 10 },
  summaryTitle: { fontSize: 11, fontWeight: "700", color: Colors.inkSecondary, textTransform: "uppercase", letterSpacing: 0.6 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between" },
  summaryLabel: { fontSize: 14, color: Colors.inkSecondary },
  summaryValue: { fontSize: 14, color: Colors.ink },
  summaryDivider: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.border },
  summaryGrandLabel: { fontSize: 16, fontWeight: "800", color: Colors.ink },
  summaryGrandValue: { fontSize: 16, fontWeight: "800", color: Colors.accent },
  disclaimer: { fontSize: 12, color: Colors.inkDisabled, lineHeight: 18, textAlign: "center" },
  footer: { padding: 16, paddingBottom: 32, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.border, backgroundColor: Colors.card },
  confirmBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", height: 56, backgroundColor: Colors.accent, borderRadius: 14, gap: 10, shadowColor: Colors.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  confirmBtnDisabled: { opacity: 0.6 },
  confirmBtnText: { fontSize: 17, fontWeight: "800", color: Colors.white },
  // Success
  successContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 14 },
  successIcon: { width: 96, height: 96, borderRadius: 48, backgroundColor: Colors.accent, alignItems: "center", justifyContent: "center", shadowColor: Colors.accent, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8, marginBottom: 8 },
  successTitle: { fontSize: 28, fontWeight: "800", color: Colors.ink },
  successSubtitle: { fontSize: 15, color: Colors.inkSecondary, textAlign: "center", lineHeight: 22 },
  trackBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", width: "100%", height: 54, backgroundColor: Colors.accent, borderRadius: 14, gap: 8, marginTop: 8 },
  trackBtnPressed: { backgroundColor: Colors.accentDark },
  trackBtnText: { color: Colors.white, fontSize: 16, fontWeight: "700" },
  homeBtn: { width: "100%", height: 50, borderRadius: 14, borderWidth: 1.5, borderColor: Colors.border, alignItems: "center", justifyContent: "center" },
  homeBtnText: { fontSize: 15, fontWeight: "600", color: Colors.inkSecondary },
});
