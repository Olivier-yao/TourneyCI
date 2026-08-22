import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { utilisateurConnecte, nonAuthentifie } from "@/lib/server/tournois";
import { messagesTribuneJSON, envoyerMessageTribune, versMessagesChatJSON } from "@/lib/server/chat";

/** Point d'entrée "je suis sur la fiche du tournoi en direct, aucun match
 * précis" vers la tribune (même fil que /api/matches/[id]/chat, cf. le
 * commentaire de src/lib/server/chat.ts) — nécessaire notamment quand le
 * tournoi est en direct (heure de début atteinte) mais qu'aucun match n'a
 * encore été généré (bracket pas encore lancé côté organisateur). */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tournoi = await prisma.tournois.findUnique({ where: { id } });
  if (!tournoi) return NextResponse.json({ success: false, error: "Tournoi introuvable." }, { status: 404 });

  return NextResponse.json({ success: true, data: await messagesTribuneJSON(id, tournoi.organisateur_id) });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await utilisateurConnecte();
  if (!user) return nonAuthentifie();

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const texte = typeof body?.texte === "string" ? body.texte.trim() : "";
  if (!texte) return NextResponse.json({ success: false, error: "Texte requis." }, { status: 400 });

  const tournoi = await prisma.tournois.findUnique({ where: { id } });
  if (!tournoi) return NextResponse.json({ success: false, error: "Tournoi introuvable." }, { status: 404 });

  const message = await envoyerMessageTribune(id, user.id, texte);
  const [json] = await versMessagesChatJSON([message], tournoi.organisateur_id);
  return NextResponse.json({ success: true, data: json });
}
