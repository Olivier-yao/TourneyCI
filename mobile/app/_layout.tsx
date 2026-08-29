import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator } from "react-native";
import { AuthProvider, useAuth } from "@/lib/auth";
import { theme } from "@/theme";

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <RootNavigator />
    </AuthProvider>
  );
}

function RootNavigator() {
  const { session, pret } = useAuth();

  if (!pret) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.color.bg }}>
        <ActivityIndicator color={theme.color.accent300} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.color.bg } }}>
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="tournoi/[id]/index" options={{ presentation: "card" }} />
        <Stack.Screen name="tournoi/[id]/paiement" options={{ presentation: "card" }} />
        <Stack.Screen name="tournoi/[id]/moi" options={{ presentation: "card" }} />
        <Stack.Screen name="tournoi/[id]/bracket" options={{ presentation: "card" }} />
        <Stack.Screen name="tournoi/[id]/chat" options={{ presentation: "card" }} />
        <Stack.Screen name="match/[id]/index" options={{ presentation: "card" }} />
        <Stack.Screen name="organisateur/[id]/gestion" options={{ presentation: "card" }} />
        <Stack.Screen name="organisateur/[id]/scores" options={{ presentation: "card" }} />
      </Stack.Protected>

      <Stack.Protected guard={!session}>
        <Stack.Screen name="sign-in" />
        <Stack.Screen name="sign-up" />
      </Stack.Protected>
    </Stack>
  );
}
