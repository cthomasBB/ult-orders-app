import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/services/supabase";
import { useOrdersStore } from "@/features/orders/store";
import { Colors } from "@/constants/colors";
import { formatPrice } from "@/utils";
import type { MenuItem } from "@/types";

async function fetchMenuItems(restaurantId: string): Promise<MenuItem[]> {
  const { data } = await supabase.from("menu_items").select("*").eq("restaurant_id", restaurantId).eq("is_available", true).order("sort_order");
  return data ?? [];
}

export default function Step2ItemsScreen() {
  const router = useRouter();
  const { draft, addDraftItem, updateDraftItemQty, setDraftStep } = useOrdersStore();
  const { data: items, isLoading } = useQuery({ queryKey: ["menu-items", draft.restaurant_id], queryFn: () => fetchMenuItems(draft.restaurant_id!), enabled: !!draft.restaurant_id });
  const totalCount = draft.items.reduce((s, i) => s + i.quantity, 0);

  const handleNext = () => { if (!totalCount) return; setDraftStep(3); router.push("/create/step-3-delivery"); };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}><Ionicons name="arrow-back" size={22} color={Colors.ink} /></Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.stepLabel}>Step 2 of 5</Text>
          <Text style={styles.title}>Choose Items</Text>
        </View>
        <View style={{ width: 22 }} />
      </View>
      <View style={styles.progressTrack}><View style={[styles.progressFill, { width: "40%" }]} /></View>

      {isLoading ? <ActivityIndicator color={Colors.accent} style={{ marginTop: 40 }} /> : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const qty = draft.items.find((i) => i.menu_item_id === item.id)?.quantity ?? 0;
            return (
              <View style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  {item.description && <Text style={styles.itemDesc} numberOfLines={1}>{item.description}</Text>}
                  <Text style={styles.itemPrice}>{formatPrice(item.price)}</Text>
                </View>
                {qty > 0 ? (
                  <View style={styles.qtyRow}>
                    <Pressable style={styles.qtyBtn} onPress={() => updateDraftItemQty(item.id, qty - 1)} hitSlop={8}><Ionicons name="remove" size={14} color={Colors.accent} /></Pressable>
                    <Text style={styles.qty}>{qty}</Text>
                    <Pressable style={styles.qtyBtn} onPress={() => addDraftItem(item.id)} hitSlop={8}><Ionicons name="add" size={14} color={Colors.accent} /></Pressable>
                  </View>
                ) : (
                  <Pressable style={styles.addBtn} onPress={() => addDraftItem(item.id)}><Ionicons name="add" size={20} color={Colors.white} /></Pressable>
                )}
              </View>
            );
          }}
        />
      )}

      <View style={styles.footer}>
        <Pressable style={[styles.nextBtn, !totalCount && styles.nextBtnDisabled]} onPress={handleNext} disabled={!totalCount}>
          <Text style={styles.nextBtnText}>{totalCount > 0 ? `Next · ${totalCount} item${totalCount > 1 ? "s" : ""}` : "Add items to continue"}</Text>
          {totalCount > 0 && <Ionicons name="arrow-forward" size={18} color={Colors.white} />}
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
  progressTrack: { height: 4, backgroundColor: Colors.border, marginHorizontal: 20, borderRadius: 2, marginBottom: 8, overflow: "hidden" },
  progressFill: { height: 4, backgroundColor: Colors.accent, borderRadius: 2 },
  list: { paddingHorizontal: 16, paddingBottom: 120 },
  itemRow: { flexDirection: "row", alignItems: "center", paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border, gap: 12 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: "600", color: Colors.ink },
  itemDesc: { fontSize: 13, color: Colors.inkSecondary, marginTop: 2 },
  itemPrice: { fontSize: 14, fontWeight: "700", color: Colors.accent, marginTop: 4 },
  qtyRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  qtyBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.accentLight, alignItems: "center", justifyContent: "center" },
  qty: { fontSize: 16, fontWeight: "800", color: Colors.ink, minWidth: 20, textAlign: "center" },
  addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.accent, alignItems: "center", justifyContent: "center" },
  footer: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 16, paddingBottom: 32, backgroundColor: Colors.card, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.border },
  nextBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", height: 54, backgroundColor: Colors.accent, borderRadius: 14, gap: 8, shadowColor: Colors.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.28, shadowRadius: 8, elevation: 4 },
  nextBtnDisabled: { backgroundColor: Colors.inkDisabled, shadowOpacity: 0, elevation: 0 },
  nextBtnText: { color: Colors.white, fontSize: 16, fontWeight: "700" },
});
