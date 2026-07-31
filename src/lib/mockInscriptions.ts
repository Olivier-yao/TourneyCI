const CLE_INSCRIPTIONS = "tourneyci-inscriptions";

type Inscription = { tournoiId: string; equipe?: string };

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

export function enregistrerInscription(tournoiId: string, equipe?: string) {
  if (typeof window === "undefined") return;
  const existantes = lireInscriptions();
  if (existantes.some((i) => i.tournoiId === tournoiId)) return;
  localStorage.setItem(
    CLE_INSCRIPTIONS,
    JSON.stringify([...existantes, { tournoiId, equipe }]),
  );
}

export function mesInscriptions(): Inscription[] {
  return lireInscriptions();
}
