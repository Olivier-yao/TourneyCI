import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Rafraîchit la session Supabase (token proche de l'expiration) à chaque
 * requête et repropage les cookies mis à jour — sans ça, une session peut
 * expirer silencieusement côté client entre deux vérifications. */
export async function middleware(request: NextRequest) {
  let reponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesASetter) {
          cookiesASetter.forEach(({ name, value }) => request.cookies.set(name, value));
          reponse = NextResponse.next({ request });
          cookiesASetter.forEach(({ name, value, options }) => reponse.cookies.set(name, value, options));
        },
      },
    },
  );

  await supabase.auth.getUser();

  return reponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
