import { useCallback } from "react";
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
import type { UseInfiniteQueryResult } from "@tanstack/react-query";
import { Colors } from "@/constants/colors";
import { FeedCard } from "./FeedCard";
import { FeedSkeletonList } from "./FeedSkeleton";
import type { UltOrderFeedItem, FeedType } from "@/types/feed";

// ─── Props ────────────────────────────────────────────────────────────────────

type FeedListProps = {
  query: UseInfiniteQueryResult<{ pages: UltOrderFeedItem[][] }, Error>;
  feedType: FeedType;
  ListHeaderComponent?: React.ReactElement;
};

// ─── Empty states per feed type ───────────────────────────────────────────────

const EMPTY_STATES: Record<
  FeedType,
  { emoji: string; title: string; subtitle: string }
> = {
  following: {
    emoji: "👥",
    title: "Your feed is empty",
    subtitle: "Follow people to see their orders here.",
  },
  trending: {
    emoji: "🔥",
    title: "Nothing trending yet",
    subtitle: "Check back soon — the heat is building.",
  },
  nearby: {
    emoji: "📍",
    title: "Nothing near you yet",
    subtitle: "Be the first to post an order in your area.",
  },
};

// ─── Error state ──────────────────────────────────────────────────────────────

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={errorStyles.container}>
      <Ionicons name="cloud-offline-outline" size={48} color={Colors.inkDisabled} />
      <Text style={errorStyles.title}>Couldn't load feed</Text>
      <Text style={errorStyles.subtitle}>Check your connection and try again.</Text>
      <Pressable
        style={({ pressed }) => [
          errorStyles.btn,
          pressed && errorStyles.btnPressed,
        ]}
        onPress={onRetry}
      >
        <Text style={errorStyles.btnText}>Retry</Text>
      </Pressable>
    </View>
  );
}

const errorStyles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40, gap: 10 },
  title: { fontSize: 18, fontWeight: "700", color: Colors.ink },
  subtitle: { fontSize: 14, color: Colors.inkSecondary, textAlign: "center", lineHeight: 20 },
  btn: { marginTop: 8, paddingHorizontal: 24, paddingVertical: 10, backgroundColor: Colors.accent, borderRadius: 10 },
  btnPressed: { backgroundColor: Colors.accentDark },
  btnText: { fontSize: 15, fontWeight: "700", color: Colors.white },
});

// ─── FeedList ─────────────────────────────────────────────────────────────────

export function FeedList({ query, feedType, ListHeaderComponent }: FeedListProps) {
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    isRefetching,
    error,
  } = query;

  // Flatten pages into a single array
  const items: UltOrderFeedItem[] = data?.pages.flatMap((page) => page) ?? [];

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderItem = useCallback(
    ({ item }: { item: UltOrderFeedItem }) => (
      <View style={listStyles.itemWrapper}>
        <FeedCard item={item} />
      </View>
    ),
    []
  );

  const keyExtractor = useCallback(
    (item: UltOrderFeedItem) => item.id,
    []
  );

  const ListFooter = () => {
    if (isFetchingNextPage) {
      return (
        <View style={listStyles.footer}>
          <ActivityIndicator size="small" color={Colors.accent} />
        </View>
      );
    }
    if (!hasNextPage && items.length > 0) {
      return (
        <View style={listStyles.footer}>
          <Text style={listStyles.footerText}>You're all caught up 🎉</Text>
        </View>
      );
    }
    return <View style={listStyles.bottomPad} />;
  };

  const emptyState = EMPTY_STATES[feedType];

  // ── Initial loading state ──
  if (isLoading) {
    return (
      <FlatList
        data={[]}
        renderItem={() => null}
        ListHeaderComponent={
          <View>
            {ListHeaderComponent}
            <View style={listStyles.skeletonContainer}>
              <FeedSkeletonList count={3} />
            </View>
          </View>
        }
        style={listStyles.list}
        contentContainerStyle={listStyles.content}
        scrollEnabled={false}
      />
    );
  }

  // ── Error state ──
  if (error && items.length === 0) {
    return (
      <FlatList
        data={[]}
        renderItem={() => null}
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={<ErrorState onRetry={refetch} />}
        style={listStyles.list}
        contentContainerStyle={listStyles.contentFlex}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={Colors.accent}
          />
        }
      />
    );
  }

  return (
    <FlatList
      data={items}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      style={listStyles.list}
      contentContainerStyle={items.length === 0 ? listStyles.contentFlex : listStyles.content}
      showsVerticalScrollIndicator={false}
      // Pull to refresh
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetch}
          tintColor={Colors.accent}
          colors={[Colors.accent]}
        />
      }
      // Infinite scroll
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.4}
      // Header
      ListHeaderComponent={
        <View>
          {ListHeaderComponent}
          {isRefetching && items.length > 0 && (
            <View style={listStyles.refreshIndicator}>
              <FeedSkeletonList count={1} />
            </View>
          )}
        </View>
      }
      // Footer with loading / end-of-feed indicator
      ListFooterComponent={<ListFooter />}
      // Empty state
      ListEmptyComponent={
        <View style={listStyles.emptyContainer}>
          <Text style={listStyles.emptyEmoji}>{emptyState.emoji}</Text>
          <Text style={listStyles.emptyTitle}>{emptyState.title}</Text>
          <Text style={listStyles.emptySubtitle}>{emptyState.subtitle}</Text>
        </View>
      }
      // Performance
      removeClippedSubviews={true}
      maxToRenderPerBatch={4}
      windowSize={7}
      initialNumToRender={3}
    />
  );
}

const listStyles = StyleSheet.create({
  list: { flex: 1, backgroundColor: Colors.surface },
  content: { paddingTop: 10, paddingBottom: 24 },
  contentFlex: { flexGrow: 1, paddingTop: 10 },
  itemWrapper: { marginBottom: 14 },
  skeletonContainer: { paddingTop: 10 },
  refreshIndicator: { marginBottom: 14 },
  footer: { alignItems: "center", paddingVertical: 24 },
  footerText: { fontSize: 13, color: Colors.inkSecondary },
  bottomPad: { height: 24 },
  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40, gap: 8 },
  emptyEmoji: { fontSize: 52, marginBottom: 4 },
  emptyTitle: { fontSize: 20, fontWeight: "700", color: Colors.ink },
  emptySubtitle: { fontSize: 14, color: Colors.inkSecondary, textAlign: "center", lineHeight: 20 },
});
