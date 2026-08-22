import { NextResponse } from "next/server";
import { utilisateurConnecte, nonAuthentifie } from "@/lib/server/tournois";
import { demandeActuelleDe, creerDemande } from "@/lib/server/demandesOrganisateur";

/** Dernière demande de statut organisateur certifié du compte connecté. */
export async function GET() {
  const user = await utilisateurConnecte();
  if (!user) return nonAuthentifie();
  return NextResponse.json({ success: true, data: (await demandeActuelleDe(user.id)) ?? null });
}

export async function POST(request: Request) {
  const user = await utilisateurConnecte();
  if (!user) return nonAuthentifie();

  const body = await request.json().catch(() => null);
  const motivation = typeof body?.motivation === "string" ? body.motivation.trim() : "";
  const identiteVerifiee = body?.identiteVerifiee === true;
  if (!motivation) return NextResponse.json({ success: false, error: "Motivation requise." }, { status: 400 });

  const demande = await creerDemande(user.id, motivation, identiteVerifiee);
  return NextResponse.json({ success: true, data: demande });
}
