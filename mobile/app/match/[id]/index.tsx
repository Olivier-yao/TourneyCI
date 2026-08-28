import { useCallback, useState } from "react";
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Pressable } from "react-native";
import { useLocalSearchParams, router, useFocusEffect } from "expo-router";
import { matchParId, evenementsDuMatch, type MatchTournoi, type EvenementMatch } from "@/lib/matches";
import { AppBar } from "@/components/AppBar";
import { theme } from "@/theme";

const RAFRAICHISSEMENT_MS = 10_000;

/** Vue lecture seule d'un match — port partiel de
 * src/app/matches/[id]/VueParticipantMatch.tsx (score en direct + fil du
 * match). La déclaration de score et le litige restent hors scope mobile
 * pour l'instant (réservés aux deux joueurs du match, action irréversible
 * côté web — traité comme une étape séparée à confirmer). */
export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [match, setMatch] = useState<MatchTournoi | null | undefined>(undefined);
  const [evenements, setEvenements] = useState<EvenementMatch[]>([]);

  useFocusEffect(
    useCallback(() => {
      let annule = false;
      const charger = () =>
        Promise.all([matchParId(id), evenementsDuMatch(id)]).then(([m, e]) => {
          if (annule) return;
          setMatch(m ?? null);
          setEvenements(e);
        });
      charger();
      const intervalle = setInterval(charger, RAFRAICHISSEMENT_MS);
      return () => {
        annule = true;
        clearInterval(intervalle);
      };
    }, [id]),
  );

  if (match === undefined) {
    return (
      <View style={styles.centre}>
        <ActivityIndicator color={theme.color.accent300} />
      </View>
    );
  }

  if (!match) {
    return (
      <View style={styles.ecran}>
        <AppBar titre="Match" />
        <View style={styles.centre}>
          <Text style={styles.texteMuted}>Match introuvable.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.ecran}>
      <AppBar titre="Match" />
      <ScrollView contentContainerStyle={styles.contenu}>
        <View style={styles.carteScore}>
          <View style={styles.joueur}>
            <Text style={styles.nomJoueur} numberOfLines={1}>{match.joueur1 ?? "À définir"}</Text>
            <Text style={styles.score}>{match.score1 ?? 0}</Text>
          </View>
          <Text style={styles.vs}>VS</Text>
          <View style={styles.joueur}>
            <Text style={styles.nomJoueur} numberOfLines={1}>{match.joueur2 ?? "À définir"}</Text>
            <Text style={styles.score}>{match.score2 ?? 0}</Text>
          </View>
        </View>
        {match.statut === "en_cours" && <Text style={styles.badgeEnCours}>EN COURS</Text>}
        {match.statut === "termine" && <Text style={styles.texteMuted}>Match terminé.</Text>}

        <View style={styles.bloc}>
          <Text style={styles.blocTitre}>Fil du match</Text>
          {evenements.length === 0 ? (
            <Text style={styles.texteMuted}>Aucun évènement pour l'instant.</Text>
          ) : (
            evenements.map((e) => (
              <Text key={e.id} style={styles.texte}>· {e.texte}</Text>
            ))
          )}
        </View>

        <Pressable onPress={() => router.push({ pathname: "/tournoi/[id]/bracket", params: { id: match.tournoiId } })}>
          <Text style={styles.lien}>Voir le bracket →</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: theme.color.bg },
  centre: { flex: 1, alignItems: "center", justifyContent: "center" },
  contenu: { padding: 16, paddingBottom: 32, gap: 14 },
  carteScore: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.color.surface,
    borderWidth: 1,
    borderColor: theme.color.border,
    borderRadius: theme.radius.md,
    padding: 16,
    gap: 10,
  },
  joueur: { flex: 1, alignItems: "center", gap: 6 },
  nomJoueur: { color: theme.color.text, fontSize: 14, fontWeight: "500" },
  score: { color: theme.color.accent300, fontSize: 28, fontWeight: "700" },
  vs: { color: theme.color.muted, fontSize: 12, fontWeight: "700" },
  badgeEnCours: { color: theme.color.accent300, fontSize: 11, fontWeight: "700", letterSpacing: 0.5, textAlign: "center" },
  texteMuted: { color: theme.color.textMuted, fontSize: 13 },
  bloc: { gap: 6 },
  blocTitre: { color: theme.color.text, fontSize: 14, fontWeight: "600" },
  texte: { color: theme.color.text, fontSize: 13, lineHeight: 19 },
  lien: { color: theme.color.accent300, fontSize: 14, fontWeight: "600" },
});
