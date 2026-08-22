import { StyleSheet, Text, View } from "react-native";
import { LegacyColors } from "@/constants/colors";

type Stat = { label: string; value: string | number };
type Props = { stats: Stat[] };

export function ProfileStats({ stats }: Props) {
  return (
    <View style={styles.row}>
      {stats.map((stat, idx) => (
        <View
          key={stat.label}
          style={[styles.stat, idx < stats.length - 1 && styles.sep]}
        >
          <Text style={styles.value}>{stat.value}</Text>
          <Text style={styles.label}>{stat.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", backgroundColor: LegacyColors.accentLight, borderRadius: 16, padding: 16 },
  stat: { flex: 1, alignItems: "center" },
  sep: { borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: LegacyColors.accent },
  value: { fontSize: 22, fontWeight: "800", color: LegacyColors.ink },
  label: { fontSize: 12, color: LegacyColors.inkSecondary, marginTop: 2 },
});
