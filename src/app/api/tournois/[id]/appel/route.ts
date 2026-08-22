import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { utilisateurConnecte, nonAuthentifie } from "@/lib/server/tournois";
import { versAppelJSON } from "@/lib/server/appels";

/** "ouvert" (un appel est en cours sur ce tournoi, quel qu'en soit l'auteur —
 * bloque le versement du cash prize en séquestre) est public. "mon" (l'appel
 * du visiteur connecté) n'est renseigné que pour un visiteur authentifié. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ouvert = (await prisma.appels.count({ where: { tournoi_id: id, statut: "ouvert" } })) > 0;

  const user = await utilisateurConnecte();
  let mon = null;
  if (user) {
    const ligne = await prisma.appels.findUnique({
      where: { tournoi_id_auteur_id: { tournoi_id: id, auteur_id: user.id } },
      include: { tournois: true, profiles: true },
    });
    mon = ligne ? versAppelJSON(ligne) : null;
  }

  return NextResponse.json({ success: true, data: { ouvert, mon } });
}

/** Un seul appel par tournoi et par compte (contrainte unique en base). */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await utilisateurConnecte();
  if (!user) return nonAuthentifie();

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const motif = typeof body?.motif === "string" ? body.motif.trim() : "";
  if (!motif) return NextResponse.json({ success: false, error: "Motif requis." }, { status: 400 });

  const existant = await prisma.appels.findUnique({
    where: { tournoi_id_auteur_id: { tournoi_id: id, auteur_id: user.id } },
  });
  if (existant) return NextResponse.json({ success: true });

  await prisma.appels.create({ data: { tournoi_id: id, auteur_id: user.id, motif } });
  return NextResponse.json({ success: true });
}
