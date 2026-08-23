import { NextResponse } from "next/server";
import { utilisateurConnecte, nonAuthentifie } from "@/lib/server/tournois";
import { demandeActuelleDe, creerDemande } from "@/lib/server/demandesOrganisateur";
import { estCertifie } from "@/lib/server/kyc";

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
  if (!motivation) return NextResponse.json({ success: false, error: "Motivation requise." }, { status: 400 });

  // Dérivé côté serveur (vraie vérification KYC), jamais pris tel quel côté
  // client — avant cette correction, identiteVerifiee était un booléen que
  // le client envoyait lui-même dans le corps de la requête.
  const identiteVerifiee = await estCertifie(user.id);
  const demande = await creerDemande(user.id, motivation, identiteVerifiee);
  return NextResponse.json({ success: true, data: demande });
}
