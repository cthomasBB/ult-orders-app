import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as Sentry from "@sentry/react-native";
import { supabase } from "@/services/supabase";
import { analytics } from "@/services/analytics";
import { useAuthStore } from "@/features/auth/authStore";
import { useFollowStore, setFollowQueryClient } from "@/features/feed/followStore";
import { useNotifications } from "@/hooks/useNotifications";

// ─── Initialise analytics as early as possible ───────────────────────────────
// Must run before any component renders so Sentry catches early crashes.
analytics.init();

SplashScreen.preventAutoHideAsync();

// ─── React Query client ───────────────────────────────────────────────────────

// Give the follow store access to the query client so it can
// invalidate the Following feed when the user follows/unfollows someone
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// ─── Auth gate ────────────────────────────────────────────────────────────────

// Register query client with follow store immediately
setFollowQueryClient(queryClient);

function AuthGate() {
  const { session, isLoading, setSession, fetchProfile, user, publicUser } =
    useAuthStore();
  const { loadFollowing } = useFollowStore();
  const segments = useSegments();
  const router = useRouter();

  useNotifications();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) {
        fetchProfile(data.session.user.id);
        loadFollowing(data.session.user.id);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (session?.user) {
          fetchProfile(session.user.id);
          loadFollowing(session.user.id);
        }
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  // Keep Sentry + PostHog identity in sync with auth state
  useEffect(() => {
    if (user && publicUser) {
      analytics.identify(user.id, {
        username: publicUser.username,
        display_name: publicUser.display_name,
      });
    } else if (!user) {
      analytics.reset();
    }
  }, [user?.id, publicUser?.username]);

  // ── Auth routing ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (isLoading) return;
    const inAuthGroup = segments[0] === "(auth)";
    if (!session && !inAuthGroup) {
      router.replace("/(auth)/sign-in");
    } else if (session && inAuthGroup) {
      router.replace("/(tabs)/");
    }
  }, [session, isLoading, segments]);








  return null;
}

// ─── Root layout ──────────────────────────────────────────────────────────────

function RootLayout() {
  const [fontsLoaded] = useFonts({
    // Slot for custom fonts e.g.:
    // "Inter-Regular": require("../assets/fonts/Inter-Regular.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="create"
            options={{ presentation: "modal", animation: "slide_from_bottom" }}
          />
          <Stack.Screen
            name="order/[id]"
            options={{
              headerShown: true,
              title: "Order Details",
              headerBackTitle: "Back",
              presentation: "card",
            }}
          />
          <Stack.Screen
            name="restaurant/[id]"
            options={{ presentation: "card" }}
          />
          <Stack.Screen
            name="profile/[username]"
            options={{
              headerShown: false,
              presentation: "card",
            }}
          />
          <Stack.Screen
            name="privacy-policy"
            options={{
              headerShown: true,
              title: "Privacy Policy",
              headerBackTitle: "Back",
              presentation: "card",
            }}
          />
        </Stack>

        <AuthGate />
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

// Wrap with Sentry for automatic crash reporting + performance tracing
export default Sentry.wrap(RootLayout);
