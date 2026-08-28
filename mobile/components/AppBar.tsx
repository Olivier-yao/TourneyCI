import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { theme } from "@/theme";

export function AppBar({ titre }: { titre: string }) {
  return (
    <View style={styles.barre}>
      <Pressable onPress={() => router.back()} hitSlop={12} style={styles.bouton}>
        <Ionicons name="chevron-back" size={22} color={theme.color.text} />
      </Pressable>
      <Text style={styles.titre} numberOfLines={1}>{titre}</Text>
      <View style={styles.bouton} />
    </View>
  );
}

const styles = StyleSheet.create({
  barre: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingTop: 8, paddingBottom: 4, gap: 8 },
  bouton: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  titre: { flex: 1, color: theme.color.text, fontSize: 16, fontWeight: "600", textAlign: "center" },
});
