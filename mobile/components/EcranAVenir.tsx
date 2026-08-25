import { View, Text, StyleSheet } from "react-native";
import { theme } from "@/theme";

/** Placeholder partagé par les onglets non encore construits dans cet
 * incrément (Fondations) — Tournois/Organisateur/Classement/Profil restent
 * hors scope tant qu'une étape dédiée n'est pas confirmée, cf. CLAUDE.md
 * racine ("ne jamais anticiper une étape future"). */
export function EcranAVenir({ titre }: { titre: string }) {
  return (
    <View style={styles.ecran}>
      <Text style={styles.titre}>{titre}</Text>
      <Text style={styles.texte}>Bientôt disponible.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: theme.color.bg, alignItems: "center", justifyContent: "center", gap: 6 },
  titre: { color: theme.color.text, fontSize: 18, fontWeight: "600" },
  texte: { color: theme.color.textMuted, fontSize: 14 },
});
