import { Pressable, StyleSheet, Text, View } from "react-native";
import { Colors } from "@/constants/colors";

type Props = {
  emoji?: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ emoji = "📭", title, subtitle, actionLabel, onAction }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      {actionLabel && onAction && (
        <Pressable
          style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
          onPress={onAction}
        >
          <Text style={styles.btnText}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", paddingVertical: 60, paddingHorizontal: 32, gap: 10 },
  emoji:    { fontSize: 52 },
  title:    { fontSize: 20, fontWeight: "800", color: Colors.ink, textAlign: "center" },
  subtitle: { fontSize: 14, color: Colors.inkSecondary, textAlign: "center", lineHeight: 20 },
  btn:        { marginTop: 8, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: Colors.accent, borderRadius: 12 },
  btnPressed: { backgroundColor: Colors.accentDark },
  btnText:  { color: Colors.white, fontWeight: "700", fontSize: 15 },
});
