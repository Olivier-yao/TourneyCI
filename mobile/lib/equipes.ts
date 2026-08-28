import { apiFetch } from "./api";

/** Port partiel de src/lib/mockEquipesProfil.ts — seule la lecture des
 * équipes dont je suis chef, utilisée par le sélecteur d'équipe à
 * l'inscription (mobile/app/tournoi/[id]/index.tsx). La création/gestion
 * complète d'équipes (invitations, membres...) reste hors scope mobile ;
 * une équipe se saisit toujours à la main en repli, comme côté web quand
 * aucune équipe existante n'est disponible. */
export type EquipeProfil = {
  id: string;
  nom: string;
  chef: string;
  membres: string[];
};

export async function equipesProfilDontChef(): Promise<EquipeProfil[]> {
  const resultat = await apiFetch<EquipeProfil[]>("/api/equipes-profil?role=chef");
  return resultat.success ? resultat.data : [];
}
