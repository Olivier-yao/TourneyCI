import { useState } from "react";
import { Link } from "expo-router";
import { View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { useAuth } from "@/lib/auth";
import { theme } from "@/theme";

export default function SignInScreen() {
  const { connexion } = useAuth();
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function soumettre() {
    setErreur(null);
    setEnCours(true);
    const resultat = await connexion(email.trim(), motDePasse);
    setEnCours(false);
    if (!resultat.ok) setErreur(resultat.erreur);
  }

  return (
    <KeyboardAvoidingView style={styles.ecran} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Text style={styles.titre}>Tourney</Text>
      <Text style={styles.sousTitre}>Connexion</Text>

      <TextInput
        style={styles.champ}
        placeholder="Email"
        placeholderTextColor={theme.color.muted}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.champ}
        placeholder="Mot de passe"
        placeholderTextColor={theme.color.muted}
        secureTextEntry
        value={motDePasse}
        onChangeText={setMotDePasse}
      />

      {erreur && <Text style={styles.erreur}>{erreur}</Text>}

      <Pressable style={styles.bouton} onPress={soumettre} disabled={enCours || !email || !motDePasse}>
        <Text style={styles.boutonTexte}>{enCours ? "Connexion…" : "Se connecter"}</Text>
      </Pressable>

      <Link href="/sign-up" style={styles.lien}>
        <Text style={styles.lienTexte}>Pas encore de compte ? Inscris-toi</Text>
      </Link>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: theme.color.bg, padding: 24, justifyContent: "center", gap: 12 },
  titre: { color: theme.color.accent300, fontSize: 28, fontWeight: "700", textAlign: "center" },
  sousTitre: { color: theme.color.textMuted, fontSize: 15, textAlign: "center", marginBottom: 20 },
  champ: {
    backgroundColor: theme.color.surface,
    borderWidth: 1,
    borderColor: theme.color.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: theme.color.text,
    fontSize: 15,
  },
  erreur: { color: theme.color.danger, fontSize: 13 },
  bouton: {
    marginTop: 8,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: theme.color.accent,
    borderRadius: theme.radius.md,
    paddingVertical: 13,
    alignItems: "center",
  },
  boutonTexte: { color: theme.color.accent300, fontSize: 15, fontWeight: "600" },
  lien: { marginTop: 18, alignSelf: "center" },
  lienTexte: { color: theme.color.muted, fontSize: 13 },
});
