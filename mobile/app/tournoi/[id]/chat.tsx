import { useCallback, useRef, useState } from "react";
import { View, Text, FlatList, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { useLocalSearchParams, useFocusEffect } from "expo-router";
import { chargerChat, envoyerMessage, type MessageChat } from "@/lib/chat";
import { AppBar } from "@/components/AppBar";
import { TextField } from "@/components/TextField";
import { Button } from "@/components/Button";
import { theme } from "@/theme";

const RAFRAICHISSEMENT_MS = 8_000;

/** Chat "des inscrits" (salon "general") — port de
 * src/app/tournois/[id]/chat/page.tsx. Sondage plutôt que Realtime (hors
 * scope Fondations), intervalle court pour rester utilisable en discussion
 * active. */
export default function ChatTournoiScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [messages, setMessages] = useState<MessageChat[]>([]);
  const [texte, setTexte] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const listeRef = useRef<FlatList<MessageChat>>(null);

  useFocusEffect(
    useCallback(() => {
      let annule = false;
      const charger = () => chargerChat(id).then((m) => !annule && setMessages(m));
      charger();
      const intervalle = setInterval(charger, RAFRAICHISSEMENT_MS);
      return () => {
        annule = true;
        clearInterval(intervalle);
      };
    }, [id]),
  );

  async function envoyer() {
    const contenu = texte.trim();
    if (!contenu) return;
    setEnvoi(true);
    const message = await envoyerMessage(id, contenu);
    setEnvoi(false);
    if (message) {
      setMessages((m) => [...m, message]);
      setTexte("");
    }
  }

  return (
    <KeyboardAvoidingView style={styles.ecran} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <AppBar titre="Chat du tournoi" />
      <FlatList
        ref={listeRef}
        style={styles.liste}
        contentContainerStyle={styles.contenuListe}
        data={messages}
        keyExtractor={(m) => m.id}
        onContentSizeChange={() => listeRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={<Text style={styles.texteMuted}>Aucun message pour l'instant.</Text>}
        renderItem={({ item }) => (
          <View style={styles.message}>
            <Text style={styles.auteur}>
              {item.auteur} {item.role === "organisateur" && <Text style={styles.badgeOrga}>ORGA</Text>}
            </Text>
            <Text style={styles.texte}>{item.texte}</Text>
          </View>
        )}
      />
      <View style={styles.barreEnvoi}>
        <View style={styles.champ}>
          <TextField placeholder="Écrire un message..." value={texte} onChangeText={setTexte} />
        </View>
        <Button disabled={!texte.trim() || envoi} onPress={envoyer}>Envoyer</Button>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: theme.color.bg },
  liste: { flex: 1 },
  contenuListe: { padding: 16, gap: 12 },
  texteMuted: { color: theme.color.textMuted, fontSize: 13, textAlign: "center", marginTop: 20 },
  message: { gap: 2 },
  auteur: { color: theme.color.accent300, fontSize: 12, fontWeight: "600" },
  badgeOrga: { color: theme.color.muted, fontSize: 10, fontWeight: "700" },
  texte: { color: theme.color.text, fontSize: 14 },
  barreEnvoi: { flexDirection: "row", alignItems: "flex-end", gap: 8, padding: 12, borderTopWidth: 1, borderTopColor: theme.color.border },
  champ: { flex: 1 },
});
