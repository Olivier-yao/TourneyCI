import { NextResponse } from "next/server";
import { utilisateurConnecte, nonAuthentifie } from "@/lib/server/tournois";
import { tableauDeBordJSON } from "@/lib/server/tableauDeBordOrganisateur";

/** Vue agrégée privée (commission, réputation, litiges en attente, répartition
 * par statut) de l'organisateur connecté — cf. tableauDeBordOrganisateur.ts. */
export async function GET() {
  const user = await utilisateurConnecte();
  if (!user) return nonAuthentifie();

  const data = await tableauDeBordJSON(user.id);
  return NextResponse.json({ success: true, data });
}
