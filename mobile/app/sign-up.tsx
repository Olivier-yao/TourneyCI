import { useState } from "react";
import { Link, router } from "expo-router";
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/Button";
import { GoogleButton } from "@/components/GoogleButton";
import { TextField } from "@/components/TextField";
import { theme } from "@/theme";

export default function SignUpScreen() {
  const { inscription, connexionGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [enCoursGoogle, setEnCoursGoogle] = useState(false);
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

  async function soumettreGoogle() {
    setErreur(null);
    setEnCoursGoogle(true);
    const resultat = await connexionGoogle();
    setEnCoursGoogle(false);
    if (!resultat.ok && resultat.erreur) setErreur(resultat.erreur);
  }

  if (envoye) {
    return (
      <View style={styles.ecran}>
        <Text style={styles.titre}>Compte créé</Text>
        <Text style={styles.sousTitre}>Vérifie ta boîte mail pour confirmer ton adresse, puis connecte-toi.</Text>
        <Button onPress={() => router.replace("/sign-in")}>Aller à la connexion</Button>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.ecran} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Text style={styles.titre}>Tourney</Text>
      <Text style={styles.sousTitre}>Créer un compte</Text>

      <GoogleButton onPress={soumettreGoogle} chargement={enCoursGoogle} />

      <View style={styles.separateur}>
        <View style={styles.trait} />
        <Text style={styles.separateurTexte}>ou</Text>
        <View style={styles.trait} />
      </View>

      <TextField placeholder="Email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
      <TextField placeholder="Mot de passe" secureTextEntry value={motDePasse} onChangeText={setMotDePasse} erreur={erreur ?? undefined} />

      <Button disabled={enCours || !email || !motDePasse} onPress={soumettre}>{enCours ? "Création…" : "S'inscrire"}</Button>

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
  separateur: { flexDirection: "row", alignItems: "center", gap: 10, marginVertical: 4 },
  trait: { flex: 1, height: 1, backgroundColor: theme.color.border },
  separateurTexte: { color: theme.color.muted, fontSize: 12 },
  lien: { marginTop: 18, alignSelf: "center" },
  lienTexte: { color: theme.color.muted, fontSize: 13 },
});
