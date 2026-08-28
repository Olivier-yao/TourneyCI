import { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { inscrire } from "@/lib/tournois";
import { soldeTourneyCard } from "@/lib/wallet";
import { formatXof } from "@/lib/format";
import { AppBar } from "@/components/AppBar";
import { Button } from "@/components/Button";
import { theme } from "@/theme";

/** Paiement d'inscription via TourneyCard (portefeuille interne) —
 * même flux que src/app/paiement/[id]/FluxPaiement.tsx côté web : aucun
 * Mobile Money réel, juste un débit atomique du solde interne fait par
 * l'API au moment de l'inscription. Le rechargement de la carte (lui-même
 * simulé côté web) reste hors scope mobile pour l'instant — un solde
 * insuffisant renvoie donc vers le site web plutôt que de dupliquer cet
 * écran ici. */
export default function PaiementScreen() {
  const { id, tag, equipe, montant: montantBrut } = useLocalSearchParams<{ id: string; tag?: string; equipe?: string; montant: string }>();
  const montant = Number(montantBrut);
  const [solde, setSolde] = useState<number | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState(false);

  useEffect(() => {
    soldeTourneyCard().then(setSolde);
  }, []);

  async function payer() {
    setErreur(null);
    setEnCours(true);
    const resultat = await inscrire(id, { tag, equipe, montant });
    setEnCours(false);
    if (!resultat.ok) {
      setErreur(resultat.erreur);
      return;
    }
    setSucces(true);
  }

  if (succes) {
    return (
      <View style={styles.centre}>
        <Ionicons name="checkmark-circle" size={48} color={theme.color.accent300} />
        <Text style={styles.titre}>Inscription confirmée</Text>
        <Button onPress={() => router.replace("/")}>Retour à l'accueil</Button>
      </View>
    );
  }

  return (
    <View style={styles.ecran}>
      <AppBar titre="Paiement" />
      <View style={styles.contenu}>
        <Text style={styles.montant}>{formatXof(montant)}</Text>
        <Text style={styles.texteMuted}>Frais d'inscription</Text>

        {solde === null ? (
          <ActivityIndicator color={theme.color.accent300} />
        ) : solde < montant ? (
          <View style={styles.bloc}>
            <Text style={styles.texte}>
              Solde TourneyCard insuffisant ({formatXof(solde)} disponible).
            </Text>
            <Text style={styles.texteMuted}>
              Recharge ta carte depuis le site web (Profil → Solde) pour l'instant, puis reviens t'inscrire.
            </Text>
          </View>
        ) : (
          <View style={styles.bloc}>
            <Text style={styles.texteMuted}>Solde TourneyCard : {formatXof(solde)}</Text>
            {erreur && <Text style={styles.erreur}>{erreur}</Text>}
            <Button disabled={enCours} onPress={payer}>{enCours ? "Paiement..." : `Payer ${formatXof(montant)}`}</Button>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: theme.color.bg },
  centre: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14, backgroundColor: theme.color.bg, padding: 24 },
  contenu: { padding: 20, gap: 6 },
  montant: { color: theme.color.text, fontSize: 32, fontWeight: "700" },
  titre: { color: theme.color.text, fontSize: 18, fontWeight: "600" },
  texte: { color: theme.color.text, fontSize: 14, lineHeight: 20 },
  texteMuted: { color: theme.color.textMuted, fontSize: 13 },
  erreur: { color: theme.color.danger, fontSize: 13 },
  bloc: { marginTop: 16, gap: 10 },
});
