/**
 * ULT Orders — brand design tokens
 */
export const LegacyColors = {
  // Primary brand
  accent: "#C8472B",      // ember red — CTAs, active states
  accentLight: "#F5E9E6", // ember red tint — hover / pressed backgrounds
  accentDark: "#A0361E",  // ember red shade — pressed state

  // Semantic
  saveGreen: "#4A7C59",   // saved / bookmarked state
  saveGreenLight: "#EAF2EC",
  triedPurple: "#6B4FA0", // tried-it state

  // Neutrals
  surface: "#F9F9F8",     // app background
  card: "#FFFFFF",        // card / sheet background
  border: "#EBEBEA",      // dividers, outlines
  borderStrong: "#D4D4D2",

  // Text
  ink: "#111111",         // primary text
  inkSecondary: "#6B6B6B",// secondary / meta text
  inkDisabled: "#ABABAB", // disabled text

  // Status
  success: "#2E7D32",
  warning: "#F57C00",
  danger: "#C62828",

  // Misc
  white: "#FFFFFF",
  black: "#000000",
  transparent: "transparent",

  // Status level ring colors
  ringGold: "#C9A84C",      // Regular + Curator gold ring
  ringGoldLight: "#E8C96E", // Curator outer ring (lighter)
  confettiAmber: "#F59E0B",
  confettiBlue: "#3B82F6",
  // Tab bar
  tabActive: "#C8472B",
  tabInactive: "#ABABAB",
  tabBar: "#FFFFFF",
  tabBarBorder: "#EBEBEA",
} as const;

export type ColorKey = keyof typeof LegacyColors;
