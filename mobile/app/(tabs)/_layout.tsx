import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "@/theme";

/** Mêmes 5 onglets que le web (src/components/ds/TabBar.tsx) — seul Accueil
 * est un écran réel dans cet incrément, les 4 autres sont des placeholders
 * "à venir" (cf. plan Fondations, hors scope : organisateur/classement/
 * profil réels, inscription/détail tournoi). */
export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.color.accent300,
        tabBarInactiveTintColor: theme.color.muted,
        tabBarStyle: {
          backgroundColor: theme.color.bg,
          borderTopColor: theme.color.border,
        },
        tabBarLabelStyle: { fontSize: 10 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Accueil", tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="tournois"
        options={{ title: "Tournois", tabBarIcon: ({ color, size }) => <Ionicons name="trophy-outline" color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="organisateur"
        options={{ title: "Organisateur", tabBarIcon: ({ color, size }) => <Ionicons name="megaphone-outline" color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="classement"
        options={{ title: "Classement", tabBarIcon: ({ color, size }) => <Ionicons name="stats-chart-outline" color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="profil"
        options={{ title: "Profil", tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" color={color} size={size} /> }}
      />
    </Tabs>
  );
}
