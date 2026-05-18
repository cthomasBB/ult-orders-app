import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/services/supabase";
import { useOrdersStore } from "@/features/orders/store";
import { Colors } from "@/constants/colors";
import type { Restaurant } from "@/types";

async function fetchRestaurants(q: string): Promise<Restaurant[]> {
  let query = supabase.from("restaurants").select("*").eq("status", "open");
  if (q) query = query.ilike("name", `%${q}%`);
  const { data } = await query.order("average_rating", { ascending: false }).limit(30);
  return data ?? [];
}

function StepHeader({ step, total, title, onClose }: { step: number; total: number; title: string; onClose: () => void }) {
  const pct = `${Math.round((step / total) * 100)}%`;
  return (
    <View style={hdrStyles.wrap}>
      <View style={hdrStyles.top}>
        <Text style={hdrStyles.stepLabel}>Step {step} of {total}</Text>
        <Pressable onPress={onClose} hitSlop={10}><Ionicons name="close" size={22} color={Colors.ink} /></Pressable>
      </View>
      <Text style={hdrStyles.title}>{title}</Text>
      <View style={hdrStyles.track}><View style={[hdrStyles.fill, { width: pct }]} /></View>
    </View>
  );
}
const hdrStyles = StyleSheet.create({
  wrap: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, gap: 6 },
  top: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  stepLabel: { fontSize: 12, fontWeight: "700", color: Colors.accent, textTransform: "uppercase", letterSpacing: 0.6 },
  title: { fontSize: 22, fontWeight: "800", color: Colors.ink, letterSpacing: -0.3 },
  track: { height: 4, backgroundColor: Colors.border, borderRadius: 2, overflow: "hidden" },
  fill: { height: 4, backgroundColor: Colors.accent, borderRadius: 2 },
});

export default function Step1RestaurantScreen() {
  const router = useRouter();
  const { setDraftRestaurant, setDraftStep } = useOrdersStore();
  const [query, setQuery] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["restaurants-pick", query],
    queryFn: () => fetchRestaurants(query),
  });

  const handleSelect = (r: Restaurant) => {
    setDraftRestaurant(r.id);
    setDraftStep(2);
    router.push("/create/step-2-items");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StepHeader step={1} total={5} title="Pick a Restaurant" onClose={() => router.back()} />
      <View style={styles.searchBar}>
        <Ionicons name="search" size={16} color={Colors.inkSecondary} />
        <TextInput style={styles.searchInput} value={query} onChangeText={setQuery} placeholder="Search restaurants…" placeholderTextColor={Colors.inkDisabled} />
        {query.length > 0 && <Pressable onPress={() => setQuery("")}><Ionicons name="close-circle" size={16} color={Colors.inkDisabled} /></Pressable>}
      </View>
      {isLoading ? <ActivityIndicator color={Colors.accent} style={{ marginTop: 40 }} /> : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable style={({ pressed }) => [styles.row, pressed && styles.rowPressed]} onPress={() => handleSelect(item)}>
              <View style={styles.thumb}><Text style={{ fontSize: 22 }}>🍽️</Text></View>
              <View style={styles.rowBody}>
                <Text style={styles.rowName}>{item.name}</Text>
                <Text style={styles.rowMeta}>{item.cuisine_type.join(", ")} · ⭐ {item.average_rating.toFixed(1)}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.inkDisabled} />
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.surface },
  searchBar: { flexDirection: "row", alignItems: "center", gap: 10, marginHorizontal: 16, marginBottom: 8, paddingHorizontal: 14, height: 46, borderRadius: 12, backgroundColor: Colors.card, borderWidth: 1.5, borderColor: Colors.border },
  searchInput: { flex: 1, fontSize: 15, color: Colors.ink },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border, gap: 12 },
  rowPressed: { backgroundColor: Colors.surface },
  thumb: { width: 48, height: 48, borderRadius: 12, backgroundColor: Colors.accentLight, alignItems: "center", justifyContent: "center" },
  rowBody: { flex: 1 },
  rowName: { fontSize: 15, fontWeight: "600", color: Colors.ink },
  rowMeta: { fontSize: 13, color: Colors.inkSecondary, marginTop: 2 },
});
