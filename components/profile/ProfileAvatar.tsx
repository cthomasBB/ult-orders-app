import { StyleSheet, Text, View } from "react-native";
import { LegacyColors } from "@/constants/colors";
import type { PublicUser } from "@/services/supabase";

type Props = { user: PublicUser; size?: number };

export function ProfileAvatar({ user, size = 64 }: Props) {
  const initial = (user.display_name ?? user.username ?? "?")
    .charAt(0)
    .toUpperCase();
  const radius = size / 2;
  const fontSize = size * 0.38;
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: radius }]}>
      <Text style={[styles.initial, { fontSize }]}>{initial}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: { backgroundColor: LegacyColors.accent, alignItems: "center", justifyContent: "center" },
  initial: { color: LegacyColors.white, fontWeight: "800" },
});
