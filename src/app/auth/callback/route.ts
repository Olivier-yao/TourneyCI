import { NextResponse } from "next/server";
import { creerClientSupabaseServeur } from "@/lib/supabase/server";

/** Point de retour du flux OAuth Google (`signInWithOAuth`) : échange le
 * code contre une session, puis renvoie vers /verify — c'est cette page qui
 * détecte la session fraîche et route vers la bonne destination
 * (bienvenue-profil / règlement / accueil), pas cette route serveur qui n'a
 * pas accès aux flags localStorage. */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await creerClientSupabaseServeur();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}/verify?oauth=1`);
    }
  }

  return NextResponse.redirect(`${origin}/verify?erreur=oauth`);
}
