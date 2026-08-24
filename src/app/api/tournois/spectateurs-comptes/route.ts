import { NextResponse } from "next/server";
import { compteSpectateursTribunePlusieurs } from "@/lib/server/chat";

/** Nombre réel de spectateurs actifs (comptes distincts ayant écrit dans la
 * tribune récemment), pour plusieurs tournois en un seul appel
 * (`?ids=a,b,c`) — remplace le nombre simulé précédent, même pattern que
 * /api/tournois/manches-br-comptes. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ids = (searchParams.get("ids") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const comptes = await compteSpectateursTribunePlusieurs(ids);
  return NextResponse.json({ success: true, data: comptes });
}
