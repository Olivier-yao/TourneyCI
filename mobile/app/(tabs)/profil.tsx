import { useCallback, useState } from "react";
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from "react-native";
import { useFocusEffect } from "expo-router";
import { useAuth } from "@/lib/auth";
import { monProfil, initiales, type Profil } from "@/lib/profil";
import { soldeTourneyCard } from "@/lib/wallet";
import { palierActuel, estActif } from "@/lib/palier";
import { formatXof } from "@/lib/format";
import { Avatar } from "@/components/Avatar";
import { PalierBadge } from "@/components/PalierBadge";
import { Button } from "@/components/Button";
import { theme } from "@/theme";

/** Port de src/app/profil/page.tsx — en-tête (avatar, palier, rang),
 * statistiques (matchs/victoires/winrate), solde TourneyCard. Édition du
 * profil (pseudo/ville/photo) hors scope pour cet incrément, lecture
 * seule pour l'instant. */
export default function ProfilScreen() {
  const { session, deconnexion } = useAuth();
  const [profil, setProfil] = useState<Profil | null | undefined>(undefined);
  const [solde, setSolde] = useState<number | null>(null);

  const charger = useCallback(async () => {
    const [p, s] = await Promise.all([monProfil(), soldeTourneyCard()]);
    setProfil(p ?? null);
    setSolde(s);
  }, []);

  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger]),
  );

  if (profil === undefined) {
    return (
      <View style={styles.centre}>
        <ActivityIndicator color={theme.color.accent300} />
      </View>
    );
  }

  if (!profil) {
    return (
      <View style={styles.centre}>
        <Text style={styles.texteMuted}>{session?.user.email}</Text>
        <Text style={styles.texteMuted}>Profil pas encore synchronisé.</Text>
      </View>
    );
  }

  const palier = palierActuel(profil.matchsJoues, profil.pointsCumules);
  const winrate = profil.matchsJoues > 0 ? Math.round((profil.victoires / profil.matchsJoues) * 100) : 0;

  return (
    <ScrollView style={styles.ecran} contentContainerStyle={styles.contenu}>
      <View style={styles.entete}>
        <Avatar photoUrl={profil.photoUrl} initiales={initiales(profil.pseudo)} taille={64} />
        <View style={{ flex: 1 }}>
          <View style={styles.ligneNom}>
            <Text style={styles.pseudo}>{profil.pseudo}</Text>
            <PalierBadge palier={palier} taille={28} />
          </View>
          <Text style={styles.texteMuted}>
            {palier.nom}
            {profil.rangNational ? ` · #${profil.rangNational} national` : ""}
            {estActif(profil.matchsJoues) ? " · Actif" : ""}
          </Text>
          {profil.ville && <Text style={styles.texteMuted}>{profil.ville}</Text>}
        </View>
      </View>

      <View style={styles.grilleStats}>
        <Stat label="Matchs" valeur={String(profil.matchsJoues)} />
        <Stat label="Victoires" valeur={String(profil.victoires)} />
        <Stat label="Winrate" valeur={`${winrate}%`} />
      </View>

      <View style={styles.carte}>
        <Text style={styles.carteLabel}>Solde TourneyCard</Text>
        <Text style={styles.carteMontant}>{solde === null ? "…" : formatXof(solde)}</Text>
      </View>

      <Text style={styles.email}>{session?.user.email}</Text>
      <Button variante="secondary" onPress={deconnexion}>Se déconnecter</Button>
    </ScrollView>
  );
}

function Stat({ label, valeur }: { label: string; valeur: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValeur}>{valeur}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: theme.color.bg },
  centre: { flex: 1, alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: theme.color.bg, padding: 24 },
  contenu: { padding: 20, gap: 16 },
  entete: { flexDirection: "row", alignItems: "center", gap: 14 },
  ligneNom: { flexDirection: "row", alignItems: "center", gap: 8 },
  pseudo: { color: theme.color.text, fontSize: 19, fontWeight: "700" },
  texteMuted: { color: theme.color.textMuted, fontSize: 13 },
  grilleStats: { flexDirection: "row", gap: 8 },
  stat: {
    flex: 1,
    alignItems: "center",
    gap: 2,
    backgroundColor: theme.color.surface,
    borderWidth: 1,
    borderColor: theme.color.border,
    borderRadius: theme.radius.md,
    paddingVertical: 12,
  },
  statValeur: { color: theme.color.accent300, fontSize: 17, fontWeight: "700" },
  statLabel: { color: theme.color.muted, fontSize: 11 },
  carte: {
    backgroundColor: theme.color.surface,
    borderWidth: 1,
    borderColor: theme.color.border,
    borderRadius: theme.radius.md,
    padding: 14,
    gap: 4,
  },
  carteLabel: { color: theme.color.muted, fontSize: 12 },
  carteMontant: { color: theme.color.text, fontSize: 20, fontWeight: "700" },
  email: { color: theme.color.textMuted, fontSize: 12, textAlign: "center", marginTop: 8 },
});
