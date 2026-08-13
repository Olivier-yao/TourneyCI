const CLE_INSCRIPTIONS = "tourney-inscriptions";

export type Inscription = { tournoiId: string; equipe?: string; tag?: string };

function lireInscriptions(): Inscription[] {
  if (typeof window === "undefined") return [];
  try {
    const brut = localStorage.getItem(CLE_INSCRIPTIONS);
    return brut ? (JSON.parse(brut) as Inscription[]) : [];
  } catch {
    return [];
  }
}

export function estInscrit(tournoiId: string): boolean {
  return lireInscriptions().some((i) => i.tournoiId === tournoiId);
}

export function inscriptionDe(tournoiId: string): Inscription | undefined {
  return lireInscriptions().find((i) => i.tournoiId === tournoiId);
}

export function enregistrerInscription(tournoiId: string, tag?: string, equipe?: string) {
  if (typeof window === "undefined") return;
  const existantes = lireInscriptions();
  if (existantes.some((i) => i.tournoiId === tournoiId)) return;
  localStorage.setItem(
    CLE_INSCRIPTIONS,
    JSON.stringify([...existantes, { tournoiId, equipe, tag }]),
  );
}

/** Renomme l'équipe de l'inscription courante (capitaine uniquement, avant le
 * début du tournoi — le verrouillage post-démarrage est géré par l'appelant). */
export function renommerEquipe(tournoiId: string, nouveauNom: string) {
  if (typeof window === "undefined") return;
  const existantes = lireInscriptions();
  const maj = existantes.map((i) => (i.tournoiId === tournoiId && i.equipe ? { ...i, equipe: nouveauNom } : i));
  localStorage.setItem(CLE_INSCRIPTIONS, JSON.stringify(maj));
}

export function mesInscriptions(): Inscription[] {
  return lireInscriptions();
}
