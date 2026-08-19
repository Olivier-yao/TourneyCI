import { cleCompte } from "./mockAuth";

const CLE_FAVORIS = "tourney-favoris";

function lireFavoris(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const brut = localStorage.getItem(cleCompte(CLE_FAVORIS));
    return brut ? (JSON.parse(brut) as string[]) : [];
  } catch {
    return [];
  }
}

export function estFavori(tournoiId: string): boolean {
  return lireFavoris().includes(tournoiId);
}

export function basculerFavori(tournoiId: string): boolean {
  if (typeof window === "undefined") return false;
  const favoris = lireFavoris();
  const index = favoris.indexOf(tournoiId);
  const nouveaux = index === -1 ? [...favoris, tournoiId] : favoris.filter((id) => id !== tournoiId);
  localStorage.setItem(cleCompte(CLE_FAVORIS), JSON.stringify(nouveaux));
  return index === -1;
}

export function mesFavoris(): string[] {
  return lireFavoris();
}
