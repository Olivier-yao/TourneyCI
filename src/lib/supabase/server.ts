import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/** Client Supabase serveur (Route Handlers, Server Components) — lit/écrit
 * la session via les cookies de la requête Next.js. L'écriture peut échouer
 * silencieusement si appelée depuis un Server Component pur (pas de Route
 * Handler/Server Action) : sans conséquence tant que le middleware
 * rafraîchit déjà la session à chaque requête. */
export async function creerClientSupabaseServeur() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesASetter) {
          try {
            cookiesASetter.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Appel depuis un Server Component sans Route Handler/Server
            // Action : ignorable, cf. commentaire ci-dessus.
          }
        },
      },
    },
  );
}
