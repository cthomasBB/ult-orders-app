import { Stack, usePathname } from "expo-router";
import { Animated, Platform, StyleSheet, Text, View, useRef } from "react-native";
import { useEffect, useRef as useReactRef } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { LegacyColors } from "@/constants/colors";
import { useCreateOrderStore } from "@/features/orders/createOrderStore";

const STEPS = [
  { n: 1, label: "Restaurant" },
  { n: 2, label: "Items"      },
  { n: 3, label: "Media"      },
  { n: 4, label: "Details"    },
  { n: 5, label: "Preview"    },
];

function ProgressBar({ step }: { step: number }) {
  const pct = (step / 5) * 100;
  const anim = useReactRef(new Animated.Value(pct)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: pct,
      tension: 60,
      friction: 12,
      useNativeDriver: false,
    }).start();
  }, [pct]);

  return (
    <View style={barStyles.wrap}>
      {/* Track */}
      <View style={barStyles.track}>
        <Animated.View
          style={[
            barStyles.fill,
            { width: anim.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] }) },
          ]}
        />
      </View>
      {/* Step labels */}
      <View style={barStyles.labels}>
        {STEPS.map((s) => (
          <View key={s.n} style={barStyles.labelItem}>
            <View style={[barStyles.dot, step >= s.n && barStyles.dotDone]} />
            <Text
              style={[
                barStyles.labelText,
                step === s.n && barStyles.labelActive,
                step > s.n && barStyles.labelDone,
              ]}
            >
              {s.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const barStyles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    backgroundColor: LegacyColors.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: LegacyColors.border,
  },
  track: {
    height: 3,
    backgroundColor: LegacyColors.border,
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 10,
  },
  fill: {
    height: "100%",
    backgroundColor: LegacyColors.accent,
    borderRadius: 2,
  },
  labels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  labelItem: { alignItems: "center", gap: 3 },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: LegacyColors.border,
  },
  dotDone: { backgroundColor: LegacyColors.accent },
  labelText: {
    fontSize: 9,
    fontWeight: "600",
    color: LegacyColors.inkDisabled,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  labelActive: { color: LegacyColors.accent },
  labelDone:   { color: LegacyColors.inkSecondary },
});

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function CreateLayout() {
  const step = useCreateOrderStore((s) => s.draft.step);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ProgressBar step={step} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: LegacyColors.surface },
          animation: "slide_from_right",
          gestureEnabled: false, // nav handled by store
        }}
      >
        <Stack.Screen name="restaurant" />
        <Stack.Screen name="items"      />
        <Stack.Screen name="media"      />
        <Stack.Screen name="details"    />
        <Stack.Screen name="preview"    />
        {/* Legacy entry screens */}
        <Stack.Screen name="index"         />
        <Stack.Screen name="step-1-restaurant" />
        <Stack.Screen name="step-2-items"      />
        <Stack.Screen name="step-3-delivery"   />
        <Stack.Screen name="step-4-review"     />
        <Stack.Screen name="step-5-confirm"    />
      </Stack>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: LegacyColors.surface },
});
