import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { SignatureOrderDeck } from "@/components/profile/SignatureOrderDeck";
import { RestaurantPairModule } from "@/components/restaurant/RestaurantPairModule";
import { FeedSkeletonList } from "@/components/feed/FeedSkeleton";
import {
  useUserOrders,
  groupByRestaurant,
  deriveTopTags,
} from "@/features/orders/useOrders";
import {
  useDeckCards,
  useUserBadges,
} from "@/features/profile/useProfile";
import type { UserProfile, ViewerRelation, RestaurantOrderGroup } from "@/types/profile";

// ─── Tab config ───────────────────────────────────────────────────────────────

type ProfileTab = "deck" | "orders" | "collections";

const TABS: {
  key: ProfileTab;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
}[] = [
  { key: "deck",        label: "Deck",        icon: "albums-outline"   },
  { key: "orders",      label: "Orders",      icon: "receipt-outline"  },
  { key: "collections", label: "Collections", icon: "bookmark-outline" },
];

// ─── Sticky tab bar ───────────────────────────────────────────────────────────

function ProfileTabBar({
  active,
  onChange,
}: {
  active: ProfileTab;
  onChange: (t: ProfileTab) => void;
}) {
  return (
    <View style={tabStyles.bar}>
      {TABS.map((tab) => {
        const isActive = tab.key === active;
        return (
          <Pressable
            key={tab.key}
            style={({ pressed }) => [
              tabStyles.tab,
              pressed && tabStyles.tabPressed,
            ]}
            onPress={() => onChange(tab.key)}
          >
            <Ionicons
              name={tab.icon}
              size={16}
              color={isActive ? Colors.accent : Colors.inkSecondary}
            />
            <Text style={[tabStyles.label, isActive && tabStyles.labelActive]}>
              {tab.label}
            </Text>
            {isActive && <View style={tabStyles.underline} />}
          </Pressable>
        );
      })}
    </View>
  );
}

const tabStyles = StyleSheet.create({
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
    paddingVertical: 12,
    gap: 5,
    position: "relative",
  },
  tabPressed: { opacity: 0.65 },
  label: { fontSize: 13, fontWeight: "600", color: Colors.inkSecondary },
  labelActive: { color: Colors.accent },
  underline: {
    position: "absolute",
    bottom: 0,
    left: 10,
    right: 10,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: Colors.accent,
  },
});

// ─── Collections placeholder ──────────────────────────────────────────────────

function CollectionsPlaceholder({ isOwn }: { isOwn: boolean }) {
  return (
    <View style={colStyles.container}>
      <Text style={colStyles.emoji}>📚</Text>
      <Text style={colStyles.title}>
        {isOwn ? "No collections yet" : "No public collections"}
      </Text>
      <Text style={colStyles.sub}>
        {isOwn
          ? "Curate lists of your favourite ULT orders."
          : "This user hasn't made any collections public."}
      </Text>
    </View>
  );
}

const colStyles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 32,
    gap: 10,
  },
  emoji: { fontSize: 48 },
  title: { fontSize: 18, fontWeight: "700", color: Colors.ink },
  sub: {
    fontSize: 14,
    color: Colors.inkSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
});

// ─── ProfileScreen ────────────────────────────────────────────────────────────

export type ProfileScreenProps = {
  profile: UserProfile;
  relation: ViewerRelation;
  onFollow: () => void;
  onEdit: () => void;
  onBack?: () => void;
};

export function ProfileScreen({
  profile,
  relation,
  onFollow,
  onEdit,
}: ProfileScreenProps) {
  const [activeTab, setActiveTab] = useState<ProfileTab>("deck");

  // Queries
  const { data: badges = [] }    = useUserBadges(profile.id);
  const { data: deckCards = [] } = useDeckCards(profile.id);

  const {
    data: ordersData,
    isLoading: loadingOrders,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch: refetchOrders,
    isRefetching,
  } = useUserOrders(profile.id);

  const allOrders = ordersData?.pages.flatMap((p) => p) ?? [];
  const restaurantGroups = groupByRestaurant(allOrders);
  const topTags = deriveTopTags(allOrders);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // ── renderItem ──────────────────────────────────────────────────────────────
  const renderItem = useCallback(
    ({ item }: { item: RestaurantOrderGroup }) => (
      <RestaurantPairModule group={item} />
    ),
    []
  );

  // ── ListHeaderComponent MUST be a component (not inline JSX) ───────────────
  // Wrapping in useCallback + passing activeTab as dep ensures the header
  // re-renders when the tab changes, showing Deck / Collections / empty states.
  const ListHeaderComponent = useCallback(
    () => (
      <View>
        {/* Profile header */}
        <ProfileHeader
          profile={profile}
          badges={badges}
          tasteTags={topTags}
          relation={relation}
          onFollow={onFollow}
          onEdit={onEdit}
        />

        {/* Tab bar */}
        <ProfileTabBar active={activeTab} onChange={setActiveTab} />

        {/* ── Deck tab content ── */}
        {activeTab === "deck" && (
          <SignatureOrderDeck
            cards={deckCards}
            isOwn={relation.is_own_profile}
            onAddToDeck={() => {/* TODO: open pin picker */}}
          />
        )}

        {/* ── Collections tab content ── */}
        {activeTab === "collections" && (
          <CollectionsPlaceholder isOwn={relation.is_own_profile} />
        )}

        {/* ── Orders tab: skeleton while loading ── */}
        {activeTab === "orders" && loadingOrders && (
          <View style={styles.skeletonPad}>
            <FeedSkeletonList count={2} />
          </View>
        )}

        {/* ── Orders tab: empty state ── */}
        {activeTab === "orders" &&
          !loadingOrders &&
          restaurantGroups.length === 0 && (
            <View style={styles.emptyOrders}>
              <Text style={styles.emptyEmoji}>📋</Text>
              <Text style={styles.emptyTitle}>No orders yet</Text>
              <Text style={styles.emptySub}>
                {relation.is_own_profile
                  ? "Start posting to fill your profile."
                  : "This user hasn't posted any orders."}
              </Text>
            </View>
          )}
      </View>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      profile,
      badges,
      topTags,
      relation,
      activeTab,
      deckCards,
      loadingOrders,
      restaurantGroups.length,
    ]
  );

  // Only pass orders data when the Orders tab is active
  const listData =
    activeTab === "orders" && !loadingOrders ? restaurantGroups : [];

  return (
    <FlatList
      data={listData}
      keyExtractor={(item) => item.restaurant_id}
      renderItem={renderItem}
      // Re-key the FlatList when tab changes so it scrolls to top
      key={activeTab}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={
        activeTab === "orders" && isFetchingNextPage ? (
          <View style={styles.fetchMore}>
            <ActivityIndicator size="small" color={Colors.accent} />
          </View>
        ) : (
          <View style={{ height: 40 }} />
        )
      }
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.4}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetchOrders}
          tintColor={Colors.accent}
          colors={[Colors.accent]}
        />
      }
      style={styles.list}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      removeClippedSubviews
      maxToRenderPerBatch={4}
      windowSize={7}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: Colors.surface },
  content: { flexGrow: 1 },
  skeletonPad: { padding: 16 },
  emptyOrders: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 32,
    gap: 8,
  },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: Colors.ink },
  emptySub: {
    fontSize: 14,
    color: Colors.inkSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  fetchMore: { paddingVertical: 20, alignItems: "center" },
});
