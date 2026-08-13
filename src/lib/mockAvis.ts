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

export function compterAvis(tournoiId: string): { coeurs: number; coeursBrises: number } {
  const avis = avisDuTournoi(tournoiId);
  return {
    coeurs: avis.filter((a) => a.type === "coeur").length,
    coeursBrises: avis.filter((a) => a.type === "coeur_brise").length,
  };
}

/**
 * Avis global laissé directement à un organisateur, indépendamment de tout
 * tournoi précis (cf. point 51 — un seul avis par organisateur et par
 * utilisateur, distinct des avis par tournoi ci-dessus).
 */
export type AvisOrganisateur = {
  id: string;
  organisateur: string;
  type: TypeAvis;
  horodatage: number;
};

const CLE_AVIS_ORGANISATEUR = "tourney-avis-organisateur";

function lireToutOrganisateur(): AvisOrganisateur[] {
  if (typeof window === "undefined") return [];
  try {
    const brut = localStorage.getItem(CLE_AVIS_ORGANISATEUR);
    return brut ? (JSON.parse(brut) as AvisOrganisateur[]) : [];
  } catch {
    return [];
  }
}

export function avisGlobalDeOrganisateur(organisateur: string): AvisOrganisateur[] {
  return lireToutOrganisateur().filter((a) => a.organisateur === organisateur);
}

export function monAvisPourOrganisateur(organisateur: string): AvisOrganisateur | undefined {
  return lireToutOrganisateur().find((a) => a.organisateur === organisateur);
}

export function laisserAvisOrganisateur(organisateur: string, type: TypeAvis) {
  if (typeof window === "undefined") return;
  if (monAvisPourOrganisateur(organisateur)) return;
  const avis: AvisOrganisateur = {
    id: `avisorg-${Date.now().toString(36)}`,
    organisateur,
    type,
    horodatage: Date.now(),
  };
  localStorage.setItem(CLE_AVIS_ORGANISATEUR, JSON.stringify([...lireToutOrganisateur(), avis]));
}
