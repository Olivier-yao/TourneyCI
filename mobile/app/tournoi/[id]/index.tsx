import { useCallback, useState } from "react";
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Pressable, KeyboardAvoidingView, Platform } from "react-native";
import { useLocalSearchParams, router, useFocusEffect } from "expo-router";
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
import { equipesProfilDontChef, type EquipeProfil } from "@/lib/equipes";
import { formatXof } from "@/lib/format";
import { AppBar } from "@/components/AppBar";
import { Button } from "@/components/Button";
import { TextField } from "@/components/TextField";
import { EquipeBadge } from "@/components/EquipeBadge";
import { theme } from "@/theme";

type EtapeInscription = "repos" | "tag" | "equipe" | "confirmation";

/** Détail d'un tournoi + inscription — 1v1 solo et équipes (mode "libre",
 * seul réellement en production, cf. exploration de CtaInscription.tsx).
 * Battle royale duo/trio/squad (création/rejoint d'équipe, bien plus riche)
 * reste hors scope pour l'instant, traité comme une étape séparée à
 * confirmer. */
export default function TournoiDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [tournoi, setTournoi] = useState<Tournoi | null | undefined>(undefined);
  const [monInscription, setMonInscription] = useState<InscriptionResume | undefined>(undefined);
  const [etape, setEtape] = useState<EtapeInscription>("repos");
  const [tag, setTag] = useState("");
  const [equipesProfil, setEquipesProfil] = useState<EquipeProfil[]>([]);
  const [nomEquipe, setNomEquipe] = useState("");
  const [creationEquipeManuelle, setCreationEquipeManuelle] = useState(false);
  const [presenceAcceptee, setPresenceAcceptee] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const estEquipes = tournoi?.type === "equipes";

  const charger = useCallback(async () => {
    const [t, inscriptions] = await Promise.all([tournoiParId(id), mesInscriptions()]);
    setTournoi(t ?? null);
    setMonInscription(inscriptions.find((i) => i.tournoiId === id));
    if (t?.type === "equipes") setEquipesProfil(await equipesProfilDontChef());
  }, [id]);

  // useFocusEffect (pas useEffect) : places/statut changent sans action
  // locale (autre inscrit, clôture organisateur) et cet écran reste souvent
  // ouvert en arrière-plan (retour depuis "Mon tournoi") — mêmes raisons
  // que l'Accueil.
  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger]),
  );

  function surClicInscription() {
    setErreur(null);
    if (estEquipes) {
      setEtape("equipe");
      return;
    }
    setEtape("tag");
  }

  function validerEquipe() {
    if (!nomEquipe.trim()) {
      setErreur("Choisis ou saisis le nom de ton équipe.");
      return;
    }
    setErreur(null);
    setEtape("confirmation");
  }

  async function confirmer() {
    if (!tournoi) return;
    setErreur(null);
    const corps = estEquipes ? { equipe: nomEquipe.trim() } : { tag };
    if (tournoi.fraisXof > 0) {
      router.push({
        pathname: "/tournoi/[id]/paiement",
        params: { id, montant: String(tournoi.fraisXof), ...(estEquipes ? { equipe: corps.equipe } : { tag: corps.tag }) },
      });
      return;
    }
    setEnCours(true);
    const resultat = await inscrire(id, corps);
    setEnCours(false);
    if (!resultat.ok) {
      setErreur(resultat.erreur);
      return;
    }
    setMonInscription({ tournoiId: id, tag: resultat.tag, equipe: resultat.equipe });
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
  const estBattleRoyaleEquipe = tournoi.type === "battle_royale" && tournoi.brSousType && tournoi.brSousType !== "solo";

  return (
    <KeyboardAvoidingView style={styles.ecran} behavior={Platform.OS === "ios" ? "padding" : "height"}>
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
          <View style={styles.formulaire}>
            <View style={styles.pillInscrit}>
              <Ionicons name="checkmark-circle" size={18} color={theme.color.accent300} />
              <Text style={styles.pillInscritTexte}>
                Déjà inscrit{monInscription.tag ? ` · ${monInscription.tag}` : ""}
                {monInscription.equipe ? ` · ${monInscription.equipe}` : ""}
              </Text>
            </View>
            <Button onPress={() => router.push({ pathname: "/tournoi/[id]/moi", params: { id } })}>Mon tournoi</Button>
          </View>
        ) : tournoi.annule || tournoi.termine || fermees ? (
          <Text style={styles.texteMuted}>Inscriptions closes.</Text>
        ) : estBattleRoyaleEquipe ? (
          <Text style={styles.texteMuted}>Inscription Battle Royale en équipe pas encore disponible dans l'app — utilise le site web.</Text>
        ) : etape === "repos" ? (
          <Button onPress={surClicInscription}>S'inscrire</Button>
        ) : etape === "tag" ? (
          <View style={styles.formulaire}>
            <Text style={styles.texteMuted}>
              Indique le TAG exact que tu utilises sur {tournoi.jeuLabel} — c'est ce qui permettra à l'organisateur de t'identifier.
            </Text>
            <TextField placeholder="Ton TAG sur ce jeu" value={tag} onChangeText={setTag} autoCapitalize="none" />
            <Button disabled={!tag.trim()} onPress={() => setEtape("confirmation")}>Continuer</Button>
          </View>
        ) : etape === "equipe" ? (
          <View style={styles.formulaire}>
            {equipesProfil.length > 0 && !creationEquipeManuelle ? (
              <View style={styles.formulaire}>
                <Text style={styles.libelleSection}>Mes équipes</Text>
                {equipesProfil.map((e) => (
                  <Pressable
                    key={e.id}
                    style={[styles.carteEquipe, { borderColor: nomEquipe === e.nom ? theme.color.accent : theme.color.border }]}
                    onPress={() => setNomEquipe(e.nom)}
                  >
                    <EquipeBadge initiales={e.nom.slice(0, 2).toUpperCase()} style={nomEquipe === e.nom ? "accent" : "neutre"} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.carteEquipeNom}>{e.nom}</Text>
                      <Text style={styles.texteMuted}>{e.membres.length} membre{e.membres.length > 1 ? "s" : ""}</Text>
                    </View>
                    {nomEquipe === e.nom && <Ionicons name="checkmark-circle" size={18} color={theme.color.accent300} />}
                  </Pressable>
                ))}
                <Pressable
                  style={styles.boutonCreerEquipe}
                  onPress={() => {
                    setCreationEquipeManuelle(true);
                    setNomEquipe("");
                  }}
                >
                  <Ionicons name="add" size={16} color={theme.color.muted} />
                  <Text style={styles.texteMuted}>Créer une équipe pour ce tournoi</Text>
                </Pressable>
              </View>
            ) : (
              <TextField label="Nom de ton équipe" placeholder="Les Lions" value={nomEquipe} onChangeText={setNomEquipe} />
            )}
            {erreur && <Text style={styles.erreur}>{erreur}</Text>}
            <Button onPress={validerEquipe}>Continuer</Button>
          </View>
        ) : (
          <View style={styles.formulaire}>
            <Text style={styles.texte}>
              {tournoi.titre} · {estEquipes ? `Équipe ${nomEquipe}` : `TAG ${tag}`} · {tournoi.fraisXof > 0 ? formatXof(tournoi.fraisXof) : "Inscription gratuite"}
            </Text>
            <Pressable style={styles.ligneCase} onPress={() => setPresenceAcceptee((v) => !v)}>
              <Ionicons name={presenceAcceptee ? "checkbox" : "square-outline"} size={20} color={theme.color.accent300} />
              <Text style={styles.texteCase}>
                Je comprends qu'une fois inscrit, ma présence au tournoi est obligatoire.
              </Text>
            </Pressable>
            {erreur && <Text style={styles.erreur}>{erreur}</Text>}
            <Button disabled={!presenceAcceptee || enCours} onPress={confirmer}>{enCours ? "Inscription..." : "Confirmer"}</Button>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
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
  libelleSection: { color: theme.color.muted, fontSize: 10, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
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
  carteEquipe: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 10,
    borderWidth: 1,
    borderRadius: theme.radius.md,
    backgroundColor: theme.color.surface,
  },
  carteEquipeNom: { color: theme.color.text, fontSize: 14, fontWeight: "500" },
  boutonCreerEquipe: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 10,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: theme.color.borderStrong,
    borderRadius: theme.radius.md,
  },
  ligneCase: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  texteCase: { flex: 1, color: theme.color.textMuted, fontSize: 12, lineHeight: 17 },
  erreur: { color: theme.color.danger, fontSize: 13 },
});
