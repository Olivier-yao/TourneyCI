import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { utilisateurConnecte, nonAuthentifie } from "@/lib/server/tournois";
import { versMessagesChatJSON } from "@/lib/server/chat";
import { estAdjointAccepteDe } from "@/lib/server/adjoints";

async function autoriseInscrit(tournoiId: string, organisateurId: string, userId: string): Promise<boolean> {
  if (organisateurId === userId || (await estAdjointAccepteDe(organisateurId, userId))) return true;
  const inscription = await prisma.inscriptions.findUnique({ where: { tournoi_id_profile_id: { tournoi_id: tournoiId, profile_id: userId } } });
  return Boolean(inscription);
}

function interdit() {
  return NextResponse.json({ success: false, error: "Réservé aux inscrits de ce tournoi et à l'organisateur." }, { status: 403 });
}

/** Salon des inscrits (salon "inscrits") — entièrement privé, à la
 * différence de la tribune : lecture ET écriture réservées aux inscrits du
 * tournoi et à l'organisateur/ses adjoints. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await utilisateurConnecte();
  if (!user) return nonAuthentifie();

  const { id } = await params;
  const match = await prisma.matches.findUnique({ where: { id }, include: { tournois: true } });
  if (!match) return NextResponse.json({ success: false, error: "Match introuvable." }, { status: 404 });

  if (!(await autoriseInscrit(match.tournoi_id, match.tournois.organisateur_id, user.id))) return interdit();

  const messages = await prisma.messages_chat.findMany({
    where: { match_id: id, salon: "inscrits" },
    orderBy: { created_at: "asc" },
  });
  return NextResponse.json({ success: true, data: await versMessagesChatJSON(messages, match.tournois.organisateur_id) });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await utilisateurConnecte();
  if (!user) return nonAuthentifie();

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const texte = typeof body?.texte === "string" ? body.texte.trim() : "";
  if (!texte) return NextResponse.json({ success: false, error: "Texte requis." }, { status: 400 });

  const match = await prisma.matches.findUnique({ where: { id }, include: { tournois: true } });
  if (!match) return NextResponse.json({ success: false, error: "Match introuvable." }, { status: 404 });

  if (!(await autoriseInscrit(match.tournoi_id, match.tournois.organisateur_id, user.id))) return interdit();

  const message = await prisma.messages_chat.create({
    data: { tournoi_id: match.tournoi_id, match_id: id, auteur_id: user.id, texte, salon: "inscrits" },
  });
  const [json] = await versMessagesChatJSON([message], match.tournois.organisateur_id);
  return NextResponse.json({ success: true, data: json });
}
