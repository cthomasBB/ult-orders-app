import { useRef, useState } from "react";
import { GestureResponderEvent } from "react-native";
import {
  Dimensions,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { width: SCREEN_W } = Dimensions.get("window");

type MediaItem = {
  id: string;
  url: string;
  thumbnail_url?: string | null;
  media_type: "photo" | "video";
};

type MediaCarouselProps = {
  media: MediaItem[];
  width?: number;
  height?: number;
  borderRadius?: number;
  restaurantName?: string;
  showRestaurantPill?: boolean;
  onPress?: () => void;
};

export function MediaCarousel({
  media,
  width = SCREEN_W - 32,
  height = Math.round((SCREEN_W - 32) * 3 / 4),
  borderRadius = 14,
  restaurantName,
  showRestaurantPill = false,
  onPress,
}: MediaCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const didScrollRef = useRef(false);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    setActiveIndex(index);
    didScrollRef.current = true;
  };
  const handleScrollBegin = () => {
    didScrollRef.current = false;
  };
  const handleTap = () => {
    if (!didScrollRef.current && onPress) {
      onPress();
    }
    didScrollRef.current = false;
  };

  if (!media || media.length === 0) {
    return (
      <View style={[styles.container, { width, height, borderRadius, backgroundColor: "#F0EDE8", alignItems: "center", justifyContent: "center" }]}>
        <Text style={{ fontSize: 48 }}>🍽️</Text>
        {restaurantName && <Text style={styles.emptyLabel}>{restaurantName}</Text>}
      </View>
    );
  }

  return (
    <View style={[styles.container, { width, height, borderRadius }]}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        onScrollBeginDrag={handleScrollBegin}
        decelerationRate="fast"
        snapToInterval={width}
        snapToAlignment="center"
        style={{ width, height, borderRadius }}
        contentContainerStyle={{ borderRadius }}
      >
        {media.map((m) => (
          <Pressable key={m.id} onPress={handleTap} style={{ width, height, borderRadius, overflow: "hidden" }}>
            <Image
              source={{ uri: m.thumbnail_url ?? m.url }}
              style={{ width, height }}
              resizeMode="cover"
            />
            {m.media_type === "video" && (
              <View style={styles.playOverlay}>
                <View style={styles.playButton}>
                  <Ionicons name="play" size={22} color="#fff" />
                </View>
              </View>
            )}
          </Pressable>
        ))}
      </ScrollView>

      {/* Restaurant pill */}
      {showRestaurantPill && restaurantName && (
        <View style={styles.restaurantPill}>
          <Text style={styles.restaurantPillText} numberOfLines={1}>
            {restaurantName}
          </Text>
        </View>
      )}

      {/* Dot indicators — only show for multiple media */}
      {media.length > 1 && (
        <View style={styles.dots}>
          {media.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === activeIndex && styles.dotActive]}
            />
          ))}
        </View>
      )}

      {/* Multi-photo icon badge */}
      {media.length > 1 && (
        <View style={styles.multiIndicator}>
          <Ionicons name="copy-outline" size={14} color="#fff" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    backgroundColor: "#F0EDE8",
  },
  emptyLabel: {
    marginTop: 8,
    fontSize: 13,
    color: "#999",
    fontWeight: "500",
  },
  playOverlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  playButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    paddingLeft: 4,
  },
  restaurantPill: {
    position: "absolute",
    bottom: 10,
    left: 10,
    backgroundColor: "rgba(0,0,0,0.60)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    maxWidth: "65%",
  },
  restaurantPillText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.1,
  },
  dots: {
    position: "absolute",
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  dotActive: {
    backgroundColor: "#fff",
    width: 18,
  },
  multiIndicator: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 6,
    padding: 4,
  },
});
