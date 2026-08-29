import { View, Text, Image, StyleSheet } from "react-native";
import { theme } from "@/theme";

/** Port de src/components/ds/Avatar.tsx — photo si disponible, sinon
 * initiales sur fond teinté accent (jamais d'icône générique). */
export function Avatar({ photoUrl, initiales, taille = 56 }: { photoUrl?: string; initiales: string; taille?: number }) {
  return (
    <View style={[styles.cercle, { width: taille, height: taille, borderRadius: taille / 2 }]}>
      {photoUrl ? (
        <Image source={{ uri: photoUrl }} style={{ width: taille, height: taille, borderRadius: taille / 2 }} />
      ) : (
        <Text style={[styles.initiales, { fontSize: taille * 0.36 }]}>{initiales}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cercle: {
    backgroundColor: theme.color.accent900,
    borderWidth: 1,
    borderColor: theme.color.accent600,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  initiales: { color: theme.color.accent300, fontWeight: "700" },
});
