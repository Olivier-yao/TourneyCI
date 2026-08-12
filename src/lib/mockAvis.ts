/**
 * Avis "cœur / cœur brisé" laissés par les participants à la fin d'un
 * tournoi, associés au tournoi et à l'organisateur concerné. Sert de base à
 * la réputation organisateur et aux mécanismes de séquestre du cash prize.
 */

export type TypeAvis = "coeur" | "coeur_brise";

export type AvisTournoi = {
  id: string;
  tournoiId: string;
  tournoiTitre: string;
  organisateur: string;
  type: TypeAvis;
  message?: string;
  horodatage: number;
};

const CLE_AVIS = "tourney-avis";

function lireTout(): AvisTournoi[] {
  if (typeof window === "undefined") return [];
  try {
    const brut = localStorage.getItem(CLE_AVIS);
    return brut ? (JSON.parse(brut) as AvisTournoi[]) : [];
  } catch {
    return [];
  }
}

export function avisDuTournoi(tournoiId: string): AvisTournoi[] {
  return lireTout().filter((a) => a.tournoiId === tournoiId);
}

export function avisDeOrganisateur(organisateur: string): AvisTournoi[] {
  return lireTout().filter((a) => a.organisateur === organisateur);
}

/** Un seul avis par tournoi côté appareil courant (mock mono-utilisateur). */
export function monAvisPourTournoi(tournoiId: string): AvisTournoi | undefined {
  return lireTout().find((a) => a.tournoiId === tournoiId);
}

export function laisserAvis(
  tournoiId: string,
  tournoiTitre: string,
  organisateur: string,
  type: TypeAvis,
  message?: string,
) {
  if (typeof window === "undefined") return;
  if (monAvisPourTournoi(tournoiId)) return;
  const avis: AvisTournoi = {
    id: `avis-${Date.now().toString(36)}`,
    tournoiId,
    tournoiTitre,
    organisateur,
    type,
    message: message?.trim() || undefined,
    horodatage: Date.now(),
  };
  localStorage.setItem(CLE_AVIS, JSON.stringify([...lireTout(), avis]));
}
