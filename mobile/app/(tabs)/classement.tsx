import { useCallback, useState } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from "react-native";
import { useFocusEffect } from "expo-router";
import { chargerClassement, type Classement, type EntreeClassement } from "@/lib/classement";
import { Avatar } from "@/components/Avatar";
import { theme } from "@/theme";

/** Port de src/app/classement/page.tsx (via Classement.tsx) — classement
 * national de la saison en cours. Affiche toute la liste renvoyée (jusqu'à
 * 500 côté serveur) plutôt que le podium top-8 + "moi" du web : plus
 * simple à faire défiler qu'à reproduire fidèlement sur mobile pour cet
 * incrément. */
export default function ClassementScreen() {
  const [donnees, setDonnees] = useState<Classement | null | undefined>(undefined);

  useFocusEffect(
    useCallback(() => {
      chargerClassement().then((c) => setDonnees(c ?? null));
    }, []),
  );

  if (donnees === undefined) {
    return (
      <View style={styles.centre}>
        <ActivityIndicator color={theme.color.accent300} />
      </View>
    );
  }

  if (!donnees || donnees.classement.length === 0) {
    return (
      <View style={styles.centre}>
        <Text style={styles.texteMuted}>Aucun classement pour l'instant.</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.ecran}
      contentContainerStyle={styles.contenu}
      data={donnees.classement}
      keyExtractor={(e) => e.profileId}
      ListHeaderComponent={
        <View style={styles.entete}>
          <Text style={styles.titre}>Classement</Text>
          <Text style={styles.texteMuted}>{donnees.saison.nom}</Text>
        </View>
      }
      renderItem={({ item, index }) => <LigneClassement entree={item} rang={index + 1} />}
    />
  );
}

function LigneClassement({ entree, rang }: { entree: EntreeClassement; rang: number }) {
  return (
    <View style={[styles.ligne, entree.moi && styles.ligneMoi]}>
      <Text style={styles.rang}>{rang}</Text>
      <Avatar photoUrl={entree.photoUrl} initiales={entree.initiales} taille={36} />
      <View style={{ flex: 1 }}>
        <Text style={styles.pseudo} numberOfLines={1}>{entree.pseudo}{entree.moi ? " (toi)" : ""}</Text>
        {entree.ville && <Text style={styles.texteMuted}>{entree.ville}</Text>}
      </View>
      <Text style={styles.points}>{entree.points} pts</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: theme.color.bg },
  centre: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.color.bg },
  contenu: { padding: 16, paddingBottom: 32 },
  entete: { marginBottom: 12, gap: 2 },
  titre: { color: theme.color.text, fontSize: 24, fontWeight: "700" },
  texteMuted: { color: theme.color.textMuted, fontSize: 13 },
  ligne: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 10,
    borderRadius: theme.radius.md,
    backgroundColor: theme.color.surface,
    borderWidth: 1,
    borderColor: theme.color.border,
    marginBottom: 8,
  },
  ligneMoi: { borderColor: theme.color.accent },
  rang: { width: 24, color: theme.color.muted, fontSize: 13, fontWeight: "700", textAlign: "center" },
  pseudo: { color: theme.color.text, fontSize: 14, fontWeight: "500" },
  points: { color: theme.color.accent300, fontSize: 14, fontWeight: "700" },
});
