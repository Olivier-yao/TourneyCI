import { Pressable, Text, StyleSheet, type PressableProps } from "react-native";
import { theme } from "@/theme";

type Variante = "primary" | "secondary" | "ghost";

/** Port de src/components/ds/Button.tsx (variantes primary/secondary/ghost
 * du thème Nocturne) — mêmes couleurs/rayons, pour un rendu visuellement
 * identique au site web sur les mêmes écrans. */
const stylesParVariante: Record<Variante, { bg: string; border: string; couleur: string }> = {
  primary: { bg: "transparent", border: theme.color.accent, couleur: theme.color.accent300 },
  secondary: { bg: "transparent", border: theme.color.border, couleur: theme.color.muted },
  ghost: { bg: "transparent", border: "transparent", couleur: theme.color.accent },
};

type ButtonProps = Omit<PressableProps, "style"> & {
  variante?: Variante;
  children: string;
};

export function Button({ variante = "primary", disabled, children, ...props }: ButtonProps) {
  const skin = stylesParVariante[variante];
  return (
    <Pressable
      {...props}
      disabled={disabled}
      style={({ pressed }) => [
        styles.bouton,
        { backgroundColor: skin.bg, borderColor: skin.border },
        disabled && styles.desactive,
        pressed && !disabled && styles.presse,
      ]}
    >
      <Text style={[styles.texte, { color: skin.couleur }]}>{children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bouton: {
    height: 46,
    borderWidth: 1,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  presse: { transform: [{ scale: 0.96 }] },
  desactive: { opacity: 0.45 },
  texte: { fontSize: 15, fontWeight: "500" },
});
