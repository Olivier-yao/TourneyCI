import type { MatchStatut } from "./types";

export type MatchAGenerer = {
  round: number;
  position: number;
  participant1_id: string | null;
  participant2_id: string | null;
  gagnant_id: string | null;
  statut: MatchStatut;
};

function melanger<T>(items: T[]): T[] {
  const copie = [...items];
  for (let i = copie.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copie[i], copie[j]] = [copie[j], copie[i]];
  }
  return copie;
}

/**
 * Génère un bracket à élimination directe pour une liste de participants.
 * Le nombre de places est arrondi à la puissance de 2 supérieure ; les
 * places excédentaires deviennent des "byes" (l'adversaire est absent,
 * le participant est qualifié d'office pour le round 2).
 */
export function genererStructureBracket(
  participantIds: string[],
): MatchAGenerer[] {
  const n = participantIds.length;
  if (n < 2) {
    throw new Error("Il faut au moins 2 participants pour générer un bracket.");
  }

  const bracketSize = 2 ** Math.ceil(Math.log2(n));
  const nbPaires = bracketSize / 2;
  const nombreByes = bracketSize - n;

  // On choisit au hasard quelles paires reçoivent un bye (un seul null par
  // paire, jamais deux) plutôt que de mélanger participants et nulls en
  // vrac, ce qui pourrait produire un match sans aucun participant.
  const indicesAvecBye = new Set(
    melanger([...Array(nbPaires).keys()]).slice(0, nombreByes),
  );
  const participantsMelanges = melanger(participantIds);
  let curseur = 0;

  const matches: MatchAGenerer[] = [];

  // Round 1 : les byes sont décidés immédiatement (pas d'adversaire).
  const round1: MatchAGenerer[] = [];
  for (let p = 0; p < nbPaires; p++) {
    if (indicesAvecBye.has(p)) {
      const a = participantsMelanges[curseur++];
      round1.push({
        round: 1,
        position: p,
        participant1_id: a,
        participant2_id: null,
        gagnant_id: a,
        statut: "termine",
      });
    } else {
      const a = participantsMelanges[curseur++];
      const b = participantsMelanges[curseur++];
      round1.push({
        round: 1,
        position: p,
        participant1_id: a,
        participant2_id: b,
        gagnant_id: null,
        statut: "a_venir",
      });
    }
  }
  matches.push(...round1);

  const totalRounds = Math.log2(bracketSize);
  let vainqueursPrecedents = round1.map((m) => m.gagnant_id);

  for (let round = 2; round <= totalRounds; round++) {
    const nbMatches = bracketSize / 2 ** round;
    const roundMatches: MatchAGenerer[] = [];
    const vainqueursRound: (string | null)[] = [];

    for (let p = 0; p < nbMatches; p++) {
      roundMatches.push({
        round,
        position: p,
        participant1_id: vainqueursPrecedents[2 * p] ?? null,
        participant2_id: vainqueursPrecedents[2 * p + 1] ?? null,
        gagnant_id: null,
        statut: "a_venir",
      });
      vainqueursRound.push(null);
    }

    matches.push(...roundMatches);
    vainqueursPrecedents = vainqueursRound;
  }

  return matches;
}
