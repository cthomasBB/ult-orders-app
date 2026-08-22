import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/services/supabase";
import { searchPlaces, getPlaceDetails } from "@/services/places";
import { useAuthStore } from "@/features/auth/authStore";
import { useCreateOrderStore } from "@/features/orders/createOrderStore";
import { LegacyColors } from "@/constants/colors";

type RecentRestaurant = { id: string; name: string; address: string };
type DraftRestaurantLocal = {
  placeId: string | null;
  name: string;
  address: string;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
};

async function fetchRecentRestaurants(userId: string): Promise<RecentRestaurant[]> {
  const { data } = await supabase
    .from("orders")
    .select("restaurant:restaurants(id, name, address)")
    .eq("customer_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);
  if (!data) return [];
  const seen = new Set<string>();
  const unique: RecentRestaurant[] = [];
  for (const row of data) {
    const r = row.restaurant as any;
    if (r && !seen.has(r.id)) { seen.add(r.id); unique.push(r); if (unique.length >= 5) break; }
  }
  return unique;
}

function ManualEntrySheet({ onConfirm, onCancel }: { onConfirm: (r: DraftRestaurantLocal) => void; onCancel: () => void }) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const nameRef = useRef<TextInput>(null);
  useEffect(() => { const t = setTimeout(() => nameRef.current?.focus(), 100); return () => clearTimeout(t); }, []);
  const handleConfirm = () => {
    if (!name.trim()) { Alert.alert("Required", "Please enter a restaurant name."); return; }
    onConfirm({ placeId: null, name: name.trim(), address: address.trim() || "Address not specified", city: null, latitude: null, longitude: null });
  };
  return (
    <View style={ms.sheet}>
      <View style={ms.handle} />
      <Text style={ms.title}>Add Restaurant Manually</Text>
      <Text style={ms.sub}>Can't find it? Enter the details yourself.</Text>
      <View style={ms.fields}>
        <View style={ms.field}>
          <Text style={ms.label}>Restaurant name *</Text>
          <TextInput ref={nameRef} style={ms.input} value={name} onChangeText={setName} placeholder="e.g. Joe's Pizza" placeholderTextColor={LegacyColors.inkDisabled} returnKeyType="next" />
        </View>
        <View style={ms.field}>
          <Text style={ms.label}>Address (optional)</Text>
          <TextInput style={ms.input} value={address} onChangeText={setAddress} placeholder="e.g. 7 Carmine St, New York" placeholderTextColor={LegacyColors.inkDisabled} returnKeyType="done" onSubmitEditing={handleConfirm} />
        </View>
      </View>
      <View style={ms.actions}>
        <Pressable style={ms.cancelBtn} onPress={onCancel}><Text style={ms.cancelText}>Cancel</Text></Pressable>
        <Pressable style={ms.confirmBtn} onPress={handleConfirm}><Text style={ms.confirmText}>Add Restaurant</Text></Pressable>
      </View>
    </View>
  );
}
const ms = StyleSheet.create({
  sheet: { backgroundColor: LegacyColors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 32, borderWidth: 1, borderColor: LegacyColors.border },
  handle: { width: 36, height: 4, backgroundColor: LegacyColors.border, borderRadius: 2, alignSelf: "center", marginBottom: 16 },
  title: { fontSize: 18, fontWeight: "800", color: LegacyColors.ink, marginBottom: 4 },
  sub: { fontSize: 13, color: LegacyColors.inkSecondary, marginBottom: 20 },
  fields: { gap: 14, marginBottom: 24 },
  field: { gap: 6 },
  label: { fontSize: 12, fontWeight: "700", color: LegacyColors.inkSecondary, textTransform: "uppercase", letterSpacing: 0.5 },
  input: { height: 50, borderWidth: 1.5, borderColor: LegacyColors.border, borderRadius: 12, paddingHorizontal: 14, fontSize: 15, color: LegacyColors.ink, backgroundColor: LegacyColors.surface },
  actions: { flexDirection: "row", gap: 10 },
  cancelBtn: { flex: 1, height: 48, borderRadius: 12, borderWidth: 1.5, borderColor: LegacyColors.border, alignItems: "center", justifyContent: "center" },
  cancelText: { fontSize: 15, fontWeight: "600", color: LegacyColors.inkSecondary },
  confirmBtn: { flex: 2, height: 48, borderRadius: 12, backgroundColor: LegacyColors.accent, alignItems: "center", justifyContent: "center" },
  confirmText: { fontSize: 15, fontWeight: "700", color: LegacyColors.white },
});

export default function Step1RestaurantScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { setRestaurant, goToStep } = useCreateOrderStore();
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [showManual, setShowManual] = useState(false);
  const searchRef = useRef<TextInput>(null);
  const debounceRef = useRef<any>(null);

  useEffect(() => { const t = setTimeout(() => searchRef.current?.focus(), 150); return () => clearTimeout(t); }, []);

  const { data: recents = [] } = useQuery({
    queryKey: ["recent-restaurants", user?.id],
    queryFn: () => fetchRecentRestaurants(user!.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!query.trim()) { setPredictions([]); return; }
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try { const r = await searchPlaces(query); setPredictions(r); }
      catch { setPredictions([]); }
      finally { setIsSearching(false); }
    }, 350);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const handleSelectPrediction = async (pred: any) => {
    setIsSearching(true);
    try {
      const d = await getPlaceDetails(pred.place_id);
      setRestaurant({ placeId: pred.place_id, name: d.name, address: d.formatted_address, city: null, latitude: d.geometry.location.lat, longitude: d.geometry.location.lng });
      goToStep(2); router.push("/create/items");
    } catch { Alert.alert("Error", "Could not load restaurant details. Try again."); }
    finally { setIsSearching(false); }
  };

  const handleSelectRecent = (r: RecentRestaurant) => {
    setRestaurant({ placeId: null, name: r.name, address: r.address, city: null, latitude: null, longitude: null });
    goToStep(2); router.push("/create/items");
  };

  const handleManualConfirm = (r: DraftRestaurantLocal) => {
    setShowManual(false);
    setRestaurant(r);
    goToStep(2); router.push("/create/items");
  };

  const showResults = query.trim().length > 0;

  return (
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={s.container}>
        <View style={s.header}>
          <Pressable style={s.closeBtn} onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="close" size={22} color={LegacyColors.ink} />
          </Pressable>
          <Text style={s.headerTitle}>Where'd you eat?</Text>
          <View style={{ width: 38 }} />
        </View>
        <View style={s.searchRow}>
          <View style={s.searchBar}>
            <Ionicons name="search" size={18} color={LegacyColors.inkSecondary} />
            <TextInput ref={searchRef} style={s.searchInput} value={query} onChangeText={setQuery} placeholder="Search restaurants…" placeholderTextColor={LegacyColors.inkDisabled} returnKeyType="search" autoCorrect={false} clearButtonMode="while-editing" />
            {isSearching && <ActivityIndicator size="small" color={LegacyColors.accent} />}
          </View>
        </View>
        {showResults ? (
          <FlatList
            data={predictions}
            keyExtractor={(p) => p.place_id}
            contentContainerStyle={s.list}
            keyboardShouldPersistTaps="always"
            renderItem={({ item: pred }) => (
              <Pressable style={({ pressed }) => [s.row, pressed && s.rowPressed]} onPress={() => handleSelectPrediction(pred)}>
                <View style={s.rowIcon}><Ionicons name="location-outline" size={18} color={LegacyColors.accent} /></View>
                <View style={s.rowBody}>
                  <Text style={s.rowName} numberOfLines={1}>{pred.structured_formatting.main_text}</Text>
                  <Text style={s.rowAddr} numberOfLines={1}>{pred.structured_formatting.secondary_text}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={LegacyColors.inkDisabled} />
              </Pressable>
            )}
            ListEmptyComponent={!isSearching && query.length > 1 ? <View style={s.noRes}><Text style={s.noResText}>No results for "{query}"</Text></View> : null}
            ListFooterComponent={
              <Pressable style={({ pressed }) => [s.manualBtn, pressed && s.manualBtnP]} onPress={() => setShowManual(true)}>
                <Ionicons name="add-circle-outline" size={18} color={LegacyColors.accent} />
                <Text style={s.manualText}>Can't find it? Add manually</Text>
              </Pressable>
            }
          />
        ) : (
          <ScrollView contentContainerStyle={s.list} keyboardShouldPersistTaps="always">
            {recents.length > 0 && (
              <>
                <Text style={s.sectionLabel}>Recent</Text>
                {recents.map((r) => (
                  <Pressable key={r.id} style={({ pressed }) => [s.row, pressed && s.rowPressed]} onPress={() => handleSelectRecent(r)}>
                    <View style={s.rowIcon}><Ionicons name="time-outline" size={18} color={LegacyColors.inkSecondary} /></View>
                    <View style={s.rowBody}>
                      <Text style={s.rowName}>{r.name}</Text>
                      <Text style={s.rowAddr} numberOfLines={1}>{r.address}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={LegacyColors.inkDisabled} />
                  </Pressable>
                ))}
                <View style={s.divider} />
              </>
            )}
            <Pressable style={({ pressed }) => [s.manualBtn, pressed && s.manualBtnP]} onPress={() => setShowManual(true)}>
              <Ionicons name="add-circle-outline" size={18} color={LegacyColors.accent} />
              <Text style={s.manualText}>Add restaurant manually</Text>
            </Pressable>
          </ScrollView>
        )}
        {showManual && (
          <View style={s.overlay}>
            <Pressable style={s.backdrop} onPress={() => setShowManual(false)} />
            <ManualEntrySheet onConfirm={handleManualConfirm} onCancel={() => setShowManual(false)} />
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: LegacyColors.surface },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, backgroundColor: LegacyColors.card, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: LegacyColors.border },
  closeBtn: { width: 38, height: 38, borderRadius: 10, backgroundColor: LegacyColors.surface, borderWidth: 1, borderColor: LegacyColors.border, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700", color: LegacyColors.ink },
  searchRow: { padding: 14, backgroundColor: LegacyColors.card, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: LegacyColors.border },
  searchBar: { flexDirection: "row", alignItems: "center", height: 46, backgroundColor: LegacyColors.surface, borderRadius: 13, paddingHorizontal: 12, borderWidth: 1.5, borderColor: LegacyColors.border, gap: 8 },
  searchInput: { flex: 1, fontSize: 15, color: LegacyColors.ink },
  list: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 },
  sectionLabel: { fontSize: 11, fontWeight: "700", color: LegacyColors.inkSecondary, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8, marginTop: 4 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 13, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: LegacyColors.border },
  rowPressed: { opacity: 0.6 },
  rowIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: LegacyColors.accentLight, alignItems: "center", justifyContent: "center" },
  rowBody: { flex: 1 },
  rowName: { fontSize: 15, fontWeight: "600", color: LegacyColors.ink },
  rowAddr: { fontSize: 12, color: LegacyColors.inkSecondary, marginTop: 2 },
  noRes: { paddingVertical: 24, alignItems: "center" },
  noResText: { fontSize: 14, color: LegacyColors.inkSecondary },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: LegacyColors.border, marginVertical: 12 },
  manualBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 14, paddingHorizontal: 4, marginTop: 4 },
  manualBtnP: { opacity: 0.6 },
  manualText: { fontSize: 14, fontWeight: "600", color: LegacyColors.accent },
  overlay: { position: "absolute", bottom: 0, left: 0, right: 0, top: 0, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.4)" },
});
