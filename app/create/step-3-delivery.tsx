import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useOrdersStore } from "@/features/orders/store";
import { LegacyColors } from "@/constants/colors";

export default function Step3DeliveryScreen() {
  const router = useRouter();
  const { draft, setDraftDelivery, setDraftStep } = useOrdersStore();
  const [address, setAddress] = useState(draft.delivery_address ?? "");
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDetect = async () => {
    setIsDetecting(true); setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") { setError("Location permission denied."); return; }
      const loc = await Location.getCurrentPositionAsync({});
      const [res] = await Location.reverseGeocodeAsync(loc.coords);
      const fmt = [res.street, res.city, res.region].filter(Boolean).join(", ");
      setAddress(fmt);
      setDraftDelivery(fmt, loc.coords.latitude, loc.coords.longitude);
    } catch { setError("Could not detect location."); }
    finally { setIsDetecting(false); }
  };

  const handleNext = () => {
    if (!address.trim()) { setError("Please enter a delivery address."); return; }
    setDraftDelivery(address, draft.delivery_latitude ?? 0, draft.delivery_longitude ?? 0);
    setDraftStep(4);
    router.push("/create/step-4-review");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.flex}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10}><Ionicons name="arrow-back" size={22} color={LegacyColors.ink} /></Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.stepLabel}>Step 3 of 5</Text>
            <Text style={styles.title}>Delivery Address</Text>
          </View>
          <View style={{ width: 22 }} />
        </View>
        <View style={styles.progressTrack}><View style={[styles.progressFill, { width: "60%" }]} /></View>

        <View style={styles.content}>
          {error && <View style={styles.errorBanner}><Ionicons name="alert-circle" size={15} color={LegacyColors.danger} /><Text style={styles.errorText}>{error}</Text></View>}
          <Text style={styles.label}>Where should we deliver?</Text>
          <TextInput style={styles.input} value={address} onChangeText={setAddress} placeholder="Enter your delivery address…" placeholderTextColor={LegacyColors.inkDisabled} multiline numberOfLines={2} />
          <Pressable style={styles.detectBtn} onPress={handleDetect} disabled={isDetecting}>
            {isDetecting ? <ActivityIndicator size="small" color={LegacyColors.accent} /> : <Ionicons name="locate" size={18} color={LegacyColors.accent} />}
            <Text style={styles.detectText}>{isDetecting ? "Detecting…" : "Use my current location"}</Text>
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Pressable style={[styles.nextBtn, !address.trim() && styles.nextBtnDisabled]} onPress={handleNext} disabled={!address.trim()}>
            <Text style={styles.nextBtnText}>Next: Review Order</Text>
            {!!address.trim() && <Ionicons name="arrow-forward" size={18} color={LegacyColors.white} />}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: LegacyColors.surface },
  flex: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14, gap: 12 },
  headerCenter: { flex: 1 },
  stepLabel: { fontSize: 12, fontWeight: "700", color: LegacyColors.accent, textTransform: "uppercase", letterSpacing: 0.6 },
  title: { fontSize: 20, fontWeight: "800", color: LegacyColors.ink },
  progressTrack: { height: 4, backgroundColor: LegacyColors.border, marginHorizontal: 20, borderRadius: 2, marginBottom: 24, overflow: "hidden" },
  progressFill: { height: 4, backgroundColor: LegacyColors.accent, borderRadius: 2 },
  content: { flex: 1, paddingHorizontal: 20, gap: 14 },
  errorBanner: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: LegacyColors.accentLight, borderRadius: 10, padding: 12 },
  errorText: { flex: 1, fontSize: 13, color: LegacyColors.danger },
  label: { fontSize: 15, fontWeight: "600", color: LegacyColors.ink },
  input: { borderWidth: 1.5, borderColor: LegacyColors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: LegacyColors.ink, backgroundColor: LegacyColors.card, minHeight: 64, textAlignVertical: "top" },
  detectBtn: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1.5, borderColor: LegacyColors.accentLight, backgroundColor: LegacyColors.accentLight },
  detectText: { color: LegacyColors.accent, fontWeight: "600", fontSize: 14 },
  footer: { padding: 16, paddingBottom: 32, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: LegacyColors.border, backgroundColor: LegacyColors.card },
  nextBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", height: 54, backgroundColor: LegacyColors.accent, borderRadius: 14, gap: 8, shadowColor: LegacyColors.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.28, shadowRadius: 8, elevation: 4 },
  nextBtnDisabled: { backgroundColor: LegacyColors.inkDisabled, shadowOpacity: 0, elevation: 0 },
  nextBtnText: { color: LegacyColors.white, fontSize: 16, fontWeight: "700" },
});
