import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { utilisateurConnecte, nonAuthentifie } from "@/lib/server/tournois";
import { versMessagesChatJSON } from "@/lib/server/chat";

/** Tribune des spectateurs (salon "tribune") — lecture ouverte à tous, même
 * sans compte (le mock le permettait aussi). Écriture réservée aux comptes
 * connectés : contrairement au mock (pseudo local "Spectateur" par défaut),
 * un message en base a besoin d'un vrai auteur_id — ajout minimal et
 * raisonnable, cohérent avec le reste de la migration backend. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const match = await prisma.matches.findUnique({ where: { id }, include: { tournois: true } });
  if (!match) return NextResponse.json({ success: false, error: "Match introuvable." }, { status: 404 });

  const messages = await prisma.messages_chat.findMany({
    where: { match_id: id, salon: "tribune" },
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

  const message = await prisma.messages_chat.create({
    data: { tournoi_id: match.tournoi_id, match_id: id, auteur_id: user.id, texte, salon: "tribune" },
  });
  const [json] = await versMessagesChatJSON([message], match.tournois.organisateur_id);
  return NextResponse.json({ success: true, data: json });
}
