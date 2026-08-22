import { Stack } from "expo-router";
import { LegacyColors } from "@/constants/colors";

/**
 * Auth group layout.
 * Pure Stack navigator — no tab bar.
 * Screens: welcome → signup / login → onboarding/taste-tags → onboarding/follow-suggestions
 */
export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: LegacyColors.surface },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="welcome" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="login" />
      <Stack.Screen
        name="forgot-password"
        options={{
          presentation: "modal",
          animation: "slide_from_bottom",
        }}
      />
      {/* Onboarding sub-group rendered inline in the same stack */}
      <Stack.Screen name="onboarding/taste-tags" />
      <Stack.Screen
        name="onboarding/follow-suggestions"
        options={{ gestureEnabled: false }} // prevent swipe-back mid-onboarding
      />
    </Stack>
  );
}
