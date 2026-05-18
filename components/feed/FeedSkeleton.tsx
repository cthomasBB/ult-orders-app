import { useEffect, useRef } from "react";
import { Animated, Dimensions, StyleSheet, View } from "react-native";
import { Colors } from "@/constants/colors";

const { width: SCREEN_W } = Dimensions.get("window");
const CARD_PADDING = 16;
const MEDIA_W = SCREEN_W - CARD_PADDING * 2;
const MEDIA_H = Math.round((MEDIA_W * 3) / 4);

// Single shimmering bone
function Bone({
  width,
  height,
  borderRadius = 8,
  style,
  opacity,
}: {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: object;
  opacity: Animated.Value;
}) {
  return (
    <Animated.View
      style={[
        skeletonStyles.bone,
        { width: width as any, height, borderRadius, opacity },
        style,
      ]}
    />
  );
}

export function FeedSkeleton() {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  return (
    <View style={skeletonStyles.card}>
      {/* Header */}
      <View style={skeletonStyles.header}>
        <Bone width={40} height={40} borderRadius={20} opacity={opacity} />
        <View style={skeletonStyles.headerText}>
          <Bone width={120} height={13} opacity={opacity} style={{ marginBottom: 6 }} />
          <Bone width={80} height={11} opacity={opacity} />
        </View>
      </View>

      {/* Media */}
      <Bone
        width={MEDIA_W}
        height={MEDIA_H}
        borderRadius={14}
        opacity={opacity}
        style={skeletonStyles.media}
      />

      {/* Body */}
      <View style={skeletonStyles.body}>
        <Bone width="80%" height={15} opacity={opacity} style={{ marginBottom: 10 }} />
        <Bone width="55%" height={12} opacity={opacity} style={{ marginBottom: 4 }} />
        <Bone width="45%" height={12} opacity={opacity} style={{ marginBottom: 14 }} />
        <View style={skeletonStyles.actionsRow}>
          <Bone width={60} height={28} borderRadius={8} opacity={opacity} />
          <Bone width={50} height={28} borderRadius={8} opacity={opacity} />
          <Bone width={50} height={28} borderRadius={8} opacity={opacity} />
        </View>
      </View>
    </View>
  );
}

// Renders N skeleton cards
export function FeedSkeletonList({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={{ marginBottom: 14 }}>
          <FeedSkeleton />
        </View>
      ))}
    </>
  );
}

const skeletonStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    marginHorizontal: CARD_PADDING,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bone: { backgroundColor: Colors.border },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 10,
  },
  headerText: { flex: 1 },
  media: { marginHorizontal: 0 },
  body: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 14,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 8,
  },
});
