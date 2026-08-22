/**
 * Demande de statut organisateur certifié (points 146, 158) : distincte de
 * la vérification d'identité (CNI + selfie, points 41/49) — un organisateur
 * "standard" peut créer des tournois gratuits dès qu'il a choisi un nom
 * (point 167), sans cette demande. Elle ne sert qu'à devenir organisateur
 * certifié (identité vérifiée + demande validée, point 158), ce qui débloque
 * les tournois payants.
 */

import type { AnalyseDemandeOrganisateur } from "./mockAnalyseAutomatique";

export type StatutDemandeOrganisateur = "en_attente" | "validee" | "refusee";

export type DemandeOrganisateur = {
  id: string;
  motivation: string;
  /** Identité vérifiée (CNI, points 41/49) au moment de la demande. */
  identiteVerifiee: boolean;
  analyseAutomatique: AnalyseDemandeOrganisateur;
  statut: StatutDemandeOrganisateur;
  /** Motif du refus ou note de validation, visible par le demandeur (point 160). */
  messageAdmin?: string;
  horodatage: number;
};

/** Dernière demande du compte connecté. */
export async function demandeOrganisateurActuelle(): Promise<DemandeOrganisateur | undefined> {
  const reponse = await fetch("/api/organisateur/demande");
  if (!reponse.ok) return undefined;
  const json = await reponse.json().catch(() => null);
  return json?.success ? (json.data ?? undefined) : undefined;
}

export async function estOrganisateurApprouve(): Promise<boolean> {
  return (await demandeOrganisateurActuelle())?.statut === "validee";
}

export async function creerDemandeOrganisateur(motivation: string, identiteVerifiee: boolean): Promise<DemandeOrganisateur | null> {
  if (!motivation.trim()) return null;
  const reponse = await fetch("/api/organisateur/demande", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ motivation: motivation.trim(), identiteVerifiee }),
  });
  if (!reponse.ok) return null;
  const json = await reponse.json().catch(() => null);
  return json?.success ? json.data : null;
}
