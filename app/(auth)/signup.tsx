import { useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LegacyColors } from "@/constants/colors";
import { useAuthStore } from "@/features/auth/authStore";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function validate(
  email: string,
  username: string,
  password: string,
  confirm: string
): string | null {
  if (!email.trim()) return "Email is required.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Enter a valid email.";
  if (!username.trim()) return "Username is required.";
  if (username.length < 3) return "Username must be at least 3 characters.";
  if (/\s/.test(username)) return "Username cannot contain spaces.";
  if (!password) return "Password is required.";
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (password !== confirm) return "Passwords don't match.";
  return null;
}

// ─── Field ────────────────────────────────────────────────────────────────────

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  secure?: boolean;
  autoCapitalize?: "none" | "words" | "sentences";
  keyboardType?: "default" | "email-address";
  error?: boolean;
  rightElement?: React.ReactNode;
};

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  secure = false,
  autoCapitalize = "none",
  keyboardType = "default",
  error = false,
  rightElement,
}: FieldProps) {
  return (
    <View style={fieldStyles.wrapper}>
      <Text style={fieldStyles.label}>{label}</Text>
      <View style={[fieldStyles.row, error && fieldStyles.rowError]}>
        <TextInput
          style={fieldStyles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={LegacyColors.inkDisabled}
          secureTextEntry={secure}
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
          autoCorrect={false}
        />
        {rightElement}
      </View>
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  wrapper: { gap: 4 },
  label: { fontSize: 13, fontWeight: "600", color: LegacyColors.inkSecondary },
  row: {
    flexDirection: "row",
    alignItems: "center",
    height: 52,
    borderWidth: 1.5,
    borderColor: LegacyColors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: LegacyColors.card,
  },
  rowError: { borderColor: LegacyColors.danger },
  input: { flex: 1, fontSize: 15, color: LegacyColors.ink },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function SignupScreen() {
  const router = useRouter();
  const { signUp, isLoading } = useAuthStore();

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    const validationError = validate(email, username, password, confirm);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    try {
      await signUp({
        email: email.trim().toLowerCase(),
        password,
        username: username.trim().toLowerCase(),
        display_name: displayName.trim() || username.trim(),
      });
      // Navigate to taste-tags onboarding
      router.replace("/(auth)/onboarding/taste-tags");
    } catch (e: any) {
      setError(e.message ?? "Something went wrong. Please try again.");
    }
  };

  const EyeBtn = ({
    visible,
    onToggle,
  }: {
    visible: boolean;
    onToggle: () => void;
  }) => (
    <Pressable onPress={onToggle} hitSlop={8}>
      <Ionicons
        name={visible ? "eye-off-outline" : "eye-outline"}
        size={20}
        color={LegacyColors.inkSecondary}
      />
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back */}
          <Pressable style={styles.back} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={LegacyColors.ink} />
          </Pressable>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Create account</Text>
            <Text style={styles.subtitle}>
              Join ULT and build your food deck.
            </Text>
          </View>

          {/* Error */}
          {error && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={15} color={LegacyColors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Fields */}
          <View style={styles.fields}>
            <Field
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              error={!!error && !email}
            />
            <Field
              label="Username"
              value={username}
              onChangeText={(v) => setUsername(v.toLowerCase().replace(/\s/g, ""))}
              placeholder="e.g. spicy_foodlover"
              error={!!error && !username}
            />
            <Field
              label="Display name (optional)"
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="How you appear to others"
              autoCapitalize="words"
            />
            <Field
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Min 8 characters"
              secure={!showPassword}
              error={!!error && !password}
              rightElement={
                <EyeBtn
                  visible={showPassword}
                  onToggle={() => setShowPassword((v) => !v)}
                />
              }
            />
            <Field
              label="Confirm password"
              value={confirm}
              onChangeText={setConfirm}
              placeholder="Repeat password"
              secure={!showConfirm}
              error={!!error && password !== confirm}
              rightElement={
                <EyeBtn
                  visible={showConfirm}
                  onToggle={() => setShowConfirm((v) => !v)}
                />
              }
            />
          </View>

          {/* Submit */}
          <Pressable
            style={({ pressed }) => [
              styles.submitBtn,
              (pressed || isLoading) && styles.submitBtnPressed,
            ]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={LegacyColors.white} />
            ) : (
              <Text style={styles.submitBtnText}>Create Account</Text>
            )}
          </Pressable>

          {/* Sign in */}
          <Pressable
            style={styles.signinLink}
            onPress={() => router.push("/(auth)/login")}
          >
            <Text style={styles.signinText}>
              Already have an account?{" "}
              <Text style={styles.signinAccent}>Sign in</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: LegacyColors.surface },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 0,
  },
  back: { marginBottom: 20, alignSelf: "flex-start" },
  header: { marginBottom: 24, gap: 4 },
  title: { fontSize: 28, fontWeight: "800", color: LegacyColors.ink, letterSpacing: -0.3 },
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
  fields: { gap: 14, marginBottom: 24 },
  submitBtn: {
    height: 54,
    borderRadius: 14,
    backgroundColor: LegacyColors.accent,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: LegacyColors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 16,
  },
  submitBtnPressed: { backgroundColor: LegacyColors.accentDark },
  submitBtnText: { fontSize: 16, fontWeight: "700", color: LegacyColors.white },
  signinLink: { alignItems: "center", paddingVertical: 4 },
  signinText: { fontSize: 14, color: LegacyColors.inkSecondary },
  signinAccent: { color: LegacyColors.accent, fontWeight: "700" },
});
