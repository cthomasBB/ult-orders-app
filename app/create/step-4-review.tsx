import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/services/supabase";
import { useOrdersStore } from "@/features/orders/store";
import { Colors } from "@/constants/colors";
import { formatPrice } from "@/utils";
import type { MenuItem, Restaurant } from "@/types";

const DELIVERY_FEE = 299;
const TAX_RATE = 0.08875;

export default function Step4ReviewScreen() {
  const router = useRouter();
  const { draft, setDraftNotes, setDraftStep } = useOrdersStore();

  const { data: restaurant } = useQuery<Restaurant>({
    queryKey: ["restaurant-pick", draft.restaurant_id],
    queryFn: async () => { const { data } = await supabase.from("restaurants").select("*").eq("id", draft.restaurant_id!).single(); return data as Restaurant; },
    enabled: !!draft.restaurant_id,
  });
  const { data: menuItems } = useQuery<MenuItem[]>({
    queryKey: ["menu-items-review", draft.restaurant_id],
    queryFn: async () => { const { data } = await supabase.from("menu_items").select("*").eq("restaurant_id", draft.restaurant_id!); return data ?? []; },
    enabled: !!draft.restaurant_id,
  });

  const getItem = (id: string) => menuItems?.find((m) => m.id === id);
  const subtotal = draft.items.reduce((sum, i) => sum + ((getItem(i.menu_item_id)?.price ?? 0) * i.quantity), 0);
  const tax = Math.round(subtotal * TAX_RATE);
  const total = subtotal + DELIVERY_FEE + tax;

  const handleNext = () => { setDraftStep(5); router.push("/create/step-5-confirm"); };

  function Row({ label, children }: { label: string; children: React.ReactNode }) {
    return (
      <View style={secStyles.row}>
        <Text style={secStyles.label}>{label}</Text>
        {children}
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}><Ionicons name="arrow-back" size={22} color={Colors.ink} /></Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.stepLabel}>Step 4 of 5</Text>
          <Text style={styles.title}>Review Order</Text>
        </View>
        <View style={{ width: 22 }} />
      </View>
      <View style={styles.progressTrack}><View style={[styles.progressFill, { width: "80%" }]} /></View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Restaurant */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>From</Text>
          <Text style={styles.restaurantName}>{restaurant?.name ?? "—"}</Text>
        </View>

        {/* Items */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Items</Text>
          {draft.items.map((di) => {
            const item = getItem(di.menu_item_id);
            if (!item) return null;
            return (
              <View key={di.menu_item_id} style={secStyles.itemRow}>
                <View style={secStyles.qtyBadge}><Text style={secStyles.qtyText}>{di.quantity}×</Text></View>
                <Text style={secStyles.itemName} numberOfLines={1}>{item.name}</Text>
                <Text style={secStyles.itemPrice}>{formatPrice(item.price * di.quantity)}</Text>
              </View>
            );
          })}
          <Pressable onPress={() => router.push("/create/step-2-items")}><Text style={secStyles.editLink}>Edit items</Text></Pressable>
        </View>

        {/* Delivery */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Delivering to</Text>
          <Text style={secStyles.address}>{draft.delivery_address}</Text>
          <Pressable onPress={() => router.push("/create/step-3-delivery")}><Text style={secStyles.editLink}>Change address</Text></Pressable>
        </View>

        {/* Notes */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Special instructions (optional)</Text>
          <TextInput style={secStyles.notes} value={draft.notes ?? ""} onChangeText={setDraftNotes} placeholder="Allergy info, gate codes…" placeholderTextColor={Colors.inkDisabled} multiline numberOfLines={3} />
        </View>

        {/* Totals */}
        <View style={styles.card}>
          {[
            { l: "Subtotal",     v: formatPrice(subtotal)      },
            { l: "Delivery fee", v: formatPrice(DELIVERY_FEE)  },
            { l: "Tax",          v: formatPrice(tax)           },
          ].map(({ l, v }) => (
            <View key={l} style={secStyles.totalRow}>
              <Text style={secStyles.totalLabel}>{l}</Text>
              <Text style={secStyles.totalValue}>{v}</Text>
            </View>
          ))}
          <View style={secStyles.divider} />
          <View style={secStyles.totalRow}>
            <Text style={secStyles.grandLabel}>Total</Text>
            <Text style={secStyles.grandValue}>{formatPrice(total)}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={styles.nextBtn} onPress={handleNext}>
          <Text style={styles.nextBtnText}>Place Order · {formatPrice(total)}</Text>
          <Ionicons name="arrow-forward" size={18} color={Colors.white} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

import React from "react";

const secStyles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  label: { fontSize: 14, color: Colors.inkSecondary },
  itemRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  qtyBadge: { width: 28, height: 28, borderRadius: 7, backgroundColor: Colors.accentLight, alignItems: "center", justifyContent: "center" },
  qtyText: { fontSize: 12, fontWeight: "700", color: Colors.accent },
  itemName: { flex: 1, fontSize: 14, color: Colors.ink },
  itemPrice: { fontSize: 14, fontWeight: "600", color: Colors.ink },
  editLink: { fontSize: 13, color: Colors.accent, fontWeight: "600", marginTop: 4 },
  address: { fontSize: 14, color: Colors.ink, lineHeight: 20 },
  notes: { borderWidth: 1.5, borderColor: Colors.border, borderRadius: 10, padding: 10, fontSize: 14, color: Colors.ink, minHeight: 72, textAlignVertical: "top", backgroundColor: Colors.surface },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  totalLabel: { fontSize: 14, color: Colors.inkSecondary },
  totalValue: { fontSize: 14, color: Colors.ink },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.border, marginVertical: 6 },
  grandLabel: { fontSize: 16, fontWeight: "800", color: Colors.ink },
  grandValue: { fontSize: 16, fontWeight: "800", color: Colors.accent },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.surface },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14, gap: 12 },
  headerCenter: { flex: 1 },
  stepLabel: { fontSize: 12, fontWeight: "700", color: Colors.accent, textTransform: "uppercase", letterSpacing: 0.6 },
  title: { fontSize: 20, fontWeight: "800", color: Colors.ink },
  progressTrack: { height: 4, backgroundColor: Colors.border, marginHorizontal: 20, borderRadius: 2, marginBottom: 8, overflow: "hidden" },
  progressFill: { height: 4, backgroundColor: Colors.accent, borderRadius: 2 },
  scroll: { padding: 16, gap: 12, paddingBottom: 120 },
  card: { backgroundColor: Colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.border, gap: 10 },
  cardLabel: { fontSize: 11, fontWeight: "700", color: Colors.inkSecondary, textTransform: "uppercase", letterSpacing: 0.6 },
  restaurantName: { fontSize: 16, fontWeight: "700", color: Colors.ink },
  footer: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 16, paddingBottom: 32, backgroundColor: Colors.card, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.border },
  nextBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", height: 54, backgroundColor: Colors.accent, borderRadius: 14, gap: 8, shadowColor: Colors.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.28, shadowRadius: 8, elevation: 4 },
  nextBtnText: { color: Colors.white, fontSize: 16, fontWeight: "700" },
});
