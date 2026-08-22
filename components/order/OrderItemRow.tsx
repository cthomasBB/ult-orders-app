import { StyleSheet, Text, View } from "react-native";
import { LegacyColors } from "@/constants/colors";
import { formatPrice } from "@/utils";
import type { OrderItem } from "@/types";

export function OrderItemRow({ item }: { item: OrderItem }) {
  return (
    <View style={styles.row}>
      <View style={styles.qty}>
        <Text style={styles.qtyText}>{item.quantity}×</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{item.menu_item?.name ?? "Item"}</Text>
        {item.notes && <Text style={styles.notes}>{item.notes}</Text>}
      </View>
      <Text style={styles.price}>{formatPrice(item.unit_price * item.quantity)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6 },
  qty: { width: 32, height: 32, borderRadius: 8, backgroundColor: LegacyColors.accentLight, alignItems: "center", justifyContent: "center" },
  qtyText: { fontSize: 13, fontWeight: "700", color: LegacyColors.accent },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: "600", color: LegacyColors.ink },
  notes: { fontSize: 12, color: LegacyColors.inkDisabled, marginTop: 2, fontStyle: "italic" },
  price: { fontSize: 14, fontWeight: "600", color: LegacyColors.ink },
});
