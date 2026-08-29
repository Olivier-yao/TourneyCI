import { useState } from "react";
import { Link } from "expo-router";
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/Button";
import { GoogleButton } from "@/components/GoogleButton";
import { TextField } from "@/components/TextField";
import { theme } from "@/theme";

export default function SignInScreen() {
  const { connexion, connexionGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [enCoursGoogle, setEnCoursGoogle] = useState(false);

  async function soumettre() {
    setErreur(null);
    setEnCours(true);
    const resultat = await connexion(email.trim(), motDePasse);
    setEnCours(false);
    if (!resultat.ok) setErreur(resultat.erreur);
  }

  async function soumettreGoogle() {
    setErreur(null);
    setEnCoursGoogle(true);
    const resultat = await connexionGoogle();
    setEnCoursGoogle(false);
    if (!resultat.ok && resultat.erreur) setErreur(resultat.erreur);
  }

  return (
    <KeyboardAvoidingView style={styles.ecran} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Text style={styles.titre}>Tourney</Text>
      <Text style={styles.sousTitre}>Connexion</Text>

      <GoogleButton onPress={soumettreGoogle} chargement={enCoursGoogle} />

      <View style={styles.separateur}>
        <View style={styles.trait} />
        <Text style={styles.separateurTexte}>ou</Text>
        <View style={styles.trait} />
      </View>

      <TextField placeholder="Email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
      <TextField placeholder="Mot de passe" secureTextEntry value={motDePasse} onChangeText={setMotDePasse} erreur={erreur ?? undefined} />

      <Button disabled={enCours || !email || !motDePasse} onPress={soumettre}>{enCours ? "Connexion…" : "Se connecter"}</Button>

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
  separateur: { flexDirection: "row", alignItems: "center", gap: 10, marginVertical: 4 },
  trait: { flex: 1, height: 1, backgroundColor: theme.color.border },
  separateurTexte: { color: theme.color.muted, fontSize: 12 },
  lien: { marginTop: 18, alignSelf: "center" },
  lienTexte: { color: theme.color.muted, fontSize: 13 },
});
