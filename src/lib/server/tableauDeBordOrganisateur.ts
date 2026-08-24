import { prisma } from "@/lib/prisma";
import { estEnDirect } from "./tournois";
import { compteReputationOrganisateur } from "./avis";

export type TableauDeBordOrganisateur = {
  commissionTotaleXof: number;
  litigesOuverts: number;
  coeurs: number;
  coeursBrises: number;
  parStatut: { enDirect: number; aVenir: number; termines: number; annules: number };
};

/** Vue agrégée de l'activité d'un organisateur, tous ses tournois confondus
 * (point 200 : hub /organisateur n'avait qu'une liste plate, aucun chiffre
 * global). Un seul aller-retour base par métrique plutôt qu'une boucle sur
 * mesTournoisOrganises() — même souci que compteReputationOrganisateurPlusieurs
 * (cf. avis.ts) : éviter le pattern N+1 déjà corrigé ailleurs cette nuit. */
export async function tableauDeBordJSON(organisateurId: string): Promise<TableauDeBordOrganisateur> {
  const [commission, litigesOuverts, reputation, tournois] = await Promise.all([
    prisma.mouvements.aggregate({
      where: { profile_id: organisateurId, type: "commission" },
      _sum: { montant_xof: true },
    }),
    prisma.litiges.count({
      where: {
        statut: "en_attente",
        matches: { tournois: { organisateur_id: organisateurId } },
      },
    }),
    compteReputationOrganisateur(organisateurId),
    prisma.tournois.findMany({
      where: { organisateur_id: organisateurId },
      select: { en_direct: true, termine_le: true, annule_le: true, debut_tournoi_le: true },
    }),
  ]);

  const parStatut = { enDirect: 0, aVenir: 0, termines: 0, annules: 0 };
  for (const t of tournois) {
    if (t.annule_le) parStatut.annules++;
    else if (t.termine_le) parStatut.termines++;
    else if (estEnDirect(t)) parStatut.enDirect++;
    else parStatut.aVenir++;
  }

  return {
    commissionTotaleXof: commission._sum.montant_xof ?? 0,
    litigesOuverts,
    coeurs: reputation.coeurs,
    coeursBrises: reputation.coeursBrises,
    parStatut,
  };
}
