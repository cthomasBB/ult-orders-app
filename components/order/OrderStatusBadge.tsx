import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import type { OrderStatus } from "@/types";

const META: Record<OrderStatus, { label: string; color: string; bg: string; icon: string }> = {
  pending:   { label: "Order Placed",  color: "#F57C00",        bg: "#FFF8E1",             icon: "time-outline"                },
  confirmed: { label: "Confirmed",     color: "#1565C0",        bg: "#E3F2FD",             icon: "checkmark-circle-outline"    },
  preparing: { label: "Preparing",     color: "#6A1B9A",        bg: "#F3E5F5",             icon: "restaurant-outline"          },
  ready:     { label: "Ready",         color: Colors.saveGreen, bg: Colors.saveGreenLight, icon: "bag-handle-outline"          },
  picked_up: { label: "Picked Up",     color: "#00695C",        bg: "#E0F2F1",             icon: "bicycle-outline"             },
  delivered: { label: "Delivered",     color: Colors.saveGreen, bg: Colors.saveGreenLight, icon: "checkmark-done-circle-outline"},
  cancelled: { label: "Cancelled",     color: Colors.danger,    bg: Colors.accentLight,    icon: "close-circle-outline"        },
};

type Props = { status: OrderStatus; size?: "sm" | "md" };

export function OrderStatusBadge({ status, size = "md" }: Props) {
  const { label, color, bg, icon } = META[status];
  const sm = size === "sm";
  return (
    <View style={[styles.badge, { backgroundColor: bg }, sm && styles.sm]}>
      {!sm && <Ionicons name={icon as any} size={14} color={color} />}
      <Text style={[styles.label, { color }, sm && styles.labelSm]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, gap: 5, alignSelf: "flex-start" },
  sm:    { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 10 },
  label: { fontSize: 13, fontWeight: "700" },
  labelSm: { fontSize: 11 },
});
