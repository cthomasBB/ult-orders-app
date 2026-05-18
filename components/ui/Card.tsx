import {
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { Colors } from "@/constants/colors";

// ─── Types ────────────────────────────────────────────────────────────────────

export type CardVariant = "default" | "outlined" | "flat" | "accent";

export type CardProps = {
  children: React.ReactNode;
  variant?: CardVariant;
  /** Horizontal + vertical inner padding (default 16) */
  padding?: number;
  /** Border radius (default 16) */
  radius?: number;
  style?: StyleProp<ViewStyle>;
};

export type PressableCardProps = CardProps &
  Omit<PressableProps, "style" | "children"> & {
    /** When true the card becomes a Pressable with press feedback */
    onPress: () => void;
  };

// ─── Design tokens per variant ────────────────────────────────────────────────

const BG: Record<CardVariant, string> = {
  default:  Colors.card,
  outlined: Colors.card,
  flat:     Colors.surface,
  accent:   Colors.accentLight,
};

const BORDER_WIDTH: Record<CardVariant, number> = {
  default:  0,
  outlined: 1.5,
  flat:     0,
  accent:   0,
};

const BORDER_COLOR: Record<CardVariant, string> = {
  default:  Colors.transparent,
  outlined: Colors.border,
  flat:     Colors.transparent,
  accent:   Colors.accentLight,
};

// Shadow tokens (iOS)
const SHADOW = {
  default: {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  flat: {
    shadowColor: Colors.transparent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
};

// ─── Base card (non-pressable) ────────────────────────────────────────────────

export function Card({
  children,
  variant = "default",
  padding = 16,
  radius = 16,
  style,
}: CardProps) {
  const shadow = variant === "flat" ? SHADOW.flat : SHADOW.default;

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: BG[variant],
          borderWidth: BORDER_WIDTH[variant],
          borderColor: BORDER_COLOR[variant],
          borderRadius: radius,
          padding,
          ...shadow,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

// ─── Pressable card ───────────────────────────────────────────────────────────

export function PressableCard({
  children,
  variant = "default",
  padding = 16,
  radius = 16,
  style,
  onPress,
  disabled,
  ...rest
}: PressableCardProps) {
  const shadow = variant === "flat" ? SHADOW.flat : SHADOW.default;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: pressed ? Colors.surface : BG[variant],
          borderWidth: BORDER_WIDTH[variant],
          borderColor: BORDER_COLOR[variant],
          borderRadius: radius,
          padding,
          opacity: disabled ? 0.5 : 1,
          transform: [{ scale: pressed ? 0.985 : 1 }],
          ...shadow,
        },
        style,
      ]}
      accessibilityRole="button"
      {...rest}
    >
      {children}
    </Pressable>
  );
}

// ─── Card sub-components ──────────────────────────────────────────────────────

/** Full-width horizontal divider for use inside a Card */
export function CardDivider({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[dividerStyles.line, style]} />;
}

/** A row that stretches edge-to-edge and neutralises the card's padding */
export function CardFullBleed({
  children,
  horizontalPadding = 16,
  style,
}: {
  children: React.ReactNode;
  horizontalPadding?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      style={[
        { marginHorizontal: -horizontalPadding },
        style,
      ]}
    >
      {children}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  base: {
    overflow: "hidden",
  },
});

const dividerStyles = StyleSheet.create({
  line: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
    marginVertical: 12,
  },
});
