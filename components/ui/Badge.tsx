import { StyleSheet, Text, View } from "react-native";
import { Colors } from "@/constants/colors";

export type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "accent";

const META: Record<BadgeVariant, { bg: string; text: string }> = {
  default: { bg: Colors.surface,          text: Colors.inkSecondary },
  success: { bg: Colors.saveGreenLight,   text: Colors.saveGreen    },
  warning: { bg: "#FFF8E1",               text: "#F57C00"           },
  danger:  { bg: Colors.accentLight,      text: Colors.danger       },
  info:    { bg: "#E3F2FD",               text: "#1565C0"           },
  accent:  { bg: Colors.accentLight,      text: Colors.accent       },
};

type Props = {
  label: string;
  variant?: BadgeVariant;
  size?: "sm" | "md";
};

export function Badge({ label, variant = "default", size = "md" }: Props) {
  const { bg, text } = META[variant];
  return (
    <View style={[styles.badge, { backgroundColor: bg }, size === "sm" && styles.sm]}>
      <Text style={[styles.text, { color: text }, size === "sm" && styles.textSm]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, alignSelf: "flex-start" },
  sm:    { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 },
  text:  { fontSize: 13, fontWeight: "600" },
  textSm:{ fontSize: 11 },
});
