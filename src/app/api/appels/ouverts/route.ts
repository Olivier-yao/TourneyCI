import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sessionAdminValide } from "@/lib/server/adminAuth";
import { versAppelJSON } from "@/lib/server/appels";

/** Liste globale des appels ouverts, tous tournois confondus — consultée par
 * l'écran d'admin (/admin/moderation). AdminGate (déterrent client, code
 * visible dans le bundle JS) ne protège pas cette route : la vraie barrière
 * est la session admin de /tourney-control, même vérification que les autres
 * routes de supervision admin (cf. /api/tourney-control/litiges par ex.). */
export async function GET() {
  if (!(await sessionAdminValide())) {
    return NextResponse.json({ success: false, error: "Non authentifié." }, { status: 401 });
  }

  const appels = await prisma.appels.findMany({
    where: { statut: "ouvert" },
    include: { tournois: true, profiles: true },
    orderBy: { created_at: "desc" },
  });
  return NextResponse.json({ success: true, data: appels.map(versAppelJSON) });
}
