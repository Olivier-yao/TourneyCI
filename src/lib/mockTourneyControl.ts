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
