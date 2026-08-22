import { useRouter } from "expo-router";
import { useRef, useCallback } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useCreateOrderStore } from "@/features/orders/createOrderStore";
import { LegacyColors } from "@/constants/colors";

const MAX_ITEMS = 8;

type ItemRowProps = {
  id: string;
  name: string;
  modifications: string;
  price: string;
  isPrimary: boolean;
  isOnly: boolean;
  onChangeName: (v: string) => void;
  onChangeMods: (v: string) => void;
  onChangePrice: (v: string) => void;
  onRemove: () => void;
  onModsReturn: () => void;
  nameRef: React.RefObject<TextInput>;
  modsRef: React.RefObject<TextInput>;
  priceRef: React.RefObject<TextInput>;
};

function ItemRow({
  id, name, modifications, price, isPrimary, isOnly,
  onChangeName, onChangeMods, onChangePrice, onRemove,
  onModsReturn, nameRef, modsRef, priceRef,
}: ItemRowProps) {
  return (
    <View style={rowStyles.card}>
      <View style={rowStyles.dotCol}>
        <View style={[rowStyles.dot, isPrimary && rowStyles.dotActive]}>
          {isPrimary && <View style={rowStyles.dotInner} />}
        </View>
      </View>
      <View style={rowStyles.fields}>
        <View style={rowStyles.nameRow}>
          <TextInput
            ref={nameRef}
            style={rowStyles.nameInput}
            value={name}
            onChangeText={onChangeName}
            placeholder="Item name…"
            placeholderTextColor={LegacyColors.inkDisabled}
            returnKeyType="next"
            onSubmitEditing={() => modsRef.current?.focus()}
            blurOnSubmit={false}
          />
          <View style={rowStyles.priceWrap}>
            <Text style={rowStyles.dollarSign}>$</Text>
            <TextInput
              ref={priceRef}
              style={rowStyles.priceInput}
              value={price}
              onChangeText={(v) => {
                const clean = v.replace(/[^0-9.]/g, "");
                onChangePrice(clean);
              }}
              placeholder="0.00"
              placeholderTextColor={LegacyColors.inkDisabled}
              keyboardType="decimal-pad"
              returnKeyType="next"
              onSubmitEditing={() => modsRef.current?.focus()}
              blurOnSubmit={false}
            />
          </View>
        </View>
        <View style={rowStyles.separator} />
        <TextInput
          ref={modsRef}
          style={rowStyles.modsInput}
          value={modifications}
          onChangeText={onChangeMods}
          placeholder="Modifications, notes…"
          placeholderTextColor={LegacyColors.inkDisabled}
          returnKeyType="done"
          onSubmitEditing={onModsReturn}
          blurOnSubmit={false}
        />
      </View>
      {!isOnly && (
        <Pressable style={rowStyles.removeBtn} onPress={onRemove} hitSlop={10}>
          <Ionicons name="close-circle" size={20} color={LegacyColors.inkDisabled} />
        </Pressable>
      )}
    </View>
  );
}

const rowStyles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: LegacyColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: LegacyColors.border,
    paddingVertical: 12,
    paddingLeft: 14,
    paddingRight: 10,
    gap: 10,
    shadowColor: LegacyColors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  dotCol: { paddingTop: 4, width: 14, alignItems: "center" },
  dot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: LegacyColors.border, alignItems: "center", justifyContent: "center" },
  dotActive: { borderColor: LegacyColors.accent },
  dotInner: { width: 6, height: 6, borderRadius: 3, backgroundColor: LegacyColors.accent },
  fields: { flex: 1 },
  nameRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  nameInput: { flex: 1, fontSize: 15, fontWeight: "600", color: LegacyColors.ink, paddingVertical: 0, minHeight: 22 },
  priceWrap: { flexDirection: "row", alignItems: "center", marginLeft: 8 },
  dollarSign: { fontSize: 14, color: LegacyColors.inkSecondary, fontWeight: "600" },
  priceInput: { fontSize: 14, fontWeight: "700", color: LegacyColors.ink, paddingVertical: 0, minWidth: 56, textAlign: "right" },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: LegacyColors.border, marginVertical: 8 },
  modsInput: { fontSize: 13, color: LegacyColors.inkSecondary, paddingVertical: 0, minHeight: 20 },
  removeBtn: { paddingTop: 2 },
});

export default function Step2ItemsScreen() {
  const router = useRouter();
  const { draft, addItem, removeItem, updateItemName, updateItemMods, updateItemPrice, goToStep } =
    useCreateOrderStore();

  const nameRefs = useRef<Record<string, React.RefObject<TextInput>>>({});
  const modsRefs = useRef<Record<string, React.RefObject<TextInput>>>({});
  const priceRefs = useRef<Record<string, React.RefObject<TextInput>>>({});

  const getNameRef = (id: string) => {
    if (!nameRefs.current[id]) nameRefs.current[id] = { current: null };
    return nameRefs.current[id] as React.RefObject<TextInput>;
  };
  const getModsRef = (id: string) => {
    if (!modsRefs.current[id]) modsRefs.current[id] = { current: null };
    return modsRefs.current[id] as React.RefObject<TextInput>;
  };
  const getPriceRef = (id: string) => {
    if (!priceRefs.current[id]) priceRefs.current[id] = { current: null };
    return priceRefs.current[id] as React.RefObject<TextInput>;
  };

  const handleModsReturn = useCallback(
    (currentIndex: number) => {
      const nextIndex = currentIndex + 1;
      if (nextIndex < draft.items.length) {
        const nextId = draft.items[nextIndex].id;
        nameRefs.current[nextId]?.current?.focus();
      } else if (draft.items.length < MAX_ITEMS) {
        addItem();
        setTimeout(() => {
          const newId = useCreateOrderStore.getState().draft.items.at(-1)?.id;
          if (newId) nameRefs.current[newId]?.current?.focus();
        }, 50);
      }
    },
    [draft.items, addItem]
  );

  const total = draft.items.reduce((sum, item) => {
    const p = parseFloat(item.price);
    return sum + (isNaN(p) ? 0 : p);
  }, 0);

  const canAdvance = draft.items.some((i) => i.name.trim().length > 0);
  const atMax = draft.items.length >= MAX_ITEMS;

  const handleNext = () => {
    goToStep(3);
    router.push("/create/media");
  };

  const handleBack = () => {
    goToStep(1);
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={handleBack} hitSlop={12}>
          <Ionicons name="arrow-back" size={20} color={LegacyColors.ink} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerRestaurant} numberOfLines={1}>
            {draft.restaurant?.name ?? "Restaurant"}
          </Text>
          <Text style={styles.headerSub}>What did you order?</Text>
        </View>
        {total > 0 ? (
          <View style={styles.totalBadge}>
            <Text style={styles.totalBadgeText}>${total.toFixed(2)}</Text>
          </View>
        ) : (
          <View style={{ width: 38 }} />
        )}
      </View>

      <FlatList
        data={draft.items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item, index }) => (
          <View style={{ marginBottom: 10 }}>
            <ItemRow
              key={item.id}
              id={item.id}
              name={item.name}
              modifications={item.modifications}
              price={item.price}
              isPrimary={item.isPrimary}
              isOnly={draft.items.length === 1}
              onChangeName={(v) => updateItemName(item.id, v)}
              onChangeMods={(v) => updateItemMods(item.id, v)}
              onChangePrice={(v) => updateItemPrice(item.id, v)}
              onRemove={() => removeItem(item.id)}
              onModsReturn={() => handleModsReturn(index)}
              nameRef={getNameRef(item.id)}
              modsRef={getModsRef(item.id)}
              priceRef={getPriceRef(item.id)}
            />
          </View>
        )}
        ListHeaderComponent={
          <Text style={styles.sectionHint}>
            Add item name, price, and any modifications.
          </Text>
        }
        ListFooterComponent={
          !atMax ? (
            <Pressable
              style={({ pressed }) => [styles.addBtn, pressed && styles.addBtnPressed]}
              onPress={() => {
                addItem();
                setTimeout(() => {
                  const newId = useCreateOrderStore.getState().draft.items.at(-1)?.id;
                  if (newId) nameRefs.current[newId]?.current?.focus();
                }, 50);
              }}
            >
              <Ionicons name="add" size={18} color={LegacyColors.accent} />
              <Text style={styles.addBtnText}>Add item</Text>
            </Pressable>
          ) : (
            <Text style={styles.maxNote}>Maximum {MAX_ITEMS} items</Text>
          )
        }
      />

      <View style={styles.footer}>
        {total > 0 && (
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Order Total</Text>
            <Text style={styles.totalAmount}>${total.toFixed(2)}</Text>
          </View>
        )}
        <Pressable
          style={[styles.nextBtn, !canAdvance && styles.nextBtnDisabled]}
          onPress={handleNext}
          disabled={!canAdvance}
        >
          <Text style={styles.nextBtnText}>Next: Media</Text>
          <Ionicons name="arrow-forward" size={18} color={LegacyColors.white} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: LegacyColors.surface },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 13, backgroundColor: LegacyColors.card, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: LegacyColors.border, gap: 10 },
  backBtn: { width: 38, height: 38, borderRadius: 10, backgroundColor: LegacyColors.surface, borderWidth: 1, borderColor: LegacyColors.border, alignItems: "center", justifyContent: "center" },
  headerCenter: { flex: 1 },
  headerRestaurant: { fontSize: 15, fontWeight: "700", color: LegacyColors.ink },
  headerSub: { fontSize: 12, color: LegacyColors.inkSecondary, marginTop: 1 },
  totalBadge: { backgroundColor: LegacyColors.accentLight, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  totalBadgeText: { fontSize: 13, fontWeight: "700", color: LegacyColors.accent },
  list: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 24 },
  sectionHint: { fontSize: 12, color: LegacyColors.inkSecondary, marginBottom: 12, textAlign: "center" },
  addBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 13, borderRadius: 12, borderWidth: 1.5, borderColor: LegacyColors.accentLight, borderStyle: "dashed", marginTop: 4 },
  addBtnPressed: { backgroundColor: LegacyColors.accentLight },
  addBtnText: { fontSize: 14, fontWeight: "600", color: LegacyColors.accent },
  maxNote: { textAlign: "center", fontSize: 12, color: LegacyColors.inkDisabled, marginTop: 8 },
  footer: { padding: 16, paddingBottom: Platform.OS === "ios" ? 32 : 16, backgroundColor: LegacyColors.card, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: LegacyColors.border, gap: 10 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 4 },
  totalLabel: { fontSize: 14, color: LegacyColors.inkSecondary, fontWeight: "600" },
  totalAmount: { fontSize: 18, fontWeight: "800", color: LegacyColors.ink },
  nextBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", height: 54, backgroundColor: LegacyColors.accent, borderRadius: 14, gap: 8, shadowColor: LegacyColors.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.28, shadowRadius: 8, elevation: 4 },
  nextBtnDisabled: { backgroundColor: LegacyColors.inkDisabled, shadowOpacity: 0, elevation: 0 },
  nextBtnText: { fontSize: 16, fontWeight: "700", color: LegacyColors.white },
});
