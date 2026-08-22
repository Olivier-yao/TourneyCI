import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { utilisateurConnecte, nonAuthentifie } from "@/lib/server/tournois";
import { versAvisTournoiJSON, compteAvisTournoi } from "@/lib/server/avis";

/** Public : compteur cœurs/cœurs brisés du tournoi, visible de tous. "mon"
 * (l'avis du visiteur connecté, s'il en a laissé un) n'est renseigné que
 * pour un visiteur authentifié. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const compte = await compteAvisTournoi(id);
  const user = await utilisateurConnecte();
  const mon = user
    ? await prisma.avis_tournoi.findUnique({ where: { tournoi_id_auteur_id: { tournoi_id: id, auteur_id: user.id } } })
    : null;
  return NextResponse.json({ success: true, data: { ...compte, mon: mon ? versAvisTournoiJSON(mon) : null } });
}

/** Un seul avis par tournoi et par compte (contrainte unique en base) — un
 * second envoi renvoie simplement l'avis déjà posé, sans erreur. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await utilisateurConnecte();
  if (!user) return nonAuthentifie();

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const type = body?.type;
  if (type !== "coeur" && type !== "coeur_brise") {
    return NextResponse.json({ success: false, error: "Type d'avis invalide." }, { status: 400 });
  }
  const message = typeof body?.message === "string" ? body.message.trim() || undefined : undefined;

  const existant = await prisma.avis_tournoi.findUnique({
    where: { tournoi_id_auteur_id: { tournoi_id: id, auteur_id: user.id } },
  });
  if (existant) return NextResponse.json({ success: true, data: versAvisTournoiJSON(existant) });

  const avis = await prisma.avis_tournoi.create({ data: { tournoi_id: id, auteur_id: user.id, type, message } });
  return NextResponse.json({ success: true, data: versAvisTournoiJSON(avis) });
}
