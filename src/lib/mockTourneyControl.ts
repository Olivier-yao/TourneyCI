/**
 * Client de l'interface administrateur sécurisée (/tourney-control, point
 * 160) : connexion en deux facteurs (identifiants puis PIN, vérifiés côté
 * serveur — voir src/lib/server/adminAuth.ts, qui a remplacé
 * mockAdminSecure.ts) et traitement des demandes organisateur/annulation en
 * attente.
 */

import type { AnalyseDemandeOrganisateur } from "./mockAnalyseAutomatique";
import type { StatutDemandeOrganisateur } from "./mockDemandesOrganisateur";
import type { StatutDemandeAnnulation } from "./mockDemandesAnnulation";
import type { Litige } from "./mockLitige";

export type EtapeConnexionAdmin = "identifiants" | "pin" | "interface";

export async function etapeConnexionAdmin(): Promise<EtapeConnexionAdmin> {
  const reponse = await fetch("/api/tourney-control/connexion");
  if (!reponse.ok) return "identifiants";
  const json = await reponse.json().catch(() => null);
  return json?.success ? json.data.etape : "identifiants";
}

export async function verifierIdentifiants(identifiant: string, motDePasse: string): Promise<boolean> {
  const reponse = await fetch("/api/tourney-control/connexion", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ etape: "identifiants", identifiant, motDePasse }),
  });
  return reponse.ok;
}

export async function verifierPin(pin: string): Promise<boolean> {
  const reponse = await fetch("/api/tourney-control/connexion", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ etape: "pin", pin }),
  });
  return reponse.ok;
}

export async function deconnecterAdminSecurise(): Promise<void> {
  await fetch("/api/tourney-control/connexion", { method: "DELETE" });
}

export type DemandeOrganisateurAdmin = {
  id: string;
  nomOrganisateur: string;
  motivation: string;
  identiteVerifiee: boolean;
  analyseAutomatique: AnalyseDemandeOrganisateur;
  statut: StatutDemandeOrganisateur;
  messageAdmin?: string;
  horodatage: number;
};

export async function demandesOrganisateurEnAttente(): Promise<DemandeOrganisateurAdmin[]> {
  const reponse = await fetch("/api/tourney-control/demandes-organisateur");
  if (!reponse.ok) return [];
  const json = await reponse.json().catch(() => null);
  return json?.success ? json.data : [];
}

export async function traiterDemandeOrganisateur(id: string, statut: "validee" | "refusee", messageAdmin?: string): Promise<void> {
  await fetch(`/api/tourney-control/demandes-organisateur/${id}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ statut, messageAdmin }),
  });
}

export type DemandeAnnulationAdmin = {
  id: string;
  tournoiId: string;
  tournoiTitre: string;
  organisateurNom: string;
  placesInscrites: number;
  motif: string;
  statut: StatutDemandeAnnulation;
  messageAdmin?: string;
  horodatage: number;
};

export async function demandesAnnulationEnAttente(): Promise<DemandeAnnulationAdmin[]> {
  const reponse = await fetch("/api/tourney-control/demandes-annulation");
  if (!reponse.ok) return [];
  const json = await reponse.json().catch(() => null);
  return json?.success ? json.data : [];
}

export async function traiterDemandeAnnulation(id: string, statut: "validee" | "refusee", messageAdmin?: string): Promise<void> {
  await fetch(`/api/tourney-control/demandes-annulation/${id}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ statut, messageAdmin }),
  });
}

export type StatutModerationOrganisateur = "actif" | "suspendu" | "banni";

export type OrganisateurModerationAdmin = {
  profileId: string;
  nom: string;
  coeurs: number;
  coeursBrises: number;
  statut: StatutModerationOrganisateur;
  motif?: string;
  moderationLe?: number;
};

/** Sans argument : file des organisateurs suspendus en attente d'une
 * décision (lever ou bannir). Avec une recherche : n'importe quel
 * organisateur par nom d'organisateur ou pseudo joueur, quel que soit son
 * statut — pour un bannissement direct sans attendre le seuil automatique. */
export async function organisateursModeration(recherche?: string): Promise<OrganisateurModerationAdmin[]> {
  const url = recherche?.trim() ? `/api/tourney-control/moderation?q=${encodeURIComponent(recherche.trim())}` : "/api/tourney-control/moderation";
  const reponse = await fetch(url);
  if (!reponse.ok) return [];
  const json = await reponse.json().catch(() => null);
  return json?.success ? json.data : [];
}

export async function bannirOrganisateurAdmin(profileId: string, motif: string): Promise<void> {
  await fetch(`/api/tourney-control/moderation/${profileId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "bannir", motif }),
  });
}

export async function leverSuspensionAdmin(profileId: string): Promise<void> {
  await fetch(`/api/tourney-control/moderation/${profileId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "lever_suspension" }),
  });
}

export type StatutKycAdmin = "en_attente" | "validee" | "refusee";

export type VerificationKycAdmin = {
  id: string;
  profileId: string;
  nomOrganisateur: string;
  typePiece: string;
  rectoUrl: string;
  versoUrl: string;
  selfieUrl: string;
  ageConfirme: boolean;
  statut: StatutKycAdmin;
  horodatage: number;
};

export async function verificationsKycEnAttenteAdmin(): Promise<VerificationKycAdmin[]> {
  const reponse = await fetch("/api/tourney-control/kyc");
  if (!reponse.ok) return [];
  const json = await reponse.json().catch(() => null);
  return json?.success ? json.data : [];
}

export async function traiterVerificationKycAdmin(id: string, statut: "validee" | "refusee"): Promise<void> {
  await fetch(`/api/tourney-control/kyc/${id}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ statut }),
  });
}

/** Supervision (lecture seule) : les litiges sont tranchés par
 * l'organisateur du tournoi concerné, jamais depuis cette interface. */
export async function litigesEnAttenteAdmin(): Promise<Litige[]> {
  const reponse = await fetch("/api/tourney-control/litiges");
  if (!reponse.ok) return [];
  const json = await reponse.json().catch(() => null);
  return json?.success ? json.data : [];
}
