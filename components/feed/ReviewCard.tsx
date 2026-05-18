import { StyleSheet, Text, View } from "react-native";
import { timeAgo } from "@/utils";
import type { Review } from "@/types";

type Props = { review: Review };

export function ReviewCard({ review }: Props) {
  const stars = "⭐".repeat(Math.round(review.rating));
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {review.customer?.full_name?.charAt(0)?.toUpperCase() ?? "?"}
          </Text>
        </View>
        <View style={styles.meta}>
          <Text style={styles.name}>{review.customer?.full_name ?? "Anonymous"}</Text>
          <Text style={styles.time}>{timeAgo(review.created_at)}</Text>
        </View>
        <Text style={styles.stars}>{stars}</Text>
      </View>
      {review.comment && <Text style={styles.comment}>{review.comment}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FAFAFA",
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  header: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: Colors.white, fontWeight: "700", fontSize: 15 },
  meta: { flex: 1 },
  name: { fontSize: 14, fontWeight: "600", color: Colors.ink },
  time: { fontSize: 12, color: Colors.inkDisabled, marginTop: 1 },
  stars: { fontSize: 13 },
  comment: { fontSize: 14, color: Colors.inkSecondary, lineHeight: 20 },
});
