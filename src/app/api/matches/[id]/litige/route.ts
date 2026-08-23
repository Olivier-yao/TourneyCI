import { NextResponse } from "next/server";
import { utilisateurConnecte, nonAuthentifie } from "@/lib/server/tournois";
import { litigeDuMatch, creerLitige, ajouterPreuveLitige, resoudreLitige, peutVoirLitigeDuMatch } from "@/lib/server/litiges";
import { prisma } from "@/lib/prisma";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await utilisateurConnecte();
  if (!user) return nonAuthentifie();

  const { id } = await params;
  const profil = await prisma.profiles.findUnique({ where: { id: user.id }, select: { pseudo: true } });
  if (!profil || !(await peutVoirLitigeDuMatch(id, user.id, profil.pseudo))) {
    return NextResponse.json({ success: true, data: null });
  }

  const litige = await litigeDuMatch(id);
  return NextResponse.json({ success: true, data: litige ?? null });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await utilisateurConnecte();
  if (!user) return nonAuthentifie();

  const { id } = await params;
  const profil = await prisma.profiles.findUnique({ where: { id: user.id }, select: { pseudo: true } });
  if (!profil) return NextResponse.json({ success: false, error: "Profil introuvable." }, { status: 400 });

  const body = await request.json().catch(() => null);
  const motifId = typeof body?.motifId === "string" ? body.motifId : "";
  const description = typeof body?.description === "string" ? body.description.trim() : "";
  const preuves = Array.isArray(body?.preuves) ? body.preuves.filter((p: unknown): p is string => typeof p === "string") : [];

  const resultat = await creerLitige(user.id, profil.pseudo, { matchId: id, motifId, description, preuves });
  if (!resultat.ok) return NextResponse.json({ success: false, error: resultat.erreur }, { status: 400 });
  return NextResponse.json({ success: true, data: resultat.data });
}

/** action "preuve" (réservé à l'auteur du litige) ou "resoudre" (réservé à
 * l'organisateur du tournoi/un adjoint accepté). */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await utilisateurConnecte();
  if (!user) return nonAuthentifie();

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const litige = await litigeDuMatch(id);
  if (!litige) return NextResponse.json({ success: false, error: "Litige introuvable." }, { status: 404 });

  if (body?.action === "preuve") {
    const nomFichier = typeof body?.nomFichier === "string" ? body.nomFichier : "";
    if (!nomFichier) return NextResponse.json({ success: false, error: "Fichier requis." }, { status: 400 });
    const maj = await ajouterPreuveLitige(litige.id, user.id, nomFichier);
    if (!maj) return NextResponse.json({ success: false, error: "Action non autorisée." }, { status: 403 });
    return NextResponse.json({ success: true, data: maj });
  }

  if (body?.action === "resoudre") {
    const statut = body?.statut === "resolu_faveur" || body?.statut === "rejete" ? body.statut : null;
    if (!statut) return NextResponse.json({ success: false, error: "Statut invalide." }, { status: 400 });
    const maj = await resoudreLitige(litige.id, user.id, statut);
    if (!maj) return NextResponse.json({ success: false, error: "Action non autorisée." }, { status: 403 });
    return NextResponse.json({ success: true, data: maj });
  }

  return NextResponse.json({ success: false, error: "Action inconnue." }, { status: 400 });
}
