import { StyleSheet, Text, View } from "react-native";
import { LegacyColors } from "@/constants/colors";
export default function PostTabScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Post</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: LegacyColors.surface, alignItems: "center", justifyContent: "center" },
  text: { fontSize: 20, fontWeight: "700", color: LegacyColors.inkSecondary },
});
