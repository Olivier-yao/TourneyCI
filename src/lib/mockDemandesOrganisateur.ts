/**
 * Demande de statut organisateur (point 146) : distincte de la vérification
 * d'identité (CNI + selfie, points 41/49) — même une fois cette dernière
 * validée, l'utilisateur doit soumettre une demande formelle, examinée par
 * l'administration, avant de pouvoir effectivement créer des tournois.
 * Mono-compte comme le reste des demandes de ce mock (une seule à la fois).
 */

export type StatutDemandeOrganisateur = "en_attente" | "validee" | "refusee";

export type DemandeOrganisateur = {
  id: string;
  nomOrganisateur: string;
  statut: StatutDemandeOrganisateur;
  horodatage: number;
};

const CLE_DEMANDES_ORGANISATEUR = "tourney-demandes-organisateur";

function lireTout(): DemandeOrganisateur[] {
  if (typeof window === "undefined") return [];
  try {
    const brut = localStorage.getItem(CLE_DEMANDES_ORGANISATEUR);
    return brut ? (JSON.parse(brut) as DemandeOrganisateur[]) : [];
  } catch {
    return [];
  }
}

/** Dernière demande de l'organisateur de cet appareil (mock mono-compte). */
export function demandeOrganisateurActuelle(): DemandeOrganisateur | undefined {
  const tout = lireTout();
  return tout.length > 0 ? tout[tout.length - 1] : undefined;
}

export function estOrganisateurApprouve(): boolean {
  return demandeOrganisateurActuelle()?.statut === "validee";
}

export function creerDemandeOrganisateur(nomOrganisateur: string): DemandeOrganisateur | null {
  if (typeof window === "undefined" || !nomOrganisateur.trim()) return null;
  const existante = demandeOrganisateurActuelle();
  if (existante?.statut === "en_attente" || existante?.statut === "validee") return existante;
  const demande: DemandeOrganisateur = {
    id: `orga-${Date.now().toString(36)}`,
    nomOrganisateur: nomOrganisateur.trim(),
    statut: "en_attente",
    horodatage: Date.now(),
  };
  localStorage.setItem(CLE_DEMANDES_ORGANISATEUR, JSON.stringify([...lireTout(), demande]));
  return demande;
}

export function demandesOrganisateurEnAttente(): DemandeOrganisateur[] {
  return lireTout()
    .filter((d) => d.statut === "en_attente")
    .sort((a, b) => a.horodatage - b.horodatage);
}

export function traiterDemandeOrganisateur(id: string, statut: "validee" | "refusee") {
  if (typeof window === "undefined") return;
  const maj = lireTout().map((d) => (d.id === id ? { ...d, statut } : d));
  localStorage.setItem(CLE_DEMANDES_ORGANISATEUR, JSON.stringify(maj));
}
