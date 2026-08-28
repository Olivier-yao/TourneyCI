import { useCallback, useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TextInput, Pressable } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  tournoiParId,
  mesInscriptions,
  inscrire,
  cashPrizeAffiche,
  cashPrizeEstEstime,
  inscriptionsFermees,
  type Tournoi,
  type InscriptionResume,
} from "@/lib/tournois";
import { formatXof } from "@/lib/format";
import { AppBar } from "@/components/AppBar";
import { theme } from "@/theme";

type EtapeInscription = "repos" | "tag" | "confirmation";

/** Détail d'un tournoi + inscription — scope volontairement limité au 1v1
 * solo pour ce premier incrément (cf. exploration du flux web,
 * CtaInscription.tsx) : équipes/battle royale ont un flux de constitution
 * d'équipe bien plus riche, traité comme une étape séparée à confirmer. */
export default function TournoiDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [tournoi, setTournoi] = useState<Tournoi | null | undefined>(undefined);
  const [monInscription, setMonInscription] = useState<InscriptionResume | undefined>(undefined);
  const [etape, setEtape] = useState<EtapeInscription>("repos");
  const [tag, setTag] = useState("");
  const [presenceAcceptee, setPresenceAcceptee] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const charger = useCallback(async () => {
    const [t, inscriptions] = await Promise.all([tournoiParId(id), mesInscriptions()]);
    setTournoi(t ?? null);
    setMonInscription(inscriptions.find((i) => i.tournoiId === id));
  }, [id]);

  useEffect(() => {
    charger();
  }, [charger]);

  async function confirmer() {
    if (!tournoi) return;
    setErreur(null);
    if (tournoi.fraisXof > 0) {
      router.push({ pathname: "/tournoi/[id]/paiement", params: { id, tag, montant: String(tournoi.fraisXof) } });
      return;
    }
    setEnCours(true);
    const resultat = await inscrire(id, { tag });
    setEnCours(false);
    if (!resultat.ok) {
      setErreur(resultat.erreur);
      return;
    }
    setMonInscription({ tournoiId: id, tag: resultat.tag });
    setEtape("repos");
  }

  if (tournoi === undefined) {
    return (
      <View style={styles.centre}>
        <ActivityIndicator color={theme.color.accent300} />
      </View>
    );
  }

  if (!tournoi) {
    return (
      <View style={styles.ecran}>
        <AppBar titre="Tournoi" />
        <View style={styles.centre}>
          <Text style={styles.texteMuted}>Tournoi introuvable.</Text>
        </View>
      </View>
    );
  }

  const fermees = inscriptionsFermees(tournoi);
  const cashPrize = cashPrizeAffiche(tournoi);
  const estime = cashPrizeEstEstime(tournoi);

  return (
    <View style={styles.ecran}>
      <AppBar titre={tournoi.titre} />
      <ScrollView contentContainerStyle={styles.contenu}>
        {tournoi.annule && (
          <View style={styles.bandeauAnnule}>
            <Text style={styles.bandeauAnnuleTexte}>Tournoi annulé</Text>
          </View>
        )}

        <Text style={styles.badges}>
          {tournoi.jeuLabel} · {tournoi.format} · {tournoi.modalite === "virtuel" ? "En ligne" : tournoi.ville}
        </Text>
        <Text style={styles.titre}>{tournoi.titre}</Text>
        <Text style={styles.sousTitre}>Par {tournoi.organisateur} · {tournoi.dateLabel}</Text>

        <View style={styles.grilleStats}>
          <Stat label="Cash prize" valeur={formatXof(cashPrize)} note={estime ? "estimé" : undefined} />
          <Stat label="Frais" valeur={formatXof(tournoi.fraisXof)} />
          <Stat label="Places" valeur={`${tournoi.placesInscrites}/${tournoi.placesTotal}`} />
          <Stat label="Check-in" valeur={tournoi.checkin} />
        </View>

        {tournoi.repartitionCashPrize && tournoi.repartitionCashPrize.length > 0 && (
          <View style={styles.bloc}>
            <Text style={styles.blocTitre}>Répartition du cash prize</Text>
            {tournoi.repartitionCashPrize.map((r) => (
              <View key={r.label} style={styles.ligneRepartition}>
                <Text style={styles.texteMuted}>{r.label}</Text>
                <Text style={styles.texte}>{formatXof(r.montantXof)}</Text>
              </View>
            ))}
          </View>
        )}

        {tournoi.informations && (
          <View style={styles.bloc}>
            <Text style={styles.blocTitre}>Informations</Text>
            <Text style={styles.texte}>{tournoi.informations}</Text>
          </View>
        )}

        <View style={styles.bloc}>
          <Text style={styles.blocTitre}>Règlement</Text>
          <Text style={styles.texte}>{tournoi.reglement}</Text>
        </View>
      </ScrollView>

      <View style={styles.piedInscription}>
        {monInscription ? (
          <View style={styles.pillInscrit}>
            <Ionicons name="checkmark-circle" size={18} color={theme.color.accent300} />
            <Text style={styles.pillInscritTexte}>
              Déjà inscrit{monInscription.tag ? ` · ${monInscription.tag}` : ""}
            </Text>
          </View>
        ) : tournoi.annule || tournoi.termine || fermees ? (
          <Text style={styles.texteMuted}>Inscriptions closes.</Text>
        ) : tournoi.type !== "1v1" ? (
          <Text style={styles.texteMuted}>Inscription équipes/battle royale pas encore disponible dans l'app — utilise le site web.</Text>
        ) : etape === "repos" ? (
          <Pressable style={styles.bouton} onPress={() => setEtape("tag")}>
            <Text style={styles.boutonTexte}>S'inscrire</Text>
          </Pressable>
        ) : etape === "tag" ? (
          <View style={styles.formulaire}>
            <Text style={styles.texteMuted}>Indique ton TAG exact sur {tournoi.jeuLabel}</Text>
            <TextInput
              style={styles.champ}
              placeholder="TAG"
              placeholderTextColor={theme.color.muted}
              value={tag}
              onChangeText={setTag}
              autoCapitalize="none"
            />
            <Pressable style={[styles.bouton, !tag.trim() && styles.boutonDesactive]} disabled={!tag.trim()} onPress={() => setEtape("confirmation")}>
              <Text style={styles.boutonTexte}>Continuer</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.formulaire}>
            <Text style={styles.texte}>
              {tournoi.titre} · TAG {tag} · {tournoi.fraisXof > 0 ? formatXof(tournoi.fraisXof) : "Inscription gratuite"}
            </Text>
            <Pressable style={styles.ligneCase} onPress={() => setPresenceAcceptee((v) => !v)}>
              <Ionicons name={presenceAcceptee ? "checkbox" : "square-outline"} size={20} color={theme.color.accent300} />
              <Text style={styles.texteCase}>
                Je comprends qu'une fois inscrit, ma présence au tournoi est obligatoire.
              </Text>
            </Pressable>
            {erreur && <Text style={styles.erreur}>{erreur}</Text>}
            <Pressable style={[styles.bouton, (!presenceAcceptee || enCours) && styles.boutonDesactive]} disabled={!presenceAcceptee || enCours} onPress={confirmer}>
              <Text style={styles.boutonTexte}>{enCours ? "Inscription..." : "Confirmer"}</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

function Stat({ label, valeur, note }: { label: string; valeur: string; note?: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValeur}>{valeur}</Text>
      <Text style={styles.statLabel}>{label}{note ? ` (${note})` : ""}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: theme.color.bg },
  centre: { flex: 1, alignItems: "center", justifyContent: "center" },
  contenu: { padding: 16, paddingBottom: 24, gap: 14 },
  bandeauAnnule: { backgroundColor: theme.color.danger, borderRadius: theme.radius.md, padding: 10 },
  bandeauAnnuleTexte: { color: "#fff", fontWeight: "600", textAlign: "center" },
  badges: { color: theme.color.muted, fontSize: 12, textTransform: "uppercase", letterSpacing: 0.4 },
  titre: { color: theme.color.text, fontSize: 22, fontWeight: "700" },
  sousTitre: { color: theme.color.textMuted, fontSize: 13 },
  grilleStats: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  stat: {
    flexBasis: "48%",
    flexGrow: 1,
    backgroundColor: theme.color.surface,
    borderWidth: 1,
    borderColor: theme.color.border,
    borderRadius: theme.radius.md,
    padding: 12,
    gap: 2,
  },
  statValeur: { color: theme.color.accent300, fontSize: 16, fontWeight: "700" },
  statLabel: { color: theme.color.muted, fontSize: 11 },
  bloc: { gap: 6 },
  blocTitre: { color: theme.color.text, fontSize: 14, fontWeight: "600" },
  texte: { color: theme.color.text, fontSize: 13, lineHeight: 19 },
  texteMuted: { color: theme.color.textMuted, fontSize: 13 },
  ligneRepartition: { flexDirection: "row", justifyContent: "space-between" },
  piedInscription: {
    borderTopWidth: 1,
    borderTopColor: theme.color.border,
    backgroundColor: theme.color.bg,
    padding: 14,
    gap: 10,
  },
  pillInscrit: { flexDirection: "row", alignItems: "center", gap: 8, justifyContent: "center" },
  pillInscritTexte: { color: theme.color.accent300, fontSize: 14, fontWeight: "600" },
  formulaire: { gap: 10 },
  champ: {
    backgroundColor: theme.color.surface,
    borderWidth: 1,
    borderColor: theme.color.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 11,
    color: theme.color.text,
    fontSize: 15,
  },
  ligneCase: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  texteCase: { flex: 1, color: theme.color.textMuted, fontSize: 12, lineHeight: 17 },
  erreur: { color: theme.color.danger, fontSize: 13 },
  bouton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: theme.color.accent,
    borderRadius: theme.radius.md,
    paddingVertical: 13,
    alignItems: "center",
  },
  boutonDesactive: { opacity: 0.5 },
  boutonTexte: { color: theme.color.accent300, fontSize: 15, fontWeight: "600" },
});
