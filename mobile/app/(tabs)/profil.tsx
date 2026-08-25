import { View, Text, Pressable, StyleSheet } from "react-native";
import { useAuth } from "@/lib/auth";
import { theme } from "@/theme";

/** Onglet Profil hors scope pour cet incrément (Fondations) — seul le
 * bouton de déconnexion est réel, nécessaire pour tester le flux d'auth
 * de bout en bout sans réinstaller l'app. */
export default function ProfilScreen() {
  const { session, deconnexion } = useAuth();

  return (
    <View style={styles.ecran}>
      <Text style={styles.titre}>Profil</Text>
      <Text style={styles.email}>{session?.user.email}</Text>
      <Text style={styles.texte}>Bientôt disponible.</Text>
      <Pressable style={styles.bouton} onPress={deconnexion}>
        <Text style={styles.boutonTexte}>Se déconnecter</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: theme.color.bg, alignItems: "center", justifyContent: "center", gap: 6, padding: 24 },
  titre: { color: theme.color.text, fontSize: 18, fontWeight: "600" },
  email: { color: theme.color.accent300, fontSize: 13 },
  texte: { color: theme.color.textMuted, fontSize: 14, marginBottom: 16 },
  bouton: {
    borderWidth: 1,
    borderColor: theme.color.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: 20,
    paddingVertical: 11,
  },
  boutonTexte: { color: theme.color.text, fontSize: 14 },
});
