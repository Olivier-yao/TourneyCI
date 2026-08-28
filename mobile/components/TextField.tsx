import { useState } from "react";
import { View, Text, TextInput, StyleSheet, Platform, type TextInputProps } from "react-native";
import { theme } from "@/theme";

/** Port de src/components/ds/Input.tsx (Field) — même fond (surface-2, pas
 * surface), police mono pour la saisie, anneau accent au focus. */
type TextFieldProps = TextInputProps & {
  label?: string;
  erreur?: string;
};

export function TextField({ label, erreur, style, onFocus, onBlur, ...props }: TextFieldProps) {
  const [focus, setFocus] = useState(false);
  return (
    <View style={styles.conteneur}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        {...props}
        placeholderTextColor={theme.color.muted}
        onFocus={(e) => {
          setFocus(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocus(false);
          onBlur?.(e);
        }}
        style={[
          styles.champ,
          { borderColor: erreur ? theme.color.danger : focus ? theme.color.accent : theme.color.border },
          focus && styles.focus,
          style,
        ]}
      />
      {erreur && <Text style={styles.erreur}>{erreur}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: { gap: 6 },
  label: { color: theme.color.muted, fontSize: 12, fontWeight: "500" },
  champ: {
    height: 44,
    paddingHorizontal: 14,
    backgroundColor: theme.color.surface2,
    borderWidth: 1,
    borderRadius: theme.radius.md,
    color: theme.color.text,
    fontSize: 14,
    fontFamily: Platform.select({ ios: "Courier", android: "monospace", default: undefined }),
  },
  focus: { borderWidth: 2 },
  erreur: { color: theme.color.danger, fontSize: 12 },
});
