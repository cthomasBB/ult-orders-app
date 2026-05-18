import { StyleSheet, Text, TextInput, type TextInputProps, View } from "react-native";
import { Colors } from "@/constants/colors";

type Props = TextInputProps & {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
};

export function Input({ label, error, hint, leftIcon, rightIcon, style, ...rest }: Props) {
  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.row, error ? styles.rowError : styles.rowNormal]}>
        {leftIcon && <View style={styles.icon}>{leftIcon}</View>}
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={Colors.inkDisabled}
          {...rest}
        />
        {rightIcon && <View style={styles.icon}>{rightIcon}</View>}
      </View>
      {error  && <Text style={styles.error}>{error}</Text>}
      {!error && hint && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 4 },
  label:   { fontSize: 13, fontWeight: "600", color: Colors.inkSecondary, marginBottom: 2 },
  row:     { flexDirection: "row", alignItems: "center", height: 50, borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, backgroundColor: Colors.card, gap: 8 },
  rowNormal: { borderColor: Colors.border },
  rowError:  { borderColor: Colors.danger, backgroundColor: Colors.accentLight },
  input:   { flex: 1, fontSize: 15, color: Colors.ink },
  icon:    { justifyContent: "center" },
  error:   { fontSize: 12, color: Colors.danger },
  hint:    { fontSize: 12, color: Colors.inkDisabled },
});
