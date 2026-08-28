import { View, Text, StyleSheet } from "react-native";
import { theme } from "@/theme";

/** Approximation de src/components/ds/Palier.tsx (EcussonEquipe) : mêmes
 * couleurs par style, carré arrondi plutôt que l'hexagone découpé en
 * clip-path (pas de dépendance SVG pour un seul badge décoratif). */
type Style = "accent" | "neutre";

const skins: Record<Style, { bg: string; border: string; couleur: string }> = {
  accent: { bg: theme.color.accent800, border: theme.color.accent, couleur: theme.color.accent300 },
  neutre: { bg: theme.color.surface2, border: theme.color.border, couleur: theme.color.muted },
};

export function EquipeBadge({ initiales, style = "neutre", taille = 40 }: { initiales: string; style?: Style; taille?: number }) {
  const skin = skins[style];
  return (
    <View
      style={[
        styles.badge,
        { width: taille, height: taille, backgroundColor: skin.bg, borderColor: skin.border, borderRadius: theme.radius.md },
      ]}
    >
      <Text style={[styles.texte, { color: skin.couleur, fontSize: taille * 0.3 }]}>{initiales}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { borderWidth: 1, alignItems: "center", justifyContent: "center" },
  texte: { fontWeight: "700" },
});
