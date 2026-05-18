import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { WebView } from "react-native-webview";
import * as WebBrowser from "expo-web-browser";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { Colors } from "@/constants/colors";

// ─── Config ───────────────────────────────────────────────────────────────────

const PRIVACY_POLICY_URL =
  (Constants.expoConfig?.extra?.privacyPolicyUrl as string) ??
  "https://ultorders.app/privacy";

// ─── Loading indicator ────────────────────────────────────────────────────────

function WebViewLoader() {
  return (
    <View style={styles.loader}>
      <ActivityIndicator color={Colors.accent} size="large" />
    </View>
  );
}

// ─── Error state ──────────────────────────────────────────────────────────────

function WebViewError({ onRetry, onOpenExternal }: { onRetry: () => void; onOpenExternal: () => void }) {
  return (
    <View style={styles.errorState}>
      <Ionicons name="cloud-offline-outline" size={48} color={Colors.inkDisabled} />
      <Text style={styles.errorTitle}>Couldn't load policy</Text>
      <Text style={styles.errorSub}>Check your connection and try again.</Text>
      <View style={styles.errorActions}>
        <Pressable
          style={({ pressed }) => [styles.retryBtn, pressed && styles.retryBtnPressed]}
          onPress={onRetry}
        >
          <Text style={styles.retryBtnText}>Retry</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.externalBtn, pressed && styles.externalBtnPressed]}
          onPress={onOpenExternal}
        >
          <Ionicons name="open-outline" size={15} color={Colors.accent} />
          <Text style={styles.externalBtnText}>Open in browser</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  const [key, setKey] = useState(0);
  const [hasError, setHasError] = useState(false);

  const handleRetry = () => {
    setHasError(false);
    setKey((k) => k + 1);
  };

  const handleOpenExternal = async () => {
    await WebBrowser.openBrowserAsync(PRIVACY_POLICY_URL);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      {hasError ? (
        <WebViewError onRetry={handleRetry} onOpenExternal={handleOpenExternal} />
      ) : (
        <WebView
          key={key}
          source={{ uri: PRIVACY_POLICY_URL }}
          style={styles.webview}
          renderLoading={() => <WebViewLoader />}
          startInLoadingState
          onError={() => setHasError(true)}
          onHttpError={(event) => {
            if (event.nativeEvent.statusCode >= 400) setHasError(true);
          }}
          // Security
          allowsInlineMediaPlayback={false}
          mediaPlaybackRequiresUserAction
          // Branding
          applicationNameForUserAgent="ULTOrders/1.0"
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.card },
  webview: { flex: 1, backgroundColor: Colors.card },
  loader: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.card,
  },
  errorState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 40,
    backgroundColor: Colors.surface,
  },
  errorTitle: { fontSize: 18, fontWeight: "700", color: Colors.ink },
  errorSub: { fontSize: 14, color: Colors.inkSecondary, textAlign: "center" },
  errorActions: { flexDirection: "row", gap: 10, marginTop: 8 },
  retryBtn: {
    paddingHorizontal: 22,
    paddingVertical: 10,
    backgroundColor: Colors.accent,
    borderRadius: 10,
  },
  retryBtnPressed: { backgroundColor: Colors.accentDark },
  retryBtnText: { fontSize: 14, fontWeight: "700", color: Colors.white },
  externalBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 10,
    backgroundColor: Colors.card,
  },
  externalBtnPressed: { backgroundColor: Colors.surface },
  externalBtnText: { fontSize: 14, fontWeight: "600", color: Colors.accent },
});
