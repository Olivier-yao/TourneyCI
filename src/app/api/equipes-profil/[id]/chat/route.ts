import { NextResponse } from "next/server";
import { utilisateurConnecte, nonAuthentifie } from "@/lib/server/tournois";
import { estMembreEquipeProfil, messagesChatEquipeJSON, envoyerMessageChatEquipe } from "@/lib/server/chatEquipe";

/** Chat d'équipe (design v8, lot N1) — privé, réservé aux membres de
 * l'équipe (chef inclus). */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await utilisateurConnecte();
  if (!user) return nonAuthentifie();

  const { id } = await params;
  if (!(await estMembreEquipeProfil(id, user.id))) {
    return NextResponse.json({ success: false, error: "Équipe introuvable." }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: await messagesChatEquipeJSON(id) });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await utilisateurConnecte();
  if (!user) return nonAuthentifie();

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const texte = typeof body?.texte === "string" ? body.texte.trim() : "";
  if (!texte) return NextResponse.json({ success: false, error: "Texte requis." }, { status: 400 });

  if (!(await estMembreEquipeProfil(id, user.id))) {
    return NextResponse.json({ success: false, error: "Équipe introuvable." }, { status: 404 });
  }

  await envoyerMessageChatEquipe(id, user.id, texte);
  return NextResponse.json({ success: true, data: await messagesChatEquipeJSON(id) });
}
