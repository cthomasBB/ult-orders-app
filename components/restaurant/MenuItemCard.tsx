import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { useOrdersStore } from "@/features/orders/store";
import { formatPrice } from "@/utils";
import type { MenuItem } from "@/types";

type Props = { item: MenuItem; restaurantId: string };

export function MenuItemCard({ item, restaurantId }: Props) {
  const { draft, addDraftItem, updateDraftItemQty, setDraftRestaurant } = useOrdersStore();
  const qty = draft.items.find((i) => i.menu_item_id === item.id)?.quantity ?? 0;

  const handleAdd = () => {
    if (draft.restaurant_id && draft.restaurant_id !== restaurantId) {
      setDraftRestaurant(restaurantId);
    }
    addDraftItem(item.id);
  };

  return (
    <View style={styles.card}>
      <View style={styles.info}>
        {item.is_featured && <Text style={styles.featured}>★ Popular</Text>}
        <Text style={styles.name}>{item.name}</Text>
        {item.description && <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>}
        {item.dietary_tags.length > 0 && (
          <View style={styles.tags}>
            {item.dietary_tags.slice(0, 3).map((t) => (
              <View key={t} style={styles.tag}><Text style={styles.tagText}>{t}</Text></View>
            ))}
          </View>
        )}
        <Text style={styles.price}>{formatPrice(item.price)}</Text>
      </View>
      <View style={styles.right}>
        <View style={styles.thumb}><Text style={{ fontSize: 28 }}>🍽️</Text></View>
        {qty > 0 ? (
          <View style={styles.qtyRow}>
            <Pressable style={styles.qtyBtn} onPress={() => updateDraftItemQty(item.id, qty - 1)} hitSlop={8}>
              <Ionicons name="remove" size={14} color={Colors.accent} />
            </Pressable>
            <Text style={styles.qty}>{qty}</Text>
            <Pressable style={styles.qtyBtn} onPress={handleAdd} hitSlop={8}>
              <Ionicons name="add" size={14} color={Colors.accent} />
            </Pressable>
          </View>
        ) : (
          <Pressable style={styles.addBtn} onPress={handleAdd} disabled={!item.is_available}>
            <Ionicons name="add" size={18} color={Colors.white} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", padding: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border, backgroundColor: Colors.card, gap: 12 },
  info: { flex: 1, gap: 4 },
  featured: { fontSize: 11, fontWeight: "700", color: Colors.accent, textTransform: "uppercase", letterSpacing: 0.4 },
  name: { fontSize: 15, fontWeight: "700", color: Colors.ink },
  desc: { fontSize: 13, color: Colors.inkSecondary, lineHeight: 18 },
  tags: { flexDirection: "row", gap: 4, flexWrap: "wrap" },
  tag: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  tagText: { fontSize: 11, color: Colors.inkSecondary },
  price: { fontSize: 15, fontWeight: "700", color: Colors.accent, marginTop: 2 },
  right: { alignItems: "center", gap: 8, justifyContent: "space-between" },
  thumb: { width: 76, height: 76, borderRadius: 12, backgroundColor: Colors.accentLight, alignItems: "center", justifyContent: "center" },
  addBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.accent, alignItems: "center", justifyContent: "center" },
  qtyRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  qtyBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.accentLight, alignItems: "center", justifyContent: "center" },
  qty: { fontSize: 15, fontWeight: "800", color: Colors.ink, minWidth: 18, textAlign: "center" },
});
