/** Tableau de bord de l'organisateur connecté (hub /organisateur, point 200)
 * — cf. src/app/api/organisateur/tableau-de-bord/route.ts. */

export type TableauDeBordOrganisateur = {
  commissionTotaleXof: number;
  litigesOuverts: number;
  coeurs: number;
  coeursBrises: number;
  parStatut: { enDirect: number; aVenir: number; termines: number; annules: number };
};

const VIDE: TableauDeBordOrganisateur = {
  commissionTotaleXof: 0,
  litigesOuverts: 0,
  coeurs: 0,
  coeursBrises: 0,
  parStatut: { enDirect: 0, aVenir: 0, termines: 0, annules: 0 },
};

export async function tableauDeBordOrganisateur(): Promise<TableauDeBordOrganisateur> {
  const reponse = await fetch("/api/organisateur/tableau-de-bord");
  if (!reponse.ok) return VIDE;
  const json = await reponse.json().catch(() => null);
  return json?.success ? json.data : VIDE;
}
