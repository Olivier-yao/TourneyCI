import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

/** Même projet Supabase que le site web (cf. .env.local racine,
 * NEXT_PUBLIC_SUPABASE_URL/ANON_KEY) — un client natif n'a pas de cookies,
 * la session est donc persistée dans AsyncStorage et le token envoyé
 * explicitement en header par lib/api.ts. Valeurs lues depuis mobile/.env
 * (EXPO_PUBLIC_*, non commité — cf. mobile/.env.example). */
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
