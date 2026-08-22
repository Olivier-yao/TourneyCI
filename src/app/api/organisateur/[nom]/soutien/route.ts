import { NextResponse } from "next/server";
import { utilisateurConnecte, nonAuthentifie } from "@/lib/server/tournois";
import { profileIdDepuisNomOrganisateur } from "@/lib/server/adjoints";
import { monSoutien, creerSoutien } from "@/lib/server/soutien";

/** "Mon" soutien à cet organisateur — false pour un visiteur non connecté,
 * jamais d'erreur (même convention que GET /api/tournois/[id]/avis). */
export async function GET(_request: Request, { params }: { params: Promise<{ nom: string }> }) {
  const { nom } = await params;
  const profileId = await profileIdDepuisNomOrganisateur(decodeURIComponent(nom));
  const user = await utilisateurConnecte();
  if (!profileId || !user) return NextResponse.json({ success: true, data: { monSoutien: false } });

  const soutien = await monSoutien(user.id, profileId);
  return NextResponse.json({ success: true, data: { monSoutien: Boolean(soutien) } });
}

/** Envoie le soutien, associé au tournoi depuis lequel il a été déclenché
 * (point 64). Idempotent : un second envoi ne fait pas échouer l'action. */
export async function POST(request: Request, { params }: { params: Promise<{ nom: string }> }) {
  const user = await utilisateurConnecte();
  if (!user) return nonAuthentifie();

  const { nom } = await params;
  const profileId = await profileIdDepuisNomOrganisateur(decodeURIComponent(nom));
  if (!profileId) return NextResponse.json({ success: false, error: "Organisateur introuvable." }, { status: 404 });

  const body = await request.json().catch(() => null);
  const tournoiId = typeof body?.tournoiId === "string" ? body.tournoiId : undefined;

  await creerSoutien(user.id, profileId, tournoiId);
  return NextResponse.json({ success: true, data: { monSoutien: true } });
}
