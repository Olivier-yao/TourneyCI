import { useCallback, useState } from "react";
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Pressable } from "react-native";
import { useLocalSearchParams, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { tournoiParId, type Tournoi } from "@/lib/tournois";
import { matchsDuTournoi, libelleRound, demarrerMatch, validerScoreDirect, cloturerMatch, type MatchTournoi } from "@/lib/matches";
import { AppBar } from "@/components/AppBar";
import { Button } from "@/components/Button";
import { theme } from "@/theme";

type Saisie = { s1: number; s2: number };

/** Port de src/app/organisateur/[id]/gestion/GestionMatches.tsx — score par
 * pas de +1/-1 (pas de champ texte libre : corriger un chiffre déjà saisi
 * au clavier tactile est peu fiable, même raison que le web), un seul
 * match en direct à la fois, confirmation avant clôture (irréversible,
 * qualifie le vainqueur pour le tour suivant). */
export default function ScoresScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [tournoi, setTournoi] = useState<Tournoi | null | undefined>(undefined);
  const [matches, setMatches] = useState<MatchTournoi[]>([]);
  const [saisies, setSaisies] = useState<Record<string, Saisie>>({});
  const [confirmationId, setConfirmationId] = useState<string | null>(null);
  const [enCoursId, setEnCoursId] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  const charger = useCallback(async () => {
    const [t, m] = await Promise.all([tournoiParId(id), matchsDuTournoi(id)]);
    setTournoi(t ?? null);
    setMatches(m);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger]),
  );

  function saisie(m: MatchTournoi): Saisie {
    return saisies[m.id] ?? { s1: m.score1 ?? 0, s2: m.score2 ?? 0 };
  }

  function ajuster(m: MatchTournoi, cote: "s1" | "s2", delta: number) {
    setSaisies((v) => ({ ...v, [m.id]: { ...saisie(m), [cote]: Math.max(0, saisie(m)[cote] + delta) } }));
  }

  async function demarrer(m: MatchTournoi) {
    setErreur(null);
    setEnCoursId(m.id);
    const resultat = await demarrerMatch(m.id);
    setEnCoursId(null);
    if (!resultat.ok) {
      setErreur(resultat.erreur ?? "Impossible de démarrer ce match.");
      return;
    }
    charger();
  }

  async function valider(m: MatchTournoi) {
    setErreur(null);
    const { s1, s2 } = saisie(m);
    setEnCoursId(m.id);
    const resultat = await validerScoreDirect(m.id, s1, s2);
    setEnCoursId(null);
    if (!resultat.ok) {
      setErreur(resultat.erreur ?? "Impossible de mettre à jour le score.");
      return;
    }
    charger();
  }

  async function confirmerCloture(m: MatchTournoi) {
    setErreur(null);
    const { s1, s2 } = saisie(m);
    setEnCoursId(m.id);
    const resultat = await cloturerMatch(m.id, s1, s2);
    setEnCoursId(null);
    setConfirmationId(null);
    if (!resultat.ok) {
      setErreur(resultat.erreur ?? "Impossible de clôturer ce match.");
      return;
    }
    charger();
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
        <AppBar titre="Scores" />
        <View style={styles.centre}>
          <Text style={styles.texteMuted}>Tournoi introuvable.</Text>
        </View>
      </View>
    );
  }

  if (matches.length === 0) {
    return (
      <View style={styles.ecran}>
        <AppBar titre={tournoi.titre} />
        <View style={styles.centre}>
          <Text style={styles.texteMuted}>Le bracket n'a pas encore été généré.</Text>
        </View>
      </View>
    );
  }

  const totalRounds = Math.max(...matches.map((m) => m.round));
  const matchEnCoursId = matches.find((m) => m.statut === "en_cours")?.id;

  return (
    <View style={styles.ecran}>
      <AppBar titre={tournoi.titre} />
      <ScrollView contentContainerStyle={styles.contenu}>
        {erreur && <Text style={styles.erreur}>{erreur}</Text>}
        {Array.from({ length: totalRounds }, (_, i) => i + 1).map((round) => (
          <View key={round} style={styles.section}>
            <Text style={styles.titreSection}>{libelleRound(round, totalRounds)}</Text>
            {matches
              .filter((m) => m.round === round)
              .sort((a, b) => a.position - b.position)
              .map((m) => (
                <CarteMatch
                  key={m.id}
                  match={m}
                  saisie={saisie(m)}
                  peutDemarrer={m.statut === "a_venir" && !!m.joueur1 && !!m.joueur2 && !matchEnCoursId}
                  bloque={m.statut === "en_cours" && matchEnCoursId !== m.id}
                  enCours={enCoursId === m.id}
                  confirmation={confirmationId === m.id}
                  onAjuster={(cote, delta) => ajuster(m, cote, delta)}
                  onDemarrer={() => demarrer(m)}
                  onValider={() => valider(m)}
                  onDemanderCloture={() => setConfirmationId(m.id)}
                  onAnnulerCloture={() => setConfirmationId(null)}
                  onConfirmerCloture={() => confirmerCloture(m)}
                />
              ))}
          </View>
        ))}
        <Text style={styles.astuce}>Un seul match en direct à la fois — choisis lequel démarrer ensuite.</Text>
      </ScrollView>
    </View>
  );
}

function CarteMatch({
  match,
  saisie,
  peutDemarrer,
  bloque,
  enCours,
  confirmation,
  onAjuster,
  onDemarrer,
  onValider,
  onDemanderCloture,
  onAnnulerCloture,
  onConfirmerCloture,
}: {
  match: MatchTournoi;
  saisie: Saisie;
  peutDemarrer: boolean;
  bloque: boolean;
  enCours: boolean;
  confirmation: boolean;
  onAjuster: (cote: "s1" | "s2", delta: number) => void;
  onDemarrer: () => void;
  onValider: () => void;
  onDemanderCloture: () => void;
  onAnnulerCloture: () => void;
  onConfirmerCloture: () => void;
}) {
  const termine = match.statut === "termine";
  const direct = match.statut === "en_cours";
  const modifiable = termine || direct;

  return (
    <View style={[styles.carte, direct && styles.carteAccent]}>
      <Text style={styles.statutTexte}>{termine ? "Terminé" : direct ? "En direct" : "En attente"}</Text>

      <LigneJoueur nom={match.joueur1} saisieVal={saisie.s1} modifiable={modifiable} onMoins={() => onAjuster("s1", -1)} onPlus={() => onAjuster("s1", 1)} />
      <LigneJoueur nom={match.joueur2} saisieVal={saisie.s2} modifiable={modifiable} onMoins={() => onAjuster("s2", -1)} onPlus={() => onAjuster("s2", 1)} />

      {peutDemarrer && (
        <Button disabled={enCours} onPress={onDemarrer}>{enCours ? "..." : "Démarrer ce match"}</Button>
      )}
      {bloque && <Text style={styles.texteMuted}>En attente (un autre match est en direct)</Text>}
      {!peutDemarrer && !bloque && !modifiable && <Text style={styles.texteMuted}>En attente des qualifiés</Text>}

      {direct && !confirmation && (
        <View style={styles.rangeeBoutons}>
          <View style={{ flex: 1 }}>
            <Button variante="secondary" disabled={enCours} onPress={onValider}>Valider</Button>
          </View>
          <View style={{ flex: 1 }}>
            <Button disabled={enCours || saisie.s1 === saisie.s2} onPress={onDemanderCloture}>Clôturer</Button>
          </View>
        </View>
      )}

      {termine && !confirmation && (
        <Button variante="secondary" disabled={enCours || saisie.s1 === saisie.s2} onPress={onDemanderCloture}>Modifier le score</Button>
      )}

      {confirmation && (
        <View style={styles.confirmation}>
          <Text style={styles.texte}>
            Score final : {match.joueur1} {saisie.s1} - {saisie.s2} {match.joueur2}. Le vainqueur sera qualifié pour le tour suivant.
          </Text>
          <View style={styles.rangeeBoutons}>
            <View style={{ flex: 1 }}>
              <Button variante="secondary" disabled={enCours} onPress={onAnnulerCloture}>Annuler</Button>
            </View>
            <View style={{ flex: 1 }}>
              <Button disabled={enCours} onPress={onConfirmerCloture}>{enCours ? "..." : "Confirmer"}</Button>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

function LigneJoueur({
  nom,
  saisieVal,
  modifiable,
  onMoins,
  onPlus,
}: {
  nom: string | null;
  saisieVal: number;
  modifiable: boolean;
  onMoins: () => void;
  onPlus: () => void;
}) {
  return (
    <View style={styles.ligneJoueur}>
      <Text style={[styles.nomJoueur, !nom && styles.nomVide]} numberOfLines={1}>{nom ?? "À définir"}</Text>
      {modifiable ? (
        <View style={styles.stepper}>
          <Pressable style={styles.stepperBouton} onPress={onMoins}>
            <Ionicons name="remove" size={14} color={theme.color.muted} />
          </Pressable>
          <Text style={styles.stepperValeur}>{saisieVal}</Text>
          <Pressable style={styles.stepperBouton} onPress={onPlus}>
            <Ionicons name="add" size={14} color={theme.color.muted} />
          </Pressable>
        </View>
      ) : (
        <Text style={styles.texteMuted}>—</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: theme.color.bg },
  centre: { flex: 1, alignItems: "center", justifyContent: "center" },
  contenu: { padding: 16, paddingBottom: 32, gap: 8 },
  erreur: { color: theme.color.danger, fontSize: 13, marginBottom: 4 },
  section: { gap: 8, marginBottom: 12 },
  titreSection: { color: theme.color.muted, fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  texteMuted: { color: theme.color.textMuted, fontSize: 12 },
  texte: { color: theme.color.text, fontSize: 13, lineHeight: 19 },
  astuce: { color: theme.color.muted, fontSize: 11, textAlign: "center", marginTop: 8 },
  carte: {
    backgroundColor: theme.color.surface,
    borderWidth: 1,
    borderColor: theme.color.border,
    borderRadius: theme.radius.md,
    padding: 12,
    gap: 8,
  },
  carteAccent: { borderColor: theme.color.accent },
  statutTexte: { color: theme.color.muted, fontSize: 10, fontWeight: "700", letterSpacing: 0.5, textTransform: "uppercase" },
  ligneJoueur: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  nomJoueur: { flex: 1, color: theme.color.text, fontSize: 14 },
  nomVide: { color: theme.color.muted, fontStyle: "italic" },
  stepper: { flexDirection: "row", alignItems: "center", gap: 6 },
  stepperBouton: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.color.border,
    borderRadius: theme.radius.sm,
  },
  stepperValeur: { color: theme.color.text, width: 20, textAlign: "center", fontSize: 15 },
  rangeeBoutons: { flexDirection: "row", gap: 8 },
  confirmation: { gap: 8, paddingTop: 4, borderTopWidth: 1, borderTopColor: theme.color.border },
});
