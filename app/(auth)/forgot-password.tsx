import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { authResetPassword } from "@/services/supabase";
import { LegacyColors } from "@/constants/colors";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReset = async () => {
    if (!email.trim()) { setError("Please enter your email."); return; }
    setIsLoading(true);
    setError(null);
    try {
      await authResetPassword(email.trim().toLowerCase());
      setSent(true);
    } catch (e: any) {
      setError(e.message ?? "Failed to send reset link.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <View style={styles.container}>
          {/* Close / back */}
          <Pressable style={styles.closeBtn} onPress={() => router.back()}>
            <Ionicons name="close" size={22} color={LegacyColors.ink} />
          </Pressable>

          <View style={styles.content}>
            <View style={styles.iconWrap}>
              <Ionicons name="lock-closed" size={28} color={LegacyColors.accent} />
            </View>
            <Text style={styles.title}>Forgot password?</Text>
            <Text style={styles.description}>
              Enter the email linked to your account. We'll send you a reset link.
            </Text>

            {sent ? (
              /* ── Success state ── */
              <View style={styles.successBox}>
                <Ionicons name="mail-outline" size={24} color={LegacyColors.saveGreen} />
                <View style={styles.successText}>
                  <Text style={styles.successTitle}>Check your email</Text>
                  <Text style={styles.successBody}>
                    We sent a password reset link to {email}
                  </Text>
                </View>
              </View>
            ) : (
              /* ── Form ── */
              <View style={styles.form}>
                {error && (
                  <View style={styles.errorBanner}>
                    <Ionicons name="alert-circle" size={15} color={LegacyColors.danger} />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Email address</Text>
                  <TextInput
                    style={[styles.input, error && styles.inputError]}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="you@example.com"
                    placeholderTextColor={LegacyColors.inkDisabled}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    autoCorrect={false}
                  />
                </View>
                <Pressable
                  style={({ pressed }) => [
                    styles.submitBtn,
                    (pressed || isLoading) && styles.submitBtnPressed,
                  ]}
                  onPress={handleReset}
                  disabled={isLoading}
                >
                  {isLoading
                    ? <ActivityIndicator color={LegacyColors.white} />
                    : <Text style={styles.submitBtnText}>Send Reset Link</Text>
                  }
                </Pressable>
              </View>
            )}

            {/* Back to sign in */}
            <Pressable style={styles.backLink} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={14} color={LegacyColors.accent} />
              <Text style={styles.backLinkText}>Back to Sign In</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: LegacyColors.surface },
  flex: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 16 },
  closeBtn: {
    alignSelf: "flex-end",
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: LegacyColors.card,
    borderWidth: 1,
    borderColor: LegacyColors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  content: { flex: 1, justifyContent: "center", gap: 20 },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: LegacyColors.accentLight,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  title: { fontSize: 28, fontWeight: "800", color: LegacyColors.ink, letterSpacing: -0.3 },
  description: { fontSize: 15, color: LegacyColors.inkSecondary, lineHeight: 22, marginTop: -8 },
  successBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    backgroundColor: LegacyColors.saveGreenLight,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: LegacyColors.saveGreen + "40",
  },
  successText: { flex: 1, gap: 4 },
  successTitle: { fontSize: 15, fontWeight: "700", color: LegacyColors.saveGreen },
  successBody: { fontSize: 14, color: LegacyColors.inkSecondary, lineHeight: 20 },
  form: { gap: 14 },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: LegacyColors.accentLight,
    borderRadius: 10,
    padding: 12,
  },
  errorText: { flex: 1, fontSize: 13, color: LegacyColors.danger },
  fieldGroup: { gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: LegacyColors.inkSecondary },
  input: {
    height: 52,
    borderWidth: 1.5,
    borderColor: LegacyColors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    color: LegacyColors.ink,
    backgroundColor: LegacyColors.card,
  },
  inputError: { borderColor: LegacyColors.danger },
  submitBtn: {
    height: 54,
    borderRadius: 14,
    backgroundColor: LegacyColors.accent,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: LegacyColors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnPressed: { backgroundColor: LegacyColors.accentDark },
  submitBtnText: { fontSize: 16, fontWeight: "700", color: LegacyColors.white },
  backLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 4,
  },
  backLinkText: { fontSize: 14, color: LegacyColors.accent, fontWeight: "600" },
});
