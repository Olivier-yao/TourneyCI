import { useState } from "react";
import { Link } from "expo-router";
import { View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { useAuth } from "@/lib/auth";
import { theme } from "@/theme";

export default function SignUpScreen() {
  const { inscription } = useAuth();
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [envoye, setEnvoye] = useState(false);

  async function soumettre() {
    setErreur(null);
    setEnCours(true);
    const resultat = await inscription(email.trim(), motDePasse);
    setEnCours(false);
    if (!resultat.ok) {
      setErreur(resultat.erreur);
      return;
    }
    setEnvoye(true);
  }

  if (envoye) {
    return (
      <View style={styles.ecran}>
        <Text style={styles.titre}>Compte créé</Text>
        <Text style={styles.sousTitre}>Vérifie ta boîte mail pour confirmer ton adresse, puis connecte-toi.</Text>
        <Link href="/sign-in" style={styles.bouton}>
          <Text style={styles.boutonTexte}>Aller à la connexion</Text>
        </Link>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.ecran} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Text style={styles.titre}>Tourney</Text>
      <Text style={styles.sousTitre}>Créer un compte</Text>

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
        <Text style={styles.boutonTexte}>{enCours ? "Création…" : "S'inscrire"}</Text>
      </Pressable>

      <Link href="/sign-in" style={styles.lien}>
        <Text style={styles.lienTexte}>Déjà un compte ? Connecte-toi</Text>
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
