import { useCallback, useState } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Pressable } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { mesTournoisOrganises } from "@/lib/organisateur";
import { formatXof } from "@/lib/format";
import { type Tournoi } from "@/lib/tournois";
import { theme } from "@/theme";

type Section = { titre: string; donnees: Tournoi[] };

/** Port simplifié du hub /organisateur (src/app/organisateur/page.tsx) —
 * liste "Mes tournois" groupée par statut, sans l'agrégat commission/
 * réputation/litiges du web (analytique, pas opérationnel sur le terrain :
 * hors scope pour cet incrément). */
export default function OrganisateurScreen() {
  const [tournois, setTournois] = useState<Tournoi[] | null>(null);

  useFocusEffect(
    useCallback(() => {
      mesTournoisOrganises().then(setTournois);
    }, []),
  );

  if (tournois === null) {
    return (
      <View style={styles.centre}>
        <ActivityIndicator color={theme.color.accent300} />
      </View>
    );
  }

  const enDirect = tournois.filter((t) => t.enDirect);
  const aVenir = tournois.filter((t) => !t.enDirect && !t.termine && !t.annule);
  const termines = tournois.filter((t) => t.termine || t.annule);
  const sections: Section[] = [
    ...(enDirect.length > 0 ? [{ titre: "En direct", donnees: enDirect }] : []),
    ...(aVenir.length > 0 ? [{ titre: "À venir", donnees: aVenir }] : []),
    ...(termines.length > 0 ? [{ titre: "Terminés / annulés", donnees: termines }] : []),
  ];

  return (
    <FlatList
      style={styles.ecran}
      contentContainerStyle={styles.contenu}
      data={sections}
      keyExtractor={(s) => s.titre}
      ListHeaderComponent={
        <View style={styles.entete}>
          <Text style={styles.titre}>Mes tournois</Text>
          <Pressable style={styles.boutonAjout} onPress={() => router.push("/organisateur/nouveau")}>
            <Ionicons name="add" size={22} color={theme.color.accent300} />
          </Pressable>
        </View>
      }
      ListEmptyComponent={<Text style={styles.texteMuted}>Tu n'organises aucun tournoi pour l'instant.</Text>}
      renderItem={({ item }) => (
        <View style={styles.section}>
          <Text style={styles.titreSection}>{item.titre}</Text>
          {item.donnees.map((t) => (
            <Pressable
              key={t.id}
              style={styles.carte}
              onPress={() => router.push({ pathname: "/organisateur/[id]/gestion", params: { id: t.id } })}
            >
              <View style={styles.carteTexte}>
                <Text style={styles.carteTitre} numberOfLines={1}>{t.titre}</Text>
                <Text style={styles.carteDetail} numberOfLines={1}>
                  {t.jeuLabel} · {t.dateLabel} · {t.placesInscrites}/{t.placesTotal}
                </Text>
              </View>
              <Text style={styles.carteMontant}>{formatXof(t.cashPrizeXof)}</Text>
            </Pressable>
          ))}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: theme.color.bg },
  centre: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.color.bg },
  contenu: { padding: 20, gap: 8 },
  entete: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  titre: { color: theme.color.text, fontSize: 24, fontWeight: "700" },
  boutonAjout: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.color.accent,
  },
  texteMuted: { color: theme.color.muted, fontSize: 13 },
  section: { marginBottom: 20, gap: 8 },
  titreSection: { color: theme.color.textMuted, fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
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
