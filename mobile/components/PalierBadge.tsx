import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "@/theme";
import type { DefinitionPalier } from "@/lib/palier";

/** Approximation de src/components/ds/Palier.tsx (BadgePalier) : mêmes
 * couleurs escaladant par palier (cf. skinPalier), carré arrondi plutôt
 * que l'hexagone en clip-path, une seule icône (pas une par palier) —
 * même compromis que EquipeBadge (pas de dépendance SVG ajoutée). */
const SKINS: { bg: string; border: string; couleur: string }[] = [
  { bg: "transparent", border: theme.color.border, couleur: theme.color.muted },
  { bg: theme.color.surface2, border: theme.color.border, couleur: theme.color.textMuted },
  { bg: theme.color.accent900, border: theme.color.accent700, couleur: theme.color.accent300 },
  { bg: theme.color.accent800, border: theme.color.accent700, couleur: theme.color.accent300 },
  { bg: theme.color.accent800, border: theme.color.accent, couleur: theme.color.accent300 },
  { bg: theme.color.accent700, border: theme.color.accent, couleur: theme.color.accent100 },
];

export function PalierBadge({ palier, taille = 32 }: { palier: DefinitionPalier; taille?: number }) {
  const skin = SKINS[palier.id] ?? SKINS[0];
  return (
    <View style={[styles.badge, { width: taille, height: taille * 1.1, backgroundColor: skin.bg, borderColor: skin.border, borderRadius: theme.radius.sm }]}>
      <Ionicons name={palier.id >= 5 ? "trophy" : "shield"} size={taille * 0.5} color={skin.couleur} />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { borderWidth: 1, alignItems: "center", justifyContent: "center" },
});
