import { useCallback, useState } from "react";
import { View, Text, FlatList, StyleSheet, RefreshControl, ActivityIndicator, Pressable } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { listerTournois, type Tournoi } from "@/lib/tournois";
import { formatXof } from "@/lib/format";
import { theme } from "@/theme";

type Section = { titre: string; donnees: Tournoi[] };

export default function AccueilScreen() {
  const [tournois, setTournois] = useState<Tournoi[] | null>(null);
  const [rafraichissement, setRafraichissement] = useState(false);

  const charger = useCallback(async () => {
    setTournois(await listerTournois());
  }, []);

  // useFocusEffect (pas useEffect) : les tournois listés ici changent d'état
  // en continu (places, en_direct, termine) sans qu'aucune action locale ne
  // le déclenche (ex. l'organisateur clôture, un autre joueur s'inscrit) —
  // sans ça, un onglet resté monté en arrière-plan affiche des données
  // périmées en y revenant (repli SUR le focus plutôt qu'un sondage
  // permanent, cf. mobile Fondations : pas de Realtime pour cet incrément).
  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger]),
  );

  async function surRafraichir() {
    setRafraichissement(true);
    await charger();
    setRafraichissement(false);
  }

  if (tournois === null) {
    return (
      <View style={styles.centre}>
        <ActivityIndicator color={theme.color.accent300} />
      </View>
    );
  }

  // Même logique que src/app/accueil/page.tsx (bug corrigé : un tournoi
  // terminé/annulé ne doit jamais réapparaître comme "à venir").
  const enDirect = tournois.filter((t) => t.enDirect);
  const prochains = tournois.filter((t) => !t.enDirect && !t.termine && !t.annule);
  const sections: Section[] = [
    ...(enDirect.length > 0 ? [{ titre: "En direct", donnees: enDirect }] : []),
    { titre: "Prochains tournois", donnees: prochains },
  ];

  return (
    <FlatList
      style={styles.ecran}
      contentContainerStyle={styles.contenu}
      data={sections}
      keyExtractor={(s) => s.titre}
      refreshControl={<RefreshControl refreshing={rafraichissement} onRefresh={surRafraichir} tintColor={theme.color.accent300} />}
      ListHeaderComponent={<Text style={styles.entete}>Tourney</Text>}
      renderItem={({ item }) => (
        <View style={styles.section}>
          <Text style={styles.titreSection}>{item.titre}</Text>
          {item.donnees.length === 0 ? (
            <Text style={styles.vide}>Aucun tournoi pour l'instant.</Text>
          ) : (
            item.donnees.map((t) => (
              <Pressable key={t.id} style={styles.carte} onPress={() => router.push({ pathname: "/tournoi/[id]", params: { id: t.id } })}>
                <View style={styles.carteTexte}>
                  <Text style={styles.carteTitre} numberOfLines={1}>{t.titre}</Text>
                  <Text style={styles.carteDetail} numberOfLines={1}>
                    {t.jeuLabel} · {t.dateLabel} · {t.placesInscrites}/{t.placesTotal}
                  </Text>
                </View>
                <Text style={styles.carteMontant}>{formatXof(t.cashPrizeXof)}</Text>
              </Pressable>
            ))
          )}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: theme.color.bg },
  contenu: { padding: 20, gap: 8 },
  centre: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.color.bg },
  entete: { color: theme.color.text, fontSize: 24, fontWeight: "700", marginBottom: 12 },
  section: { marginBottom: 20, gap: 8 },
  titreSection: { color: theme.color.textMuted, fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  vide: { color: theme.color.muted, fontSize: 13 },
  carte: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: theme.radius.md,
    backgroundColor: theme.color.surface,
    borderWidth: 1,
    borderColor: theme.color.border,
  },
  carteTexte: { flex: 1, gap: 2 },
  carteTitre: { color: theme.color.text, fontSize: 14, fontWeight: "500" },
  carteDetail: { color: theme.color.muted, fontSize: 11 },
  carteMontant: { color: theme.color.accent300, fontSize: 13 },
});
