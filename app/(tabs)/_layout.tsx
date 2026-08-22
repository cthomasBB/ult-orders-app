import { Tabs, useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LegacyColors } from "@/constants/colors";

// ─── Types ────────────────────────────────────────────────────────────────────
type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

// ─── Regular tab icon ─────────────────────────────────────────────────────────
function TabIcon({
  name,
  focused,
  label,
}: {
  name: IoniconsName;
  focused: boolean;
  label: string;
}) {
  const color = focused ? LegacyColors.tabActive : LegacyColors.tabInactive;
  return (
    <View style={iconStyles.wrapper}>
      <Ionicons
        name={focused ? name : (`${name}-outline` as IoniconsName)}
        size={24}
        color={color}
      />
      <Text style={[iconStyles.label, { color }]}>{label}</Text>
    </View>
  );
}

const iconStyles = StyleSheet.create({
  wrapper: { alignItems: "center", gap: 2, paddingTop: 6 },
  label: { fontSize: 10, fontWeight: "600" },
});

// ─── FAB Post button (centre tab) ────────────────────────────────────────────
/**
 * The Post tab does NOT navigate to a tab screen.
 * Instead, tapping it calls router.push('/create/restaurant')
 * to open the create flow as a modal.
 */
function PostTabButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={fabStyles.hitSlop}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      accessibilityLabel="Start a new order"
      accessibilityRole="button"
    >
      <View style={fabStyles.fab}>
        <Ionicons name="add" size={30} color={LegacyColors.white} />
      </View>
    </Pressable>
  );
}

const fabStyles = StyleSheet.create({
  hitSlop: {
    alignItems: "center",
    justifyContent: "center",
    // Lift the button above the tab bar
    marginBottom: Platform.OS === "ios" ? 20 : 14,
  },
  fab: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: LegacyColors.accent,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: LegacyColors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
});

// ─── Tabs layout ──────────────────────────────────────────────────────────────
export default function TabsLayout() {
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // Hide the default label — each TabIcon renders its own
        tabBarShowLabel: false,
        tabBarActiveTintColor: LegacyColors.tabActive,
        tabBarInactiveTintColor: LegacyColors.tabInactive,
            tabBarStyle: { height: 60 }, tabBarLabelStyle: { fontSize: 10 },
      }}
    >
      {/* ── 1. Home ── */}
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="home" focused={focused} label="Home" />
          ),
        }}
      />

      {/* ── 2. Explore ── */}
      <Tabs.Screen
        name="search"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="search" focused={focused} label="Find" labelStyle={{ fontSize: 9 }} />
          ),
        }}
      />

      {/* ── 3. Post (FAB — no screen navigation) ── */}
      <Tabs.Screen
        name="post"
        options={{
          // Render the FAB instead of a normal tab icon
          tabBarButton: () => (
            <PostTabButton
              onPress={() => router.push("/create/restaurant")}
            />
          ),
        }}
        listeners={{
          // Intercept any default tab navigation and suppress it
          tabPress: (e) => {
            e.preventDefault();
            router.push("/create/restaurant");
          },
        }}
      />

      {/* ── 4. Saved ── */}
      <Tabs.Screen
        name="saved"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="bookmark" focused={focused} label="Saved" />
          ),
        }}
      />

      {/* ── 5. Profile ── */}
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="person" focused={focused} label="Me" labelStyle={{ fontSize: 9 }} />
          ),
        }}
      />

      {/* Hide legacy tab screens that should not appear in the bar */}
      <Tabs.Screen name="orders" options={{ href: null }} />
    </Tabs>
  );
}
