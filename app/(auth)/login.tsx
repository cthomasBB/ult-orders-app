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
import { LegacyColors } from "@/constants/colors";
import { useAuthStore } from "@/features/auth/authStore";

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, isLoading } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    if (!email.trim()) { setError("Email is required."); return; }
    if (!password) { setError("Password is required."); return; }
    setError(null);
    try {
      await signIn({ email: email.trim().toLowerCase(), password });
      // Auth gate in _layout.tsx will redirect to /(tabs)/ automatically
    } catch (e: any) {
      setError(e.message ?? "Incorrect email or password.");
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <View style={styles.container}>
          {/* Back */}
          <Pressable style={styles.back} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={LegacyColors.ink} />
          </Pressable>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to your ULT account.</Text>
          </View>

          {/* Error */}
          {error && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={15} color={LegacyColors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Email */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Email</Text>
            <TextInput
              style={[styles.input, error && !email && styles.inputError]}
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

          {/* Password */}
          <View style={styles.fieldGroup}>
            <View style={styles.passwordRow}>
              <Text style={styles.fieldLabel}>Password</Text>
              <Pressable onPress={() => router.push("/(auth)/forgot-password")}>
                <Text style={styles.forgotLink}>Forgot password?</Text>
              </Pressable>
            </View>
            <View style={[styles.inputWrapper, error && !password && styles.inputError]}>
              <TextInput
                style={styles.inputFlex}
                value={password}
                onChangeText={setPassword}
                placeholder="Your password"
                placeholderTextColor={LegacyColors.inkDisabled}
                secureTextEntry={!showPassword}
                autoComplete="password"
                autoCorrect={false}
              />
              <Pressable
                onPress={() => setShowPassword((v) => !v)}
                hitSlop={8}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={LegacyColors.inkSecondary}
                />
              </Pressable>
            </View>
          </View>

          {/* Submit */}
          <Pressable
            style={({ pressed }) => [
              styles.submitBtn,
              (pressed || isLoading) && styles.submitBtnPressed,
            ]}
            onPress={handleSignIn}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={LegacyColors.white} />
            ) : (
              <Text style={styles.submitBtnText}>Sign In</Text>
            )}
          </Pressable>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Create account */}
          <Pressable
            style={({ pressed }) => [
              styles.createBtn,
              pressed && styles.createBtnPressed,
            ]}
            onPress={() => router.push("/(auth)/signup")}
          >
            <Text style={styles.createBtnText}>Create a new account</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: LegacyColors.surface },
  flex: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  back: { marginBottom: 28, alignSelf: "flex-start" },
  header: { marginBottom: 28, gap: 4 },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: LegacyColors.ink,
    letterSpacing: -0.3,
  },
  subtitle: { fontSize: 15, color: LegacyColors.inkSecondary },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: LegacyColors.accentLight,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: { flex: 1, fontSize: 13, color: LegacyColors.danger },
  fieldGroup: { marginBottom: 16, gap: 6 },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: LegacyColors.inkSecondary,
  },
  passwordRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  forgotLink: {
    fontSize: 13,
    color: LegacyColors.accent,
    fontWeight: "600",
  },
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
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    height: 52,
    borderWidth: 1.5,
    borderColor: LegacyColors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: LegacyColors.card,
  },
  inputFlex: { flex: 1, fontSize: 15, color: LegacyColors.ink },
  inputError: { borderColor: LegacyColors.danger },
  submitBtn: {
    height: 54,
    borderRadius: 14,
    backgroundColor: LegacyColors.accent,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    marginBottom: 20,
    shadowColor: LegacyColors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnPressed: { backgroundColor: LegacyColors.accentDark },
  submitBtnText: { fontSize: 16, fontWeight: "700", color: LegacyColors.white },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: LegacyColors.border,
  },
  dividerText: { fontSize: 13, color: LegacyColors.inkSecondary },
  createBtn: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: LegacyColors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: LegacyColors.card,
  },
  createBtnPressed: { backgroundColor: LegacyColors.surface },
  createBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: LegacyColors.ink,
  },
});
