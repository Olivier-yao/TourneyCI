import { useCallback, useState } from "react";
import { View, Text, SectionList, StyleSheet, ActivityIndicator, Pressable } from "react-native";
import { useLocalSearchParams, router, useFocusEffect } from "expo-router";
import { matchsDuTournoi, libelleRound, type MatchTournoi } from "@/lib/matches";
import { AppBar } from "@/components/AppBar";
import { theme } from "@/theme";

const RAFRAICHISSEMENT_MS = 15_000;

/** Port simplifié de src/app/tournois/[id]/bracket/page.tsx (BracketV2) —
 * liste par round plutôt que l'arbre visuel avec connecteurs SVG mesurés
 * en JS : rendu bien plus simple à porter en React Native, mêmes données
 * et même contenu par match. */
export default function BracketScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [matches, setMatches] = useState<MatchTournoi[] | null>(null);

  useFocusEffect(
    useCallback(() => {
      let annule = false;
      const charger = () => matchsDuTournoi(id).then((m) => !annule && setMatches(m));
      charger();
      const intervalle = setInterval(charger, RAFRAICHISSEMENT_MS);
      return () => {
        annule = true;
        clearInterval(intervalle);
      };
    }, [id]),
  );

  if (matches === null) {
    return (
      <View style={styles.centre}>
        <ActivityIndicator color={theme.color.accent300} />
      </View>
    );
  }

  if (matches.length === 0) {
    return (
      <View style={styles.ecran}>
        <AppBar titre="Bracket" />
        <View style={styles.centre}>
          <Text style={styles.texteMuted}>Bracket pas encore généré.</Text>
        </View>
      </View>
    );
  }

  const totalRounds = Math.max(...matches.map((m) => m.round));
  const rounds = Array.from({ length: totalRounds }, (_, i) => i + 1);
  const sections = rounds.map((round) => ({
    title: libelleRound(round, totalRounds),
    data: matches.filter((m) => m.round === round).sort((a, b) => a.position - b.position),
  }));

  return (
    <View style={styles.ecran}>
      <AppBar titre="Bracket" />
      <SectionList
        contentContainerStyle={styles.contenu}
        sections={sections}
        keyExtractor={(m) => m.id}
        renderSectionHeader={({ section }) => <Text style={styles.titreRound}>{section.title}</Text>}
        renderItem={({ item }) => <CarteMatch match={item} />}
      />
    </View>
  );
}

function CarteMatch({ match }: { match: MatchTournoi }) {
  const enCours = match.statut === "en_cours";
  return (
    <Pressable
      style={[styles.carte, enCours && styles.carteEnCours]}
      onPress={() => router.push({ pathname: "/match/[id]", params: { id: match.id } })}
    >
      <Ligne nom={match.joueur1} score={match.score1} statut={match.statut} />
      <View style={styles.separateur} />
      <Ligne nom={match.joueur2} score={match.score2} statut={match.statut} />
      {enCours && <Text style={styles.badgeEnCours}>EN COURS</Text>}
    </Pressable>
  );
}

function Ligne({ nom, score, statut }: { nom: string | null; score: number | null; statut: MatchTournoi["statut"] }) {
  return (
    <View style={styles.ligne}>
      <Text style={[styles.nomJoueur, !nom && styles.nomVide]} numberOfLines={1}>{nom ?? "À définir"}</Text>
      {statut !== "a_venir" && <Text style={styles.score}>{score ?? 0}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: theme.color.bg },
  centre: { flex: 1, alignItems: "center", justifyContent: "center" },
  contenu: { padding: 16, paddingBottom: 32 },
  texteMuted: { color: theme.color.textMuted, fontSize: 13 },
  titreRound: {
    color: theme.color.muted,
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 16,
    marginBottom: 8,
  },
  carte: {
    backgroundColor: theme.color.surface,
    borderWidth: 1,
    borderColor: theme.color.border,
    borderRadius: theme.radius.md,
    padding: 10,
    gap: 6,
    marginBottom: 8,
  },
  carteEnCours: { borderColor: theme.color.accent },
  separateur: { height: 1, backgroundColor: theme.color.border },
  ligne: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  nomJoueur: { flex: 1, color: theme.color.text, fontSize: 14 },
  nomVide: { color: theme.color.muted, fontStyle: "italic" },
  score: { color: theme.color.accent300, fontSize: 14, fontWeight: "700" },
  badgeEnCours: { color: theme.color.accent300, fontSize: 10, fontWeight: "700", letterSpacing: 0.5, marginTop: 2 },
});
