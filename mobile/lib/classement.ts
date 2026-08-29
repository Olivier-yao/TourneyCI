import { apiFetch } from "./api";

/** Port du contrat de GET /api/classement (src/app/api/classement/route.ts)
 * — classement national de la saison en cours (remis à zéro chaque
 * saison, contrairement aux points cumulés à vie du profil). */
export type EntreeClassement = {
  profileId: string;
  pseudo: string;
  initiales: string;
  ville?: string;
  photoUrl?: string;
  points: number;
  moi?: boolean;
};

export type Saison = { id: string; numero: number; nom: string };

export type Classement = { saison: Saison; classement: EntreeClassement[] };

export async function chargerClassement(): Promise<Classement | undefined> {
  const resultat = await apiFetch<Classement>("/api/classement");
  return resultat.success ? resultat.data : undefined;
}
