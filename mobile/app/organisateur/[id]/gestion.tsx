import { useCallback, useState } from "react";
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Pressable, KeyboardAvoidingView, Platform } from "react-native";
import { useLocalSearchParams, router, useFocusEffect } from "expo-router";
import { tournoiParId, type Tournoi } from "@/lib/tournois";
import { infosRoomDuTournoi, definirInfosRoom, type InfosRoom } from "@/lib/room";
import { AppBar } from "@/components/AppBar";
import { Button } from "@/components/Button";
import { TextField } from "@/components/TextField";
import { theme } from "@/theme";

/** Port simplifié de src/app/organisateur/[id]/room/page.tsx — lien/mot de
 * passe de la room uniquement. La notification ciblée par duel (envoi
 * "à ce joueur précis" côté web) reste hors scope : le système de
 * notifications n'existe pas encore côté mobile. */
export default function GestionTournoiScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [tournoi, setTournoi] = useState<Tournoi | null | undefined>(undefined);
  const [room, setRoom] = useState<InfosRoom>({ lien: "", motDePasse: "" });
  const [enregistrement, setEnregistrement] = useState(false);
  const [enregistre, setEnregistre] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      Promise.all([tournoiParId(id), infosRoomDuTournoi(id)]).then(([t, r]) => {
        setTournoi(t ?? null);
        setRoom(r);
      });
    }, [id]),
  );

  async function enregistrer() {
    setErreur(null);
    setEnregistrement(true);
    const ok = await definirInfosRoom(id, room);
    setEnregistrement(false);
    if (!ok) {
      setErreur("Impossible d'enregistrer — vérifie que tu es bien l'organisateur de ce tournoi.");
      return;
    }
    setEnregistre(true);
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
        <AppBar titre="Gestion" />
        <View style={styles.centre}>
          <Text style={styles.texteMuted}>Tournoi introuvable.</Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.ecran} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <AppBar titre={tournoi.titre} />
      <ScrollView contentContainerStyle={styles.contenu}>
        <Text style={styles.texteMuted}>
          {tournoi.jeuLabel} · {tournoi.placesInscrites}/{tournoi.placesTotal} inscrits
        </Text>

        <View style={styles.bloc}>
          <Text style={styles.blocTitre}>Infos de room</Text>
          <TextField
            label="Lien"
            placeholder="https://..."
            value={room.lien}
            onChangeText={(v) => {
              setRoom((r) => ({ ...r, lien: v }));
              setEnregistre(false);
            }}
            autoCapitalize="none"
          />
          <TextField
            label="Mot de passe"
            placeholder="(optionnel)"
            value={room.motDePasse}
            onChangeText={(v) => {
              setRoom((r) => ({ ...r, motDePasse: v }));
              setEnregistre(false);
            }}
            autoCapitalize="none"
          />
          {erreur && <Text style={styles.erreur}>{erreur}</Text>}
          <Button disabled={enregistrement} onPress={enregistrer}>
            {enregistrement ? "..." : enregistre ? "Enregistré ✓" : "Enregistrer"}
          </Button>
        </View>

        {tournoi.type === "battle_royale" ? (
          <Text style={styles.texteMuted}>Saisie des manches Battle Royale pas encore disponible dans l'app.</Text>
        ) : (
          <Pressable onPress={() => router.push({ pathname: "/organisateur/[id]/scores", params: { id } })}>
            <Text style={styles.lien}>Saisie des scores →</Text>
          </Pressable>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: theme.color.bg },
  centre: { flex: 1, alignItems: "center", justifyContent: "center" },
  contenu: { padding: 16, paddingBottom: 32, gap: 16 },
  texteMuted: { color: theme.color.textMuted, fontSize: 13 },
  bloc: { gap: 10 },
  blocTitre: { color: theme.color.text, fontSize: 15, fontWeight: "700" },
  erreur: { color: theme.color.danger, fontSize: 13 },
  lien: { color: theme.color.accent300, fontSize: 14, fontWeight: "600" },
});
