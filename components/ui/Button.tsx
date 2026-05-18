import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { Colors } from "@/constants/colors";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ButtonVariant = "primary" | "secondary" | "ghost" | "save" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = Omit<PressableProps, "style"> & {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  /** Icon node rendered to the left of the label */
  leftIcon?: React.ReactNode;
  /** Icon node rendered to the right of the label */
  rightIcon?: React.ReactNode;
  /** Full-width block button */
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
};

// ─── Design tokens per variant ────────────────────────────────────────────────

const BG: Record<ButtonVariant, string> = {
  primary:   Colors.accent,
  secondary: Colors.surface,
  ghost:     Colors.transparent,
  save:      Colors.saveGreen,
  danger:    Colors.danger,
};

const PRESSED_BG: Record<ButtonVariant, string> = {
  primary:   Colors.accentDark,
  secondary: Colors.border,
  ghost:     Colors.accentLight,
  save:      "#3a6347",
  danger:    "#9B1B1B",
};

const TEXT_COLOR: Record<ButtonVariant, string> = {
  primary:   Colors.white,
  secondary: Colors.ink,
  ghost:     Colors.accent,
  save:      Colors.white,
  danger:    Colors.white,
};

const BORDER_COLOR: Record<ButtonVariant, string | undefined> = {
  primary:   undefined,
  secondary: Colors.border,
  ghost:     Colors.accent,
  save:      undefined,
  danger:    undefined,
};

const HEIGHT: Record<ButtonSize, number> = { sm: 36, md: 48, lg: 56 };
const RADIUS: Record<ButtonSize, number> = { sm: 8,  md: 10, lg: 14 };
const FONT:   Record<ButtonSize, number> = { sm: 13, md: 15, lg: 17 };
const PX:     Record<ButtonSize, number> = { sm: 14, md: 18, lg: 22 };

// ─── Component ────────────────────────────────────────────────────────────────

export function Button({
  label,
  variant = "primary",
  size = "md",
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  style,
  disabled,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || isLoading;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        {
          height: HEIGHT[size],
          borderRadius: RADIUS[size],
          paddingHorizontal: PX[size],
          backgroundColor: pressed && !isDisabled ? PRESSED_BG[variant] : BG[variant],
          borderWidth: BORDER_COLOR[variant] ? 1.5 : 0,
          borderColor: BORDER_COLOR[variant],
          opacity: isDisabled ? 0.5 : 1,
          alignSelf: fullWidth ? "stretch" : "flex-start",
        },
        style,
      ]}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      {...rest}
    >
      {isLoading ? (
        <ActivityIndicator
          size="small"
          color={TEXT_COLOR[variant]}
        />
      ) : (
        <>
          {leftIcon}
          <Text
            style={[
              styles.label,
              { color: TEXT_COLOR[variant], fontSize: FONT[size] },
            ]}
            numberOfLines={1}
          >
            {label}
          </Text>
          {rightIcon}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  label: {
    fontWeight: "700",
    letterSpacing: 0.1,
  },
});
