import { useState, useCallback, useRef } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { useAuthStore } from "@/features/auth/authStore";
import { useLocation } from "@/hooks/useLocation";
import {
  useFollowingFeed,
  useTrendingFeed,
  useNearbyFeed,
} from "@/features/feed/useFeed";
import { FeedList } from "@/components/feed/FeedList";
import type { FeedType } from "@/types/feed";

// ─── Segment config ───────────────────────────────────────────────────────────

type Segment = {
  key: FeedType;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
};

const SEGMENTS: Segment[] = [
  { key: "following", label: "Following", icon: "people-outline"   },
  { key: "trending",  label: "Trending",  icon: "flame-outline"    },
  { key: "nearby",    label: "Near You",  icon: "location-outline" },
];

// ─── Segmented control ────────────────────────────────────────────────────────

function SegmentedControl({
  active,
  onChange,
}: {
  active: FeedType;
  onChange: (key: FeedType) => void;
}) {
  return (
    <View style={segStyles.bar}>
      {SEGMENTS.map((seg) => {
        const isActive = seg.key === active;
        return (
          <Pressable
            key={seg.key}
            style={({ pressed }) => [
              segStyles.tab,
              isActive && segStyles.tabActive,
              pressed && segStyles.tabPressed,
            ]}
            onPress={() => onChange(seg.key)}
          >
            <Ionicons
              name={seg.icon}
              size={15}
              color={isActive ? Colors.accent : Colors.inkSecondary}
              style={segStyles.tabIcon}
            />
            <Text
              style={[
                segStyles.tabLabel,
                isActive && segStyles.tabLabelActive,
              ]}
            >
              {seg.label}
            </Text>
            {isActive && <View style={segStyles.activeBar} />}
          </Pressable>
        );
      })}
    </View>
  );
}

const segStyles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    backgroundColor: Colors.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 11,
    gap: 5,
    position: "relative",
  },
  tabActive: {},
  tabPressed: { opacity: 0.65 },
  tabIcon: {},
  tabLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.inkSecondary,
  },
  tabLabelActive: { color: Colors.accent },
  activeBar: {
    position: "absolute",
    bottom: 0,
    left: 12,
    right: 12,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: Colors.accent,
  },
});

// ─── Following feed wrapper ───────────────────────────────────────────────────

function FollowingFeed({ header }: { header: React.ReactElement }) {
  const query = useFollowingFeed();
  const pages = (query.data?.pages ?? []).flat();

  // Empty state — not following anyone yet
  if (!query.isLoading && !query.isError && pages.length === 0) {
    return (
      <View style={followingEmptyStyles.container}>
        {header}
        <View style={followingEmptyStyles.inner}>
          <Text style={followingEmptyStyles.emoji}>🍽️</Text>
          <Text style={followingEmptyStyles.title}>Your feed is empty</Text>
          <Text style={followingEmptyStyles.body}>
            Follow creators to see their ULT orders here. Check out Trending to find people to follow.
          </Text>
        </View>
      </View>
    );
  }

  return <FeedList query={query as any} feedType="following" ListHeaderComponent={header} />;
}

const followingEmptyStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40, gap: 12 },
  emoji: { fontSize: 48 },
  title: { fontSize: 20, fontWeight: "700", color: Colors.ink },
  body: { fontSize: 14, color: Colors.inkSecondary, textAlign: "center", lineHeight: 22 },
});

// ─── Trending feed wrapper ────────────────────────────────────────────────────

function TrendingFeed({ header }: { header: React.ReactElement }) {
  const query = useTrendingFeed();
  return <FeedList query={query as any} feedType="trending" ListHeaderComponent={header} />;
}

// ─── Nearby feed wrapper ──────────────────────────────────────────────────────

function NearbyFeed({ header }: { header: React.ReactElement }) {
  const { coords, isLoading, refresh } = useLocation();
  const query = useNearbyFeed(coords);

  if (isLoading && !coords) {
    return (
      <View style={nearbyStyles.locating}>
        <Ionicons name="locate" size={32} color={Colors.accent} />
        <Text style={nearbyStyles.locatingText}>Finding your location…</Text>
      </View>
    );
  }

  if (!coords) {
    return (
      <View style={nearbyStyles.locating}>
        <Ionicons name="location-outline" size={40} color={Colors.inkDisabled} />
        <Text style={nearbyStyles.noLocTitle}>Location unavailable</Text>
        <Text style={nearbyStyles.noLocBody}>
          Enable location access to see orders near you.
        </Text>
        <Pressable style={nearbyStyles.retryBtn} onPress={refresh}>
          <Text style={nearbyStyles.retryText}>Enable Location</Text>
        </Pressable>
      </View>
    );
  }

  return <FeedList query={query as any} feedType="nearby" ListHeaderComponent={header} />;
}

const nearbyStyles = StyleSheet.create({
  locating: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 40 },
  locatingText: { fontSize: 15, color: Colors.inkSecondary },
  noLocTitle: { fontSize: 18, fontWeight: "700", color: Colors.ink },
  noLocBody: { fontSize: 14, color: Colors.inkSecondary, textAlign: "center", lineHeight: 20 },
  retryBtn: { marginTop: 4, paddingHorizontal: 24, paddingVertical: 10, backgroundColor: Colors.accent, borderRadius: 10 },
  retryText: { fontSize: 15, fontWeight: "700", color: Colors.white },
});

// ─── Home screen ─────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const { publicUser } = useAuthStore();
  const [activeSegment, setActiveSegment] = useState<FeedType>("following");

  // Greeting
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const name =
    publicUser?.display_name ?? publicUser?.username ?? "spice_oracle";

  // Header rendered above each feed
  const header = (
    <View style={styles.headerContainer}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <Text style={styles.greetingText}>{greeting} 👋</Text>
          <Text style={styles.nameText}>{name}</Text>
        </View>
        <View style={styles.topBarRight}>
          <Pressable
            style={styles.iconBtn}
            onPress={() => router.push("/create/restaurant" as any)}
          >
            <Ionicons name="add" size={22} color={Colors.ink} />
          </Pressable>
          <Pressable style={styles.iconBtn}>
            <Ionicons name="notifications-outline" size={22} color={Colors.ink} />
          </Pressable>
        </View>
      </View>

      {/* Segmented control */}
      <SegmentedControl active={activeSegment} onChange={setActiveSegment} />
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {activeSegment === "following" && <FollowingFeed header={header} />}
      {activeSegment === "trending"  && <TrendingFeed  header={header} />}
      {activeSegment === "nearby"    && <NearbyFeed    header={header} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.surface },
  headerContainer: {
    backgroundColor: Colors.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    marginBottom: 0,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: Platform.OS === "ios" ? 8 : 14,
    paddingBottom: 10,
  },
  topBarLeft: { gap: 1 },
  greetingText: { fontSize: 12, color: Colors.inkSecondary },
  nameText: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.ink,
    letterSpacing: -0.3,
  },
  topBarRight: { flexDirection: "row", gap: 6 },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
});
