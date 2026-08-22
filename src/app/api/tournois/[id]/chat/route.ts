import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { utilisateurConnecte, nonAuthentifie } from "@/lib/server/tournois";
import { versMessagesChatJSON } from "@/lib/server/chat";
import { estAdjointAccepteDe } from "@/lib/server/adjoints";

/** Chat du tournoi (salon "general") — lecture publique, écriture réservée
 * aux inscrits et à l'organisateur/ses adjoints (même règle que côté
 * client, cf. ChatTournoiPage). */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tournoi = await prisma.tournois.findUnique({ where: { id } });
  if (!tournoi) return NextResponse.json({ success: false, error: "Tournoi introuvable." }, { status: 404 });

  const messages = await prisma.messages_chat.findMany({
    where: { tournoi_id: id, salon: "general" },
    orderBy: { created_at: "asc" },
  });
  return NextResponse.json({ success: true, data: await versMessagesChatJSON(messages, tournoi.organisateur_id) });
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

  const estOrganisateur = tournoi.organisateur_id === user.id || (await estAdjointAccepteDe(tournoi.organisateur_id, user.id));
  const estInscrit = !estOrganisateur
    ? await prisma.inscriptions.findUnique({ where: { tournoi_id_profile_id: { tournoi_id: id, profile_id: user.id } } })
    : null;
  if (!estOrganisateur && !estInscrit) {
    return NextResponse.json({ success: false, error: "Réservé aux inscrits et à l'organisateur de ce tournoi." }, { status: 403 });
  }

  const message = await prisma.messages_chat.create({ data: { tournoi_id: id, auteur_id: user.id, texte, salon: "general" } });
  const [json] = await versMessagesChatJSON([message], tournoi.organisateur_id);
  return NextResponse.json({ success: true, data: json });
}
