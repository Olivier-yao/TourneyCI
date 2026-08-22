import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { utilisateurConnecte, nonAuthentifie } from "@/lib/server/tournois";
import { messagesTribuneJSON, envoyerMessageTribune, versMessagesChatJSON } from "@/lib/server/chat";

/** Point d'entrée "je suis sur un match précis" vers la tribune du tournoi —
 * délègue entièrement à src/lib/server/chat.ts (même fil que
 * /api/tournois/[id]/chat-spectateurs, cf. son commentaire). */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const match = await prisma.matches.findUnique({ where: { id }, include: { tournois: true } });
  if (!match) return NextResponse.json({ success: false, error: "Match introuvable." }, { status: 404 });

  return NextResponse.json({ success: true, data: await messagesTribuneJSON(match.tournoi_id, match.tournois.organisateur_id) });
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

  const message = await envoyerMessageTribune(match.tournoi_id, user.id, texte);
  const [json] = await versMessagesChatJSON([message], match.tournois.organisateur_id);
  return NextResponse.json({ success: true, data: json });
}
