import { NextResponse } from "next/server";
import { compteReputationOrganisateurPlusieurs } from "@/lib/server/avis";
import { profileIdsDepuisNomsOrganisateur } from "@/lib/server/adjoints";

/** Public : compteurs cœurs/cœurs brisés pour plusieurs organisateurs en un
 * seul appel (`?noms=a,b,c`) — remplace un fetch par organisateur affiché,
 * même pattern que GET /api/tournois/avis-comptes. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const noms = (searchParams.get("noms") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const parNom = await profileIdsDepuisNomsOrganisateur(noms);
  const comptesParId = await compteReputationOrganisateurPlusieurs(Array.from(new Set(parNom.values())));

  const data: Record<string, { coeurs: number; coeursBrises: number }> = {};
  for (const nom of noms) {
    const profileId = parNom.get(nom);
    data[nom] = profileId ? comptesParId[profileId] : { coeurs: 0, coeursBrises: 0 };
  }
  return NextResponse.json({ success: true, data });
}
