import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LegacyColors } from "@/constants/colors";
import { useAuthStore } from "@/features/auth/authStore";

// ─── Social button ────────────────────────────────────────────────────────────

type SocialBtnProps = {
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
  isLoading?: boolean;
  style?: object;
};

function SocialButton({ label, icon, onPress, isLoading, style }: SocialBtnProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.socialBtn,
        pressed && styles.socialBtnPressed,
        style,
      ]}
      onPress={onPress}
      disabled={isLoading}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={LegacyColors.ink} />
      ) : (
        <>
          <View style={styles.socialIcon}>{icon}</View>
          <Text style={styles.socialLabel}>{label}</Text>
          <View style={styles.socialSpacer} />
        </>
      )}
    </Pressable>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function WelcomeScreen() {
  const router = useRouter();
  const { signInWithApple, signInWithGoogle, isLoading, error } = useAuthStore();

  return (
    <SafeAreaView style={styles.safe}>
      {/* ── Hero ── */}
      <View style={styles.hero}>
        <View style={styles.logoMark}>
          <Text style={styles.logoEmoji}>🔥</Text>
        </View>
        <Text style={styles.wordmark}>ult orders</Text>
        <Text style={styles.tagline}>
          Discover restaurants, build your{"\n"}deck, and share the heat.
        </Text>
      </View>

      {/* ── Illustration ── */}
      <View style={styles.illustration}>
        <Text style={styles.illustrationRow}>🍔</Text>
        <Text style={styles.illustrationRow}>🌮  🍜</Text>
        <Text style={styles.illustrationRow}>🍕  🍣  🥗</Text>
      </View>

      {/* ── Auth actions ── */}
      <View style={styles.actions}>
        {error ? (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={16} color={LegacyColors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Apple — only shown on iOS */}
        {Platform.OS === "ios" && (
          <SocialButton
            label="Sign in with Apple"
            icon={<Ionicons name="logo-apple" size={20} color={LegacyColors.ink} />}
            onPress={signInWithApple}
            isLoading={isLoading}
            style={styles.appleBtn}
          />
        )}

        {/* Google */}
        <SocialButton
          label="Sign in with Google"
          icon={<Text style={styles.googleG}>G</Text>}
          onPress={signInWithGoogle}
          isLoading={isLoading}
        />

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Email CTA */}
        <Pressable
          style={({ pressed }) => [
            styles.emailBtn,
            pressed && styles.emailBtnPressed,
          ]}
          onPress={() => router.push("/(auth)/signup")}
        >
          <Ionicons name="mail-outline" size={20} color={LegacyColors.white} />
          <Text style={styles.emailBtnText}>Continue with Email</Text>
        </Pressable>

        {/* Sign in link */}
        <Pressable
          style={styles.signinLink}
          onPress={() => router.push("/(auth)/login")}
        >
          <Text style={styles.signinLinkText}>
            Already have an account?{" "}
            <Text style={styles.signinLinkAccent}>Sign in</Text>
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: LegacyColors.surface,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  // ── Hero
  hero: { alignItems: "center", marginTop: 40 },
  logoMark: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: LegacyColors.accent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: LegacyColors.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  logoEmoji: { fontSize: 36 },
  wordmark: {
    fontSize: 34,
    fontWeight: "800",
    color: LegacyColors.ink,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 15,
    color: LegacyColors.inkSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginTop: 8,
  },
  // ── Illustration
  illustration: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  illustrationRow: {
    fontSize: 40,
    letterSpacing: 6,
    lineHeight: 52,
  },
  // ── Actions
  actions: { gap: 10 },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: LegacyColors.accentLight,
    borderRadius: 10,
    padding: 12,
  },
  errorText: { flex: 1, fontSize: 13, color: LegacyColors.danger },
  // Social buttons
  socialBtn: {
    flexDirection: "row",
    alignItems: "center",
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: LegacyColors.border,
    backgroundColor: LegacyColors.card,
    paddingHorizontal: 16,
  },
  socialBtnPressed: { backgroundColor: LegacyColors.surface },
  appleBtn: {
    backgroundColor: LegacyColors.ink,
    borderColor: LegacyColors.ink,
  },
  socialIcon: { width: 28, alignItems: "center" },
  socialLabel: { flex: 1, textAlign: "center", fontSize: 15, fontWeight: "600", color: LegacyColors.ink },
  socialSpacer: { width: 28 },
  googleG: { fontSize: 18, fontWeight: "800", color: "#4285F4" },
  // Divider
  divider: { flexDirection: "row", alignItems: "center", gap: 10, marginVertical: 2 },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: LegacyColors.border },
  dividerText: { fontSize: 13, color: LegacyColors.inkSecondary },
  // Email CTA
  emailBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 52,
    borderRadius: 12,
    backgroundColor: LegacyColors.accent,
    gap: 10,
    shadowColor: LegacyColors.accent,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  emailBtnPressed: { backgroundColor: LegacyColors.accentDark },
  emailBtnText: { fontSize: 16, fontWeight: "700", color: LegacyColors.white },
  // Sign in link
  signinLink: { alignItems: "center", paddingVertical: 4 },
  signinLinkText: { fontSize: 14, color: LegacyColors.inkSecondary },
  signinLinkAccent: { color: LegacyColors.accent, fontWeight: "700" },
});
