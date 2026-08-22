import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { utilisateurConnecte, nonAuthentifie } from "@/lib/server/tournois";
import { versAppelJSON } from "@/lib/server/appels";

/** Liste globale des appels ouverts, tous tournois confondus — consultée par
 * l'écran d'admin (/admin/moderation, AdminGate). Pas de vrai rôle admin
 * dans le modèle de données pour l'instant (cf. AdminGate) : réservé aux
 * comptes connectés plutôt que laissé public, seule barrière réelle
 * disponible aujourd'hui. */
export async function GET() {
  const user = await utilisateurConnecte();
  if (!user) return nonAuthentifie();

  const appels = await prisma.appels.findMany({
    where: { statut: "ouvert" },
    include: { tournois: true, profiles: true },
    orderBy: { created_at: "desc" },
  });
  return NextResponse.json({ success: true, data: appels.map(versAppelJSON) });
}
