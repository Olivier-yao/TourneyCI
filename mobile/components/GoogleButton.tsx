import { Pressable, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "@/theme";

/** Port de src/components/ds/BoutonGoogle.tsx — logo simplifié (Ionicons
 * logo-google) plutôt que le SVG 4 couleurs du web, pour éviter une
 * dépendance react-native-svg supplémentaire pour un seul icône. */
export function GoogleButton({ onPress, chargement = false }: { onPress: () => void; chargement?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={chargement}
      style={({ pressed }) => [styles.bouton, chargement && styles.desactive, pressed && !chargement && styles.presse]}
    >
      {chargement ? (
        <Text style={styles.texte}>Connexion...</Text>
      ) : (
        <>
          <Ionicons name="logo-google" size={18} color={theme.color.text} />
          <Text style={styles.texte}>Continuer avec Google</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bouton: {
    height: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: theme.color.border,
    borderRadius: theme.radius.md,
    backgroundColor: theme.color.surface,
  },
  presse: { transform: [{ scale: 0.96 }] },
  desactive: { opacity: 0.6 },
  texte: { color: theme.color.text, fontSize: 15, fontWeight: "500" },
});
