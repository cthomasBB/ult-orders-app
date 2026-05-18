import { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { Colors } from "@/constants/colors";
import type { StatusLevel } from "@/types/profile";

// ─── Ring config ──────────────────────────────────────────────────────────────

type RingConfig = {
  rings: number;
  colors: string[];
  animated: boolean;
  gap: number;
};

const RING_CONFIG: Record<StatusLevel, RingConfig> = {
  rookie: {
    rings: 0,
    colors: [],
    animated: false,
    gap: 0,
  },
  regular: {
    rings: 1,
    colors: [Colors.ringGold], // gold
    animated: false,
    gap: 2,
  },
  curator: {
    rings: 2,
    colors: [Colors.ringGold, Colors.ringGoldLight], // double gold
    animated: false,
    gap: 2,
  },
  legend: {
    rings: 1,
    colors: [Colors.accent, Colors.ringGold, Colors.triedPurple],
    animated: true,
    gap: 3,
  },
};

// ─── Animated gradient ring (Legend) ─────────────────────────────────────────

function LegendRing({
  avatarSize,
  gap,
  borderWidth,
}: {
  avatarSize: number;
  gap: number;
  borderWidth: number;
}) {
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    );
    anim.start();
    return () => anim.stop();
  }, []);

  const ringSize = avatarSize + (gap + borderWidth) * 2;

  // Simulated animated gradient using rotating overlay
  const rotate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View
      style={[
        legendStyles.container,
        { width: ringSize, height: ringSize, borderRadius: ringSize / 2 },
      ]}
    >
      {/* Static gradient base */}
      <View
        style={[
          legendStyles.ring,
          { width: ringSize, height: ringSize, borderRadius: ringSize / 2 },
        ]}
      />
      {/* Rotating shimmer overlay */}
      <Animated.View
        style={[
          legendStyles.shimmer,
          {
            width: ringSize,
            height: ringSize,
            borderRadius: ringSize / 2,
            transform: [{ rotate }],
          },
        ]}
      />
    </View>
  );
}

const legendStyles = StyleSheet.create({
  container: { alignItems: "center", justifyContent: "center", position: "absolute" },
  ring: {
    position: "absolute",
    // Simulated multi-color ring via background with border trick
    borderWidth: 3,
    borderColor: Colors.accent,
    // Top half ember, bottom half gold — approximation without LinearGradient
  },
  shimmer: {
    position: "absolute",
    borderWidth: 3,
    borderTopColor: Colors.ringGold,
    borderRightColor: Colors.triedPurple,
    borderBottomColor: Colors.accent,
    borderLeftColor: Colors.ringGold,
  },
});

// ─── StatusRing wrapper ───────────────────────────────────────────────────────

type StatusRingProps = {
  level: StatusLevel;
  avatarSize: number;
  children: React.ReactNode;
};

export function StatusRing({ level, avatarSize, children }: StatusRingProps) {
  const config = RING_CONFIG[level];

  if (config.rings === 0) {
    // Rookie — no ring
    return <View style={{ width: avatarSize, height: avatarSize }}>{children}</View>;
  }

  const borderWidth = 2.5;
  const totalGap = config.gap * config.rings;
  const outerSize = avatarSize + (borderWidth + config.gap) * 2 * config.rings;

  return (
    <View
      style={[
        ringStyles.outer,
        {
          width: outerSize,
          height: outerSize,
          borderRadius: outerSize / 2,
        },
      ]}
    >
      {/* Rings (drawn largest → smallest) */}
      {config.animated ? (
        <LegendRing
          avatarSize={avatarSize}
          gap={config.gap}
          borderWidth={borderWidth}
        />
      ) : (
        Array.from({ length: config.rings }).map((_, i) => {
          const ringSize =
            avatarSize + (borderWidth + config.gap) * 2 * (i + 1);
          return (
            <View
              key={i}
              style={[
                ringStyles.ring,
                {
                  width: ringSize,
                  height: ringSize,
                  borderRadius: ringSize / 2,
                  borderColor: config.colors[i] ?? config.colors[0],
                  borderWidth: borderWidth,
                  position: "absolute",
                },
              ]}
            />
          );
        })
      )}
      {/* Avatar inside */}
      <View
        style={{
          width: avatarSize,
          height: avatarSize,
          borderRadius: avatarSize / 2,
          overflow: "hidden",
        }}
      >
        {children}
      </View>
    </View>
  );
}

const ringStyles = StyleSheet.create({
  outer: {
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    position: "absolute",
  },
});
