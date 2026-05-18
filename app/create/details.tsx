import { useRouter } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function DetailsScreen() {
  const router = useRouter();
  const [caption, setCaption] = useState("");
  const [bestFor, setBestFor] = useState("");
  const [valueRating, setValueRating] = useState("");
  const [tag, setTag] = useState("");
  const [tags, setTags] = useState([]);

  function addTag() {
    const t = tag.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTag("");
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.progressBar}><View style={[styles.progressFill, { width: "80%" }]} /></View>
        <View style={styles.stepHeader}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#111" />
          </Pressable>
          <Text style={styles.stepTitle}>Details</Text>
        </View>
        <Text style={styles.sectionLabel}>Caption</Text>
        <TextInput style={styles.captionInput} placeholder="What makes this your ultimate order?" placeholderTextColor="#888" value={caption} onChangeText={setCaption} multiline maxLength={300} />
        <Text style={styles.charCount}>{caption.length}/300</Text>
        <Text style={styles.sectionLabel}>Best for</Text>
        <View style={styles.optionRow}>
          {["Solo","Date","Group","Family","Work lunch"].map((o) => (
            <Pressable key={o} style={[styles.chip, bestFor===o && styles.chipActive]} onPress={() => setBestFor(o)}>
              <Text style={[styles.chipText, bestFor===o && styles.chipTextActive]}>{o}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.sectionLabel}>Value</Text>
        <View style={styles.optionRow}>
          {["Budget","Fair","Worth it","Splurge"].map((o) => (
            <Pressable key={o} style={[styles.chip, valueRating===o && styles.chipActive]} onPress={() => setValueRating(o)}>
              <Text style={[styles.chipText, valueRating===o && styles.chipTextActive]}>{o}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.sectionLabel}>Tags</Text>
        <View style={styles.tagInputRow}>
          <TextInput style={styles.tagInput} placeholder="Add a tag..." placeholderTextColor="#888" value={tag} onChangeText={setTag} onSubmitEditing={addTag} returnKeyType="done" />
          <Pressable style={styles.tagAddBtn} onPress={addTag}><Ionicons name="add" size={20} color="#fff" /></Pressable>
        </View>
        <View style={styles.pillRow}>
          {tags.map((t) => (
            <View key={t} style={styles.pill}>
              <Text style={styles.pillText}>{t}</Text>
              <Pressable onPress={() => setTags(tags.filter(x => x !== t))} hitSlop={8}>
                <Ionicons name="close" size={12} color="#888" />
              </Pressable>
            </View>
          ))}
        </View>
        <Pressable style={styles.nextBtn} onPress={() => router.push("/create/preview")}>
          <Text style={styles.nextBtnText}>Next: Preview</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9F9F8" },
  content: { padding: 20, paddingBottom: 60 },
  progressBar: { height: 3, backgroundColor: "#E5E5E5", borderRadius: 2, marginBottom: 20 },
  progressFill: { height: 3, backgroundColor: "#C8472B", borderRadius: 2 },
  stepHeader: { flexDirection: "row", alignItems: "center", marginBottom: 24 },
  backBtn: { marginRight: 12 },
  stepTitle: { fontSize: 20, fontWeight: "700", color: "#111" },
  sectionLabel: { fontSize: 13, fontWeight: "600", color: "#888", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10, marginTop: 20 },
  captionInput: { backgroundColor: "#fff", borderRadius: 12, padding: 14, fontSize: 15, color: "#111", minHeight: 100, textAlignVertical: "top", borderWidth: 1, borderColor: "#E5E5E5" },
  charCount: { fontSize: 11, color: "#888", textAlign: "right", marginTop: 4 },
  optionRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: "#F0EDE8", borderWidth: 1.5, borderColor: "transparent" },
  chipActive: { backgroundColor: "#FEF0ED", borderColor: "#C8472B" },
  chipText: { fontSize: 13, color: "#888", fontWeight: "500" },
  chipTextActive: { color: "#C8472B", fontWeight: "700" },
  tagInputRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
  tagInput: { flex: 1, backgroundColor: "#fff", borderRadius: 10, padding: 12, fontSize: 14, color: "#111", borderWidth: 1, borderColor: "#E5E5E5" },
  tagAddBtn: { width: 44, height: 44, borderRadius: 10, backgroundColor: "#C8472B", alignItems: "center", justifyContent: "center" },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 },
  pill: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#F0EDE8", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  pillText: { fontSize: 12, color: "#111" },
  nextBtn: { backgroundColor: "#C8472B", borderRadius: 16, padding: 18, alignItems: "center", marginTop: 20 },
  nextBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
