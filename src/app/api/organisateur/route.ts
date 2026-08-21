import { NextResponse } from "next/server";
import { utilisateurConnecte, nonAuthentifie, synchroniserNomOrganisateur } from "@/lib/server/tournois";

/** Synchronise le nom d'organisateur choisi (mockOrganisateur.ts, encore
 * localStorage) vers organisateur_profils.nom_organisateur — appelée en
 * fire-and-forget depuis definirNomOrganisateur() et mesTournoisOrganises(),
 * pour que l'API tournois renvoie le bon nom (cf. src/lib/server/tournois.ts). */
export async function PATCH(request: Request) {
  const user = await utilisateurConnecte();
  if (!user) return nonAuthentifie();

  const body = await request.json().catch(() => null);
  const nomOrganisateur = typeof body?.nomOrganisateur === "string" ? body.nomOrganisateur.trim() : "";
  if (!nomOrganisateur) {
    return NextResponse.json({ success: false, error: "Nom d'organisateur invalide." }, { status: 400 });
  }

  await synchroniserNomOrganisateur(user.id, nomOrganisateur);
  return NextResponse.json({ success: true });
}
