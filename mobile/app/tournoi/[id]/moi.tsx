import { useCallback, useRef, useState } from "react";
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Pressable } from "react-native";
import { useLocalSearchParams, router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { tournoiParId, mesInscriptions, type Tournoi } from "@/lib/tournois";
import { monPseudo } from "@/lib/profil";
import { matchsDuTournoi, libelleRound, type MatchTournoi } from "@/lib/matches";
import { presentsDuTournoi, confirmerMaPresence } from "@/lib/checkin";
import { infosRoomDuTournoi, type InfosRoom } from "@/lib/room";
import { AppBar } from "@/components/AppBar";
import { Button } from "@/components/Button";
import { theme } from "@/theme";

const RAFRAICHISSEMENT_MATCHS_MS = 15_000;
const RAFRAICHISSEMENT_PRESENCE_MS = 30_000;

type Etat = "avant_checkin" | "checkin_ouvert" | "en_direct";

/** Port de src/app/tournois/[id]/MaFicheInscrit.tsx pour 1v1/équipes (le
 * Battle Royale a son propre système de manches/points, hors scope ici).
 * Sans abonnement Realtime (hors scope Fondations) : rafraîchi par
 * sondage pendant que l'écran est affiché, à un intervalle plus court que
 * le repli web (60s) pour rester raisonnablement "en direct" malgré
 * l'absence de push. */
export default function MonTournoiScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [tournoi, setTournoi] = useState<Tournoi | null | undefined>(undefined);
  const [monNom, setMonNom] = useState<string | undefined>(undefined);
  const [matches, setMatches] = useState<MatchTournoi[]>([]);
  const [presents, setPresents] = useState<string[]>([]);
  const [room, setRoom] = useState<InfosRoom>({ lien: "", motDePasse: "" });
  const [enCoursPresence, setEnCoursPresence] = useState(false);
  const monNomRef = useRef<string | undefined>(undefined);

  const chargerBase = useCallback(async () => {
    const [t, inscriptions, pseudo] = await Promise.all([tournoiParId(id), mesInscriptions(), monPseudo()]);
    setTournoi(t ?? null);
    // Identité pour retrouver "mes matchs" : le nom d'équipe si équipes,
    // sinon mon pseudo — jamais le TAG (identifiant in-game distinct,
    // cf. commit web sur ce même bug). Sans ce repli sur le pseudo, tout
    // inscrit 1v1/battle royale solo (aucune équipe) est vu comme "pas
    // inscrit" par cet écran alors qu'il l'est bien.
    const nom = inscriptions.find((i) => i.tournoiId === id)?.equipe ?? pseudo;
    monNomRef.current = nom;
    setMonNom(nom);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      chargerBase();
    }, [chargerBase]),
  );

  useFocusEffect(
    useCallback(() => {
      if (!tournoi) return;
      const etat: Etat = tournoi.enDirect ? "en_direct" : Date.now() >= tournoi.checkinTs ? "checkin_ouvert" : "avant_checkin";
      if (etat === "avant_checkin") return;

      let annule = false;
      async function chargerPresenceEtRoom() {
        const [p, r] = await Promise.all([presentsDuTournoi(id), infosRoomDuTournoi(id)]);
        if (!annule) {
          setPresents(p);
          setRoom(r);
        }
      }
      chargerPresenceEtRoom();
      const intervallePresence = setInterval(chargerPresenceEtRoom, RAFRAICHISSEMENT_PRESENCE_MS);

      let intervalleMatchs: ReturnType<typeof setInterval> | undefined;
      if (etat === "en_direct" && tournoi.type !== "battle_royale") {
        const chargerMatchs = () => matchsDuTournoi(id).then((m) => !annule && setMatches(m));
        chargerMatchs();
        intervalleMatchs = setInterval(chargerMatchs, RAFRAICHISSEMENT_MATCHS_MS);
      }

      return () => {
        annule = true;
        clearInterval(intervallePresence);
        if (intervalleMatchs) clearInterval(intervalleMatchs);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tournoi?.id, tournoi?.enDirect, tournoi?.checkinTs]),
  );

  async function surConfirmerPresence() {
    setEnCoursPresence(true);
    setPresents(await confirmerMaPresence(id));
    setEnCoursPresence(false);
  }

  if (tournoi === undefined) {
    return (
      <View style={styles.centre}>
        <ActivityIndicator color={theme.color.accent300} />
      </View>
    );
  }

  if (!tournoi || !monNom) {
    return (
      <View style={styles.ecran}>
        <AppBar titre="Mon tournoi" />
        <View style={styles.centre}>
          <Text style={styles.texteMuted}>{!tournoi ? "Tournoi introuvable." : "Tu n'es pas inscrit à ce tournoi."}</Text>
        </View>
      </View>
    );
  }

  const jeSuisPresent = presents.includes(monNom);
  const etat: Etat = tournoi.enDirect ? "en_direct" : Date.now() >= tournoi.checkinTs ? "checkin_ouvert" : "avant_checkin";

  return (
    <View style={styles.ecran}>
      <AppBar titre={tournoi.titre} />
      <ScrollView contentContainerStyle={styles.contenu}>
        {etat === "avant_checkin" && (
          <View style={styles.carte}>
            <Text style={styles.carteTitre}>Check-in pas encore ouvert</Text>
            <Text style={styles.texteMuted}>Ouvre à {tournoi.checkin}, début du tournoi {tournoi.dateLabel}.</Text>
            <Text style={styles.texteMuted}>{tournoi.placesInscrites}/{tournoi.placesTotal} inscrits</Text>
          </View>
        )}

        {etat === "checkin_ouvert" && (
          <View style={styles.carte}>
            <Text style={styles.carteTitre}>Confirme ta présence</Text>
            <Text style={styles.texteMuted}>{presents.length}/{tournoi.placesInscrites} présents</Text>
            {jeSuisPresent ? (
              <View style={styles.pillOk}>
                <Ionicons name="checkmark-circle" size={18} color={theme.color.accent300} />
                <Text style={styles.pillOkTexte}>Tu es présent</Text>
              </View>
            ) : (
              <Button disabled={enCoursPresence} onPress={surConfirmerPresence}>
                {enCoursPresence ? "..." : "Je suis présent"}
              </Button>
            )}
          </View>
        )}

        {etat === "en_direct" && tournoi.type !== "battle_royale" && (
          <BlocEnDirect tournoiId={id} monNom={monNom} matches={matches} />
        )}

        {etat === "en_direct" && tournoi.type === "battle_royale" && (
          <View style={styles.carte}>
            <Text style={styles.texteMuted}>Suivi Battle Royale (classement, manches) pas encore disponible dans l'app.</Text>
          </View>
        )}

        {room.lien.trim() !== "" && etat !== "avant_checkin" && (
          <View style={styles.carte}>
            <Text style={styles.carteTitre}>Infos de room</Text>
            <Text style={styles.texte}>{room.lien}</Text>
            {room.motDePasse !== "" && <Text style={styles.texteMuted}>Mot de passe : {room.motDePasse}</Text>}
          </View>
        )}

        <View style={styles.liens}>
          <Pressable onPress={() => router.push({ pathname: "/tournoi/[id]/bracket", params: { id } })}>
            <Text style={styles.lien}>Voir le bracket →</Text>
          </Pressable>
          <Pressable onPress={() => router.push({ pathname: "/tournoi/[id]/chat", params: { id } })}>
            <Text style={styles.lien}>Chat du tournoi →</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

function BlocEnDirect({ tournoiId, monNom, matches }: { tournoiId: string; monNom: string; matches: MatchTournoi[] }) {
  if (matches.length === 0) {
    return (
      <View style={styles.carte}>
        <Text style={styles.carteTitre}>Bracket en préparation</Text>
        <Text style={styles.texteMuted}>L'organisateur n'a pas encore généré l'arbre.</Text>
      </View>
    );
  }

  const mesMatchs = matches.filter((m) => m.joueur1 === monNom || m.joueur2 === monNom);
  const matchEnCours = mesMatchs.find((m) => m.statut === "en_cours");
  const matchAVenir = mesMatchs.find((m) => m.statut === "a_venir");
  const matchsTermines = mesMatchs.filter((m) => m.statut === "termine").sort((a, b) => b.round - a.round);
  const dernierTermine = matchsTermines[0];
  const totalRounds = Math.max(...matches.map((m) => m.round));

  function aGagne(m: MatchTournoi): boolean {
    if (m.score1 === null || m.score2 === null) return false;
    const monScore = m.joueur1 === monNom ? m.score1 : m.score2;
    const scoreAdverse = m.joueur1 === monNom ? m.score2 : m.score1;
    return monScore > scoreAdverse;
  }

  if (matchEnCours) {
    return (
      <View style={[styles.carte, styles.carteAccent]}>
        <Text style={styles.carteTitre}>C'est ton tour</Text>
        <Text style={styles.texte}>
          {matchEnCours.joueur1} {matchEnCours.score1 ?? 0} - {matchEnCours.score2 ?? 0} {matchEnCours.joueur2}
        </Text>
        <Pressable onPress={() => router.push({ pathname: "/match/[id]", params: { id: matchEnCours.id } })}>
          <Text style={styles.lien}>Aller à mon match →</Text>
        </Pressable>
      </View>
    );
  }

  if (dernierTermine && !aGagne(dernierTermine)) {
    return (
      <View style={styles.carte}>
        <Text style={styles.carteTitre}>Éliminé en {libelleRound(dernierTermine.round, totalRounds)}</Text>
        <Text style={styles.texteMuted}>
          {dernierTermine.joueur1} {dernierTermine.score1} - {dernierTermine.score2} {dernierTermine.joueur2}
        </Text>
      </View>
    );
  }

  if (matchAVenir && matchAVenir.joueur1 && matchAVenir.joueur2) {
    return (
      <View style={styles.carte}>
        <Text style={styles.carteTitre}>Ton match arrive</Text>
        <Text style={styles.texte}>{matchAVenir.joueur1} vs {matchAVenir.joueur2}</Text>
        <Text style={styles.texteMuted}>{libelleRound(matchAVenir.round, totalRounds)} · en attente de l'organisateur</Text>
      </View>
    );
  }

  return (
    <View style={styles.carte}>
      <Text style={styles.carteTitre}>Tu es qualifié</Text>
      <Text style={styles.texteMuted}>En attente du prochain adversaire.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: theme.color.bg },
  centre: { flex: 1, alignItems: "center", justifyContent: "center" },
  contenu: { padding: 16, paddingBottom: 32, gap: 12 },
  carte: {
    backgroundColor: theme.color.surface,
    borderWidth: 1,
    borderColor: theme.color.border,
    borderRadius: theme.radius.md,
    padding: 14,
    gap: 8,
  },
  carteAccent: { borderColor: theme.color.accent },
  carteTitre: { color: theme.color.text, fontSize: 15, fontWeight: "700" },
  texte: { color: theme.color.text, fontSize: 14 },
  texteMuted: { color: theme.color.textMuted, fontSize: 13 },
  pillOk: { flexDirection: "row", alignItems: "center", gap: 6 },
  pillOkTexte: { color: theme.color.accent300, fontSize: 14, fontWeight: "600" },
  liens: { gap: 10, marginTop: 8 },
  lien: { color: theme.color.accent300, fontSize: 14, fontWeight: "600" },
});
