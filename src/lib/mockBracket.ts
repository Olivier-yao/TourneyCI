/**
 * Bracket + scores — migré vers un vrai backend (Postgres via /api/tournois/
 * [id]/matches et /api/matches/**, cf. src/lib/server/matches.ts pour
 * l'adaptateur serveur). Même pattern que mockTournaments.ts : fonctions
 * async, mêmes noms/signatures qu'avant.
 *
 * Reste mocké/localStorage, volontairement inchangé : mockLitige.ts
 * (litiges) — aujourd'hui sans effet réel sur score/statut d'un match, donc
 * migrer ne changerait rien au comportement — et mockBattleRoyale.ts
 * (système de scoring entièrement différent), étapes séparées.
 */

export type StatutMatch = "a_venir" | "en_cours" | "termine";

/** Nombre de spectateurs affiché, dérivé de façon déterministe de l'id du
 * match (pas de vrai compteur temps réel). Partagé entre la vue spectateur
 * et le chat spectateurs pour rester cohérent. */
export function spectateursDerives(matchId: string): number {
  let h = 0;
  for (let i = 0; i < matchId.length; i++) h = (h * 31 + matchId.charCodeAt(i)) >>> 0;
  return 40 + (h % 260);
}

/** Libellé de stade de bracket (finale/demies/quart) à partir du round et du
 * nombre total de rounds — même logique que BracketV2.tsx, partagée ici pour
 * les écrans Match en direct qui n'ont pas accès à l'arbre complet. */
export function libelleRound(round: number, totalRounds: number): string {
  if (round === totalRounds) return "Finale";
  if (round === totalRounds - 1) return "Demi-finale";
  if (round === totalRounds - 2) return "Quart de finale";
  return `Round ${round}`;
}

/** Version compacte du libellé de round (ex. "Q3", "D1", "F"), utilisée dans
 * les listes de matchs et tuiles de stats où l'espace est réduit. */
export function codeRound(round: number, totalRounds: number): string {
  if (round === totalRounds) return "F";
  if (round === totalRounds - 1) return `D${round}`;
  if (round === totalRounds - 2) return `Q${round}`;
  return `R${round}`;
}

export type MatchTournoi = {
  id: string;
  tournoiId: string;
  round: number;
  position: number;
  joueur1: string | null;
  joueur2: string | null;
  score1: number | null;
  score2: number | null;
  statut: StatutMatch;
};

export type EvenementMatch = { id: string; texte: string; creeLe: number };

async function reponseJson<T>(reponse: Response): Promise<{ ok: true; data: T } | { ok: false; erreur?: string }> {
  const json = await reponse.json().catch(() => null);
  if (!json?.success) return { ok: false, erreur: json?.error };
  return { ok: true, data: json.data as T };
}

export async function matchsDuTournoi(tournoiId: string): Promise<MatchTournoi[]> {
  const reponse = await fetch(`/api/tournois/${tournoiId}/matches`);
  const resultat = await reponseJson<MatchTournoi[]>(reponse);
  return resultat.ok ? resultat.data : [];
}

export async function matchParId(id: string): Promise<MatchTournoi | undefined> {
  const reponse = await fetch(`/api/matches/${id}`);
  const resultat = await reponseJson<MatchTournoi>(reponse);
  return resultat.ok ? resultat.data : undefined;
}

export type ResultatMatch = { ok: boolean; erreur?: string; match?: MatchTournoi };

/** Enregistre un score final et propage le vainqueur au round suivant
 * (calculé côté serveur, dans une transaction). Autorisé pour l'organisateur
 * du tournoi ou l'un des deux joueurs du match. */
export async function mettreAJourScoreMatch(_tournoiId: string, matchId: string, score1: number, score2: number): Promise<ResultatMatch> {
  const reponse = await fetch(`/api/matches/${matchId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "score_final", score1, score2 }),
  });
  const resultat = await reponseJson<MatchTournoi>(reponse);
  return resultat.ok ? { ok: true, match: resultat.data } : { ok: false, erreur: resultat.erreur };
}

/** Point 150 : l'organisateur choisit manuellement quel match démarre —
 * un seul match "en_cours" à la fois par tournoi, donc démarrer un match
 * repasse tout autre match "en_cours" à "a_venir" (géré côté serveur).
 * Sans effet si les deux joueurs ne sont pas encore connus. Réservé à
 * l'organisateur du tournoi. */
export async function demarrerMatch(_tournoiId: string, matchId: string): Promise<ResultatMatch> {
  const reponse = await fetch(`/api/matches/${matchId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "demarrer" }),
  });
  const resultat = await reponseJson<MatchTournoi>(reponse);
  return resultat.ok ? { ok: true, match: resultat.data } : { ok: false, erreur: resultat.erreur };
}

/** Point 151 : met à jour le score affiché aux spectateurs SANS clôturer le
 * match (pas de passage à "termine", pas de propagation du vainqueur au tour
 * suivant). Réservé à l'organisateur du tournoi. */
export async function mettreAJourScoreEnDirect(_tournoiId: string, matchId: string, score1: number, score2: number): Promise<ResultatMatch> {
  const reponse = await fetch(`/api/matches/${matchId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "score_direct", score1, score2 }),
  });
  const resultat = await reponseJson<MatchTournoi>(reponse);
  return resultat.ok ? { ok: true, match: resultat.data } : { ok: false, erreur: resultat.erreur };
}

export async function evenementsDuMatch(matchId: string): Promise<EvenementMatch[]> {
  const reponse = await fetch(`/api/matches/${matchId}/evenements`);
  const resultat = await reponseJson<EvenementMatch[]>(reponse);
  return resultat.ok ? resultat.data : [];
}

/** Ajoute un événement au fil du match en direct (point 107), visible par
 * les spectateurs et participants — sans toucher au score ni au statut du
 * match. Réservé à l'organisateur du tournoi. */
export async function ajouterEvenementMatch(_tournoiId: string, matchId: string, texte: string): Promise<ResultatMatch> {
  const reponse = await fetch(`/api/matches/${matchId}/evenements`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ texte }),
  });
  const resultat = await reponseJson<EvenementMatch>(reponse);
  return resultat.ok ? { ok: true } : { ok: false, erreur: resultat.erreur };
}

/** Génère un arbre à élimination directe à partir d'une liste ordonnée de
 * participants (le seeding). Complète avec des "byes" si l'effectif n'est
 * pas une puissance de 2 (calcul côté serveur). Idempotent : si le bracket
 * existe déjà pour ce tournoi, renvoie les matchs existants sans rien
 * recréer. */
export async function genererBracket(tournoiId: string, participants: string[]): Promise<MatchTournoi[]> {
  const reponse = await fetch(`/api/tournois/${tournoiId}/matches`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ participants }),
  });
  const resultat = await reponseJson<MatchTournoi[]>(reponse);
  return resultat.ok ? resultat.data : [];
}

function perdantDe(match: MatchTournoi): string | null {
  if (match.statut !== "termine") return null;
  const gagnant = (match.score1 ?? 0) > (match.score2 ?? 0) ? match.joueur1 : match.joueur2;
  return gagnant === match.joueur1 ? match.joueur2 : match.joueur1;
}

/** Classement final déduit du bracket (1er = vainqueur), pour la distribution
 * automatique des points en fin de tournoi. Vide tant que la finale n'est
 * pas terminée. */
export async function classementFinalBracket(tournoiId: string): Promise<string[]> {
  const matches = await matchsDuTournoi(tournoiId);
  if (matches.length === 0) return [];

  const totalRounds = Math.max(...matches.map((m) => m.round));
  const finale = matches.find((m) => m.round === totalRounds && m.position === 0);
  if (!finale || finale.statut !== "termine") return [];

  const gagnant = (finale.score1 ?? 0) > (finale.score2 ?? 0) ? finale.joueur1 : finale.joueur2;
  const perdantFinale = perdantDe(finale);

  const classement: string[] = [];
  if (gagnant) classement.push(gagnant);
  if (perdantFinale) classement.push(perdantFinale);

  for (let round = totalRounds - 1; round >= 1; round--) {
    const perdants = matches
      .filter((m) => m.round === round)
      .map(perdantDe)
      .filter((n): n is string => Boolean(n));
    classement.push(...perdants);
  }

  return classement;
}
