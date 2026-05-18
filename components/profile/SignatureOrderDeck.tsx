import { useRouter } from "expo-router";
import {
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { formatCount } from "@/features/feed/useFeed";
import type { DeckCard } from "@/types/profile";

const { width: SCREEN_W } = Dimensions.get("window");
const PADDING = 16;
const GAP = 8;
const PAIR_CARD_W = (SCREEN_W - PADDING * 2 - GAP) / 2;
const FULL_CARD_W = SCREEN_W - PADDING * 2;

// ─── Individual deck card ─────────────────────────────────────────────────────

type DeckCardTileProps = {
  card: DeckCard;
  width: number;
  height: number;
};

function DeckCardTile({ card, width, height }: DeckCardTileProps) {
  const router = useRouter();

  return (
    <Pressable
      style={({ pressed }) => [
        tileStyles.card,
        { width, height },
        pressed && tileStyles.cardPressed,
      ]}
      onPress={() => router.push(`/ult-order/${card.id}` as any)}
    >
      {/* Background image or placeholder */}
      {card.cover_url ? (
        <Image
          source={{ uri: card.cover_url }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, tileStyles.placeholder]}>
          <Text style={tileStyles.placeholderEmoji}>🍽️</Text>
        </View>
      )}

      {/* Gradient overlay */}
      <View style={tileStyles.overlay} />

      {/* Save count — prominent top-right */}
      <View style={tileStyles.saveChip}>
        <Ionicons name="bookmark" size={12} color={Colors.saveGreen} />
        <Text style={tileStyles.saveCount}>{formatCount(card.save_count)}</Text>
      </View>

      {/* Bottom text */}
      <View style={tileStyles.bottom}>
        <Text style={tileStyles.restaurantName} numberOfLines={1}>
          {card.restaurant_name}
        </Text>
        {card.title && (
          <Text style={tileStyles.orderTitle} numberOfLines={2}>
            {card.title}
          </Text>
        )}
        {card.cuisine_type.length > 0 && (
          <Text style={tileStyles.cuisine} numberOfLines={1}>
            {card.cuisine_type.slice(0, 2).join(" · ")}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const tileStyles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: Colors.surface,
    position: "relative",
  },
  cardPressed: { opacity: 0.88, transform: [{ scale: 0.98 }] },
  placeholder: {
    backgroundColor: Colors.accentLight,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderEmoji: { fontSize: 42 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    // Simulate bottom-to-top gradient
    backgroundColor: "transparent",
    // The bottom 60% is darkened via the bottom view's bg
  },
  saveChip: {
    position: "absolute",
    top: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  saveCount: { fontSize: 12, fontWeight: "700", color: Colors.white },
  bottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.62)",
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 2,
  },
  restaurantName: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(255,255,255,0.75)",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  orderTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.white,
    lineHeight: 17,
  },
  cuisine: {
    fontSize: 11,
    color: "rgba(255,255,255,0.6)",
  },
});

// ─── Add to Deck button ───────────────────────────────────────────────────────

function AddToDeckBtn({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [
        addStyles.btn,
        pressed && addStyles.btnPressed,
      ]}
      onPress={onPress}
    >
      <Ionicons name="add" size={20} color={Colors.accent} />
      <Text style={addStyles.text}>Add to Deck</Text>
    </Pressable>
  );
}

const addStyles = StyleSheet.create({
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.accentLight,
    borderStyle: "dashed",
    backgroundColor: Colors.card,
    marginHorizontal: PADDING,
    marginTop: GAP,
  },
  btnPressed: { backgroundColor: Colors.accentLight },
  text: { fontSize: 14, fontWeight: "600", color: Colors.accent },
});

// ─── Empty deck state ─────────────────────────────────────────────────────────

function EmptyDeck({ isOwn, onAdd }: { isOwn: boolean; onAdd: () => void }) {
  return (
    <View style={emptyStyles.container}>
      <Text style={emptyStyles.emoji}>🃏</Text>
      <Text style={emptyStyles.title}>
        {isOwn ? "Your deck is empty" : "No deck yet"}
      </Text>
      <Text style={emptyStyles.sub}>
        {isOwn
          ? "Pin your best orders to build your Signature Deck."
          : "This user hasn't pinned any orders yet."}
      </Text>
      {isOwn && (
        <Pressable style={({ pressed }) => [emptyStyles.btn, pressed && emptyStyles.btnPressed]} onPress={onAdd}>
          <Text style={emptyStyles.btnText}>Build Your Deck</Text>
        </Pressable>
      )}
    </View>
  );
}

const emptyStyles = StyleSheet.create({
  container: { alignItems: "center", paddingVertical: 52, paddingHorizontal: 32, gap: 10 },
  emoji: { fontSize: 48 },
  title: { fontSize: 18, fontWeight: "700", color: Colors.ink },
  sub: { fontSize: 14, color: Colors.inkSecondary, textAlign: "center", lineHeight: 20 },
  btn: { marginTop: 4, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: Colors.accent, borderRadius: 12 },
  btnPressed: { backgroundColor: Colors.accentDark },
  btnText: { fontSize: 14, fontWeight: "700", color: Colors.white },
});

// ─── SignatureOrderDeck ───────────────────────────────────────────────────────

type SignatureOrderDeckProps = {
  cards: DeckCard[];
  isOwn: boolean;
  onAddToDeck?: () => void;
};

export function SignatureOrderDeck({
  cards,
  isOwn,
  onAddToDeck,
}: SignatureOrderDeckProps) {
  const router = useRouter();

  if (cards.length === 0) {
    return (
      <EmptyDeck
        isOwn={isOwn}
        onAdd={() => router.push("/create/restaurant" as any)}
      />
    );
  }

  /**
   * Layout pattern (repeating):
   *   Row A: card[0] + card[1]  (side-by-side, equal width)
   *   Row B: card[2]            (full-width)
   *   Row A: card[3] + card[4]  (side-by-side, equal width)
   */

  const PAIR_HEIGHT = Math.round(PAIR_CARD_W * 1.25); // portrait-ish
  const FULL_HEIGHT = Math.round(FULL_CARD_W * 0.5);  // landscape

  const rows: React.ReactNode[] = [];
  let i = 0;

  while (i < cards.length) {
    const rowIndex = Math.floor(i / 3); // every 3 cards = 1 cycle
    const posInCycle = i % 3;

    if (posInCycle === 2) {
      // Full-width card
      rows.push(
        <View key={`full-${i}`} style={deckStyles.fullRow}>
          <DeckCardTile
            card={cards[i]}
            width={FULL_CARD_W}
            height={FULL_HEIGHT}
          />
        </View>
      );
      i++;
    } else {
      // Pair row (take up to 2 cards)
      const pair = cards.slice(i, i + 2);
      rows.push(
        <View key={`pair-${i}`} style={deckStyles.pairRow}>
          {pair.map((card) => (
            <DeckCardTile
              key={card.id}
              card={card}
              width={PAIR_CARD_W}
              height={PAIR_HEIGHT}
            />
          ))}
          {/* Ghost slot if only 1 card in pair and is own */}
          {pair.length === 1 && isOwn && (
            <Pressable
              style={({ pressed }) => [
                deckStyles.ghostSlot,
                { width: PAIR_CARD_W, height: PAIR_HEIGHT },
                pressed && deckStyles.ghostSlotPressed,
              ]}
              onPress={onAddToDeck}
            >
              <Ionicons name="add" size={28} color={Colors.inkDisabled} />
              <Text style={deckStyles.ghostText}>Pin an order</Text>
            </Pressable>
          )}
        </View>
      );
      i += pair.length;
    }
  }

  return (
    <View style={deckStyles.container}>
      <View style={deckStyles.grid}>{rows}</View>

      {/* "Add to Deck" CTA if own profile and slots remain */}
      {isOwn && cards.length < 5 && (
        <AddToDeckBtn onPress={onAddToDeck ?? (() => {})} />
      )}
    </View>
  );
}

const deckStyles = StyleSheet.create({
  container: { paddingTop: 16, paddingBottom: 24 },
  grid: { paddingHorizontal: PADDING, gap: GAP },
  pairRow: { flexDirection: "row", gap: GAP },
  fullRow: {},
  ghostSlot: {
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.surface,
  },
  ghostSlotPressed: { backgroundColor: Colors.accentLight },
  ghostText: { fontSize: 12, color: Colors.inkDisabled, fontWeight: "500" },
});
