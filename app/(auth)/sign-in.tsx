import { Link, useRouter } from "expo-router";
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
import { supabase } from "@/services/supabase";
import { LegacyColors } from "@/constants/colors";

export default function SignInScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setIsLoading(true);
    setError(null);
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setIsLoading(false);
    if (authError) {
      setError(authError.message);
    } else {
      router.replace("/(tabs)/");
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <View style={styles.header}>
          <Text style={styles.logo}>🍔 ult-orders</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>
        </View>

        <View style={styles.form}>
          {error && <Text style={styles.error}>{error}</Text>}

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
          />

          <Link href="/(auth)/forgot-password" style={styles.forgot}>
            Forgot password?
          </Link>

          <Pressable
            style={[styles.btn, isLoading && styles.btnDisabled]}
            onPress={handleSignIn}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Sign In</Text>
            )}
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <Link href="/(auth)/sign-up" style={styles.footerLink}>
            Sign Up
          </Link>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: LegacyColors.surface },
  container: { flex: 1, justifyContent: "center", paddingHorizontal: 24 },
  header: { alignItems: "center", marginBottom: 40 },
  logo: { fontSize: 32, fontWeight: "800", color: LegacyColors.accent },
  subtitle: { fontSize: 16, color: LegacyColors.inkSecondary, marginTop: 8 },
  form: { gap: 12 },
  error: {
    backgroundColor: LegacyColors.accentLight,
    color: LegacyColors.danger,
    padding: 12,
    borderRadius: 8,
    fontSize: 14,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: LegacyColors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: LegacyColors.ink,
    backgroundColor: LegacyColors.card,
  },
  forgot: { alignSelf: "flex-end", color: LegacyColors.accent, fontSize: 14 },
  btn: {
    height: 52,
    backgroundColor: LegacyColors.accent,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: LegacyColors.white, fontSize: 16, fontWeight: "700" },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 32 },
  footerText: { color: LegacyColors.inkSecondary, fontSize: 15 },
  footerLink: { color: LegacyColors.accent, fontSize: 15, fontWeight: "600" },
});
