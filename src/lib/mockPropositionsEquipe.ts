/**
 * Proposition d'inscription à un tournoi par un membre non-chef d'une équipe
 * pré-créée (point 192) — table `propositions_equipe` (Postgres), même
 * pattern que les migrations précédentes. Seul le chef peut réellement
 * finaliser l'inscription/paiement d'une équipe pré-créée à un tournoi
 * Battle Royale (mockEquipesProfil) — un membre peut seulement proposer, le
 * chef doit ensuite valider depuis "Mes équipes" pour que l'inscription se
 * lance réellement (mockEquipesBR.creerEquipeBR + ajouterMembresDirect).
 *
 * Notification au chef volontairement pas envoyée pour de vrai (même
 * limitation assumée que mockEquipesProfil.ts — cf. son en-tête) : la
 * proposition reste bien réelle et visible dès que le chef consulte son
 * équipe.
 */

export type PropositionEquipe = {
  id: string;
  equipeProfilId: string;
  equipeNom: string;
  tournoiId: string;
  proposeur: string;
  chef: string;
  statut: "en_attente" | "acceptee" | "refusee";
  horodatage: number;
};

async function reponseJson<T>(reponse: Response): Promise<{ ok: true; data: T } | { ok: false; erreur?: string }> {
  const json = await reponse.json().catch(() => null);
  if (!json?.success) return { ok: false, erreur: json?.error };
  return { ok: true, data: json.data as T };
}

export async function proposerInscriptionEquipe(equipeProfilId: string, tournoiId: string): Promise<PropositionEquipe | null> {
  const reponse = await fetch(`/api/tournois/${tournoiId}/propositions-equipe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ equipeProfilId }),
  });
  const resultat = await reponseJson<PropositionEquipe>(reponse);
  return resultat.ok ? resultat.data : null;
}

/** Toutes les propositions en attente pour une équipe pré-créée (tous
 * tournois confondus) — utilisé côté chef dans "Mes équipes". */
export async function propositionsEnAttentePourEquipe(equipeProfilId: string): Promise<PropositionEquipe[]> {
  const reponse = await fetch(`/api/equipes-profil/${equipeProfilId}/propositions`);
  const resultat = await reponseJson<PropositionEquipe[]>(reponse);
  return resultat.ok ? resultat.data : [];
}

export async function traiterPropositionEquipe(id: string, statut: "acceptee" | "refusee"): Promise<void> {
  await fetch(`/api/propositions-equipe/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ statut }),
  });
}
