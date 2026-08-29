import { useState } from "react";
import { View, Text, ScrollView, StyleSheet, Pressable, FlatList, KeyboardAvoidingView, Platform } from "react-native";
import { router } from "expo-router";
import { creerTournoi } from "@/lib/organisateur";
import { JEUX } from "@/lib/jeux";
import { AppBar } from "@/components/AppBar";
import { Button } from "@/components/Button";
import { TextField } from "@/components/TextField";
import { theme } from "@/theme";

const MARGE_CHECKIN_DEFAUT_MIN = 30;

/** Port simplifié de src/app/organisateur/nouveau/page.tsx — modalité
 * "virtuel" uniquement (pas de sélection de ville), 1v1/Équipes libre
 * uniquement (Battle Royale hors scope), pas de répartition personnalisée
 * du cash prize ni de commission organisateur. Pas de sélecteur date/heure
 * natif (dépendance supplémentaire) : le début se saisit en "dans combien
 * d'heures", plus simple à saisir au clavier tactile que composer une
 * date complète. */
export default function NouveauTournoiScreen() {
  const [titre, setTitre] = useState("");
  const [jeuId, setJeuId] = useState(JEUX[0].id);
  const [type, setType] = useState<"1v1" | "equipes">("1v1");
  const [manchesParMatch, setManchesParMatch] = useState(1);
  const [placesTotal, setPlacesTotal] = useState("8");
  const [dansHeures, setDansHeures] = useState("2");
  const [margeCheckinMin, setMargeCheckinMin] = useState(String(MARGE_CHECKIN_DEFAUT_MIN));
  const [fraisXof, setFraisXof] = useState("0");
  const [cashPrizeXof, setCashPrizeXof] = useState("0");
  const [reglement, setReglement] = useState("");
  const [organisateurNom, setOrganisateurNom] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const valide = titre.trim().length > 0 && reglement.trim().length > 0 && Number(placesTotal) >= 2 && Number(dansHeures) > 0;

  async function creer() {
    setErreur(null);
    const heures = Number(dansHeures);
    const marge = Number(margeCheckinMin);
    if (!Number.isFinite(heures) || heures <= 0) {
      setErreur("Indique dans combien d'heures le tournoi commence.");
      return;
    }
    const debutTournoiTs = Date.now() + heures * 60 * 60 * 1000;
    const checkinTs = debutTournoiTs - Math.max(0, marge) * 60 * 1000;

    setEnCours(true);
    const resultat = await creerTournoi({
      titre: titre.trim(),
      jeuId,
      type,
      placesTotal: Math.max(2, Math.round(Number(placesTotal)) || 2),
      debutTournoiTs,
      checkinTs,
      reglement: reglement.trim(),
      fraisXof: Math.max(0, Math.round(Number(fraisXof)) || 0),
      cashPrizeXof: Math.max(0, Math.round(Number(cashPrizeXof)) || 0),
      manchesParMatch,
      organisateurNom: organisateurNom.trim() || undefined,
    });
    setEnCours(false);
    if (!resultat.ok) {
      setErreur(resultat.erreur);
      return;
    }
    router.replace({ pathname: "/organisateur/[id]/gestion", params: { id: resultat.id } });
  }

  return (
    <KeyboardAvoidingView style={styles.ecran} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <AppBar titre="Nouveau tournoi" />
      <ScrollView contentContainerStyle={styles.contenu}>
        <TextField label="Titre" placeholder="Nom du tournoi" value={titre} onChangeText={setTitre} />

        <View style={styles.bloc}>
          <Text style={styles.label}>Jeu</Text>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={JEUX}
            keyExtractor={(j) => j.id}
            contentContainerStyle={{ gap: 8 }}
            renderItem={({ item }) => (
              <Pressable
                style={[styles.chip, jeuId === item.id && styles.chipActif]}
                onPress={() => setJeuId(item.id)}
              >
                <Text style={[styles.chipTexte, jeuId === item.id && styles.chipTexteActif]}>{item.label}</Text>
              </Pressable>
            )}
          />
        </View>

        <View style={styles.bloc}>
          <Text style={styles.label}>Format</Text>
          <View style={styles.segments}>
            {(["1v1", "equipes"] as const).map((t) => (
              <Pressable key={t} style={[styles.segment, type === t && styles.segmentActif]} onPress={() => setType(t)}>
                <Text style={[styles.segmentTexte, type === t && styles.segmentTexteActif]}>{t === "1v1" ? "1v1" : "Équipes"}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.bloc}>
          <Text style={styles.label}>Matchs en</Text>
          <View style={styles.segments}>
            {[1, 3, 5].map((n) => (
              <Pressable key={n} style={[styles.segment, manchesParMatch === n && styles.segmentActif]} onPress={() => setManchesParMatch(n)}>
                <Text style={[styles.segmentTexte, manchesParMatch === n && styles.segmentTexteActif]}>BO{n}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <TextField label="Places totales" keyboardType="number-pad" value={placesTotal} onChangeText={setPlacesTotal} />
        <TextField label="Démarre dans (heures)" keyboardType="number-pad" value={dansHeures} onChangeText={setDansHeures} />
        <TextField label="Check-in ouvre (minutes avant le début)" keyboardType="number-pad" value={margeCheckinMin} onChangeText={setMargeCheckinMin} />
        <TextField label="Frais d'inscription (CFA, 0 = gratuit)" keyboardType="number-pad" value={fraisXof} onChangeText={setFraisXof} />
        <TextField label="Cash prize financé par toi (CFA, optionnel)" keyboardType="number-pad" value={cashPrizeXof} onChangeText={setCashPrizeXof} />
        <TextField label="Nom d'organisateur (optionnel)" placeholder="Ton pseudo par défaut" value={organisateurNom} onChangeText={setOrganisateurNom} />
        <TextField label="Règlement" placeholder="Règles du tournoi..." value={reglement} onChangeText={setReglement} multiline style={styles.reglement} />

        {erreur && <Text style={styles.erreur}>{erreur}</Text>}
        <Button disabled={!valide || enCours} onPress={creer}>{enCours ? "Création..." : "Créer le tournoi"}</Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: theme.color.bg },
  contenu: { padding: 16, paddingBottom: 32, gap: 14 },
  bloc: { gap: 8 },
  label: { color: theme.color.muted, fontSize: 12, fontWeight: "500" },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.color.border,
  },
  chipActif: { borderColor: theme.color.accent },
  chipTexte: { color: theme.color.text, fontSize: 13 },
  chipTexteActif: { color: theme.color.accent300, fontWeight: "600" },
  segments: { flexDirection: "row", gap: 8 },
  segment: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.color.border,
  },
  segmentActif: { borderColor: theme.color.accent, backgroundColor: theme.color.accent900 },
  segmentTexte: { color: theme.color.text, fontSize: 13 },
  segmentTexteActif: { color: theme.color.accent300, fontWeight: "600" },
  reglement: { height: 90, textAlignVertical: "top", paddingTop: 10 },
  erreur: { color: theme.color.danger, fontSize: 13 },
});
