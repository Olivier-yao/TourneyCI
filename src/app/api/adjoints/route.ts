import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { utilisateurConnecte, nonAuthentifie } from "@/lib/server/tournois";
import { versAdjointsJSON, profileIdDepuisNomOrganisateur } from "@/lib/server/adjoints";

export async function GET() {
  const user = await utilisateurConnecte();
  if (!user) return nonAuthentifie();

  const [proprietaireDe, adjointDe] = await Promise.all([
    prisma.adjoints_organisateur.findMany({ where: { proprietaire_id: user.id }, orderBy: { created_at: "desc" } }),
    prisma.adjoints_organisateur.findMany({ where: { adjoint_id: user.id }, orderBy: { created_at: "desc" } }),
  ]);

  const adjoints = await versAdjointsJSON(proprietaireDe);
  const invitationsRecues = await versAdjointsJSON(adjointDe.filter((l) => l.statut === "en_attente"));
  const supervise = await versAdjointsJSON(adjointDe.filter((l) => l.statut === "accepte"));

  return NextResponse.json({
    success: true,
    data: { adjoints, invitationsRecues, proprietairesSupervises: supervise.map((a) => a.proprietaire) },
  });
}

/** Envoie une invitation — proprietaire toujours dérivé de la session,
 * jamais du corps de la requête. */
export async function POST(request: Request) {
  const user = await utilisateurConnecte();
  if (!user) return nonAuthentifie();

  const body = await request.json().catch(() => null);
  const nomAdjoint = typeof body?.nomAdjoint === "string" ? body.nomAdjoint.trim() : "";
  if (!nomAdjoint) {
    return NextResponse.json({ success: false, error: "Indique le nom de l'organisateur à inviter." }, { status: 400 });
  }

  const adjointId = await profileIdDepuisNomOrganisateur(nomAdjoint);
  if (!adjointId) {
    return NextResponse.json({ success: false, error: "Aucun organisateur ne correspond à ce nom." }, { status: 400 });
  }
  if (adjointId === user.id) {
    return NextResponse.json({ success: false, error: "Tu ne peux pas t'inviter toi-même." }, { status: 400 });
  }

  const existant = await prisma.adjoints_organisateur.findUnique({
    where: { proprietaire_id_adjoint_id: { proprietaire_id: user.id, adjoint_id: adjointId } },
  });
  if (existant) {
    return NextResponse.json({ success: false, error: "Déjà invité." }, { status: 400 });
  }

  await prisma.adjoints_organisateur.create({ data: { proprietaire_id: user.id, adjoint_id: adjointId } });
  return NextResponse.json({ success: true });
}
