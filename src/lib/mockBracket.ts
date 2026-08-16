/**
 * Données mock pour la phase 5 du chantier V2 (bracket + match en direct).
 * Un seul bracket de démo, rattaché au tournoi "abidjan-cup-12".
 */

export type StatutMatch = "a_venir" | "en_cours" | "termine";

/** Nombre de spectateurs affiché, dérivé de façon déterministe de l'id du
 * match (pas de vrai compteur temps réel côté mock). Partagé entre la vue
 * spectateur et le chat spectateurs pour rester cohérent. */
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
  minute?: number;
  evenements?: { minute: number; texte: string }[];
};

export const MATCHES: MatchTournoi[] = [
  {
    id: "m-qf-1",
    tournoiId: "abidjan-cup-12",
    round: 1,
    position: 0,
    joueur1: "Kader B.",
    joueur2: "Yao M.",
    score1: 3,
    score2: 1,
    statut: "termine",
  },
  {
    id: "m-qf-2",
    tournoiId: "abidjan-cup-12",
    round: 1,
    position: 1,
    joueur1: "Aya K.",
    joueur2: "Sory D.",
    score1: 0,
    score2: 2,
    statut: "termine",
  },
  {
    id: "m-qf-3",
    tournoiId: "abidjan-cup-12",
    round: 1,
    position: 2,
    joueur1: "Ismaël T.",
    joueur2: "Fofana",
    score1: 1,
    score2: 1,
    statut: "en_cours",
    minute: 68,
    evenements: [
      { minute: 64, texte: "But de Fofana — contre-attaque" },
      { minute: 51, texte: "But d'Ismaël T. — penalty" },
      { minute: 22, texte: "But d'Ismaël T. — frappe lointaine" },
    ],
  },
  {
    id: "m-qf-4",
    tournoiId: "abidjan-cup-12",
    round: 1,
    position: 3,
    joueur1: "Traoré",
    joueur2: "Bamba",
    score1: null,
    score2: null,
    statut: "a_venir",
  },
  {
    id: "m-sf-1",
    tournoiId: "abidjan-cup-12",
    round: 2,
    position: 0,
    joueur1: "Kader B.",
    joueur2: "Sory D.",
    score1: 2,
    score2: 1,
    statut: "termine",
  },
  {
    id: "m-sf-2",
    tournoiId: "abidjan-cup-12",
    round: 2,
    position: 1,
    joueur1: null,
    joueur2: null,
    score1: null,
    score2: null,
    statut: "a_venir",
  },
  {
    id: "m-finale",
    tournoiId: "abidjan-cup-12",
    round: 3,
    position: 0,
    joueur1: null,
    joueur2: null,
    score1: null,
    score2: null,
    statut: "a_venir",
  },

  // Démo en cours (point 85), organisateur = utilisateur courant.
  {
    id: "demo1v1-qf-1",
    tournoiId: "demo-1v1-en-cours",
    round: 1,
    position: 0,
    joueur1: "Fofana",
    joueur2: "Bamba",
    score1: 2,
    score2: 1,
    statut: "termine",
  },
  {
    id: "demo1v1-qf-2",
    tournoiId: "demo-1v1-en-cours",
    round: 1,
    position: 1,
    joueur1: "Traoré",
    joueur2: "Adjoua",
    score1: null,
    score2: null,
    statut: "en_cours",
  },
  {
    id: "demo1v1-finale",
    tournoiId: "demo-1v1-en-cours",
    round: 2,
    position: 0,
    joueur1: "Fofana",
    joueur2: null,
    score1: null,
    score2: null,
    statut: "a_venir",
  },
  {
    id: "demoequipes-qf-1",
    tournoiId: "demo-equipes-en-cours",
    round: 1,
    position: 0,
    joueur1: "Team Alpha",
    joueur2: "Team Beta",
    score1: 3,
    score2: 2,
    statut: "termine",
  },
  {
    id: "demoequipes-qf-2",
    tournoiId: "demo-equipes-en-cours",
    round: 1,
    position: 1,
    joueur1: "Team Gamma",
    joueur2: "Team Delta",
    score1: null,
    score2: null,
    statut: "en_cours",
  },
  {
    id: "demoequipes-finale",
    tournoiId: "demo-equipes-en-cours",
    round: 2,
    position: 0,
    joueur1: "Team Alpha",
    joueur2: null,
    score1: null,
    score2: null,
    statut: "a_venir",
  },
];

const CLE_BRACKETS_GENERES = "tourney-brackets-generes";

function lireBracketsGeneres(): Record<string, MatchTournoi[]> {
  if (typeof window === "undefined") return {};
  try {
    const brut = localStorage.getItem(CLE_BRACKETS_GENERES);
    return brut ? (JSON.parse(brut) as Record<string, MatchTournoi[]>) : {};
  } catch {
    return {};
  }
}

export function matchsDuTournoi(tournoiId: string): MatchTournoi[] {
  const generes = lireBracketsGeneres()[tournoiId];
  if (generes) return generes;
  return MATCHES.filter((m) => m.tournoiId === tournoiId);
}

export function matchParId(id: string): MatchTournoi | undefined {
  return (
    Object.values(lireBracketsGeneres()).flat().find((m) => m.id === id) ??
    MATCHES.find((m) => m.id === id)
  );
}

/** Enregistre un score et propage le vainqueur au round suivant. Matérialise
 * d'abord le bracket en dur (ex. abidjan-cup-12) en localStorage s'il n'y
 * était pas encore, pour que les éditions ultérieures s'appliquent dessus. */
export function mettreAJourScoreMatch(
  tournoiId: string,
  matchId: string,
  score1: number,
  score2: number,
) {
  if (typeof window === "undefined") return;
  const actuels = matchsDuTournoi(tournoiId).map((m) => ({ ...m }));
  const match = actuels.find((m) => m.id === matchId);
  if (!match) return;

  match.score1 = score1;
  match.score2 = score2;
  match.statut = "termine";
  match.minute = undefined;
  match.evenements = undefined;

  const totalRounds = Math.max(...actuels.map((m) => m.round));
  if (match.round < totalRounds) {
    const positionCible = Math.floor(match.position / 2);
    const cible = actuels.find((m) => m.round === match.round + 1 && m.position === positionCible);
    if (cible) {
      const gagnant = score1 > score2 ? match.joueur1 : match.joueur2;
      if (match.position % 2 === 0) cible.joueur1 = gagnant;
      else cible.joueur2 = gagnant;
    }
  }

  const existants = lireBracketsGeneres();
  localStorage.setItem(CLE_BRACKETS_GENERES, JSON.stringify({ ...existants, [tournoiId]: actuels }));
}

/** Point 150 : l'organisateur choisit manuellement quel match démarre, plutôt
 * qu'un ordre de round fixe/imposé — un seul match "en_cours" à la fois par
 * tournoi (un bracket 1v1 n'a qu'un plateau/stream), donc démarrer un match
 * repasse tout autre match "en_cours" à "a_venir". Sans effet si les deux
 * joueurs ne sont pas encore connus (pas encore qualifié). */
export function demarrerMatch(tournoiId: string, matchId: string) {
  if (typeof window === "undefined") return;
  const actuels = matchsDuTournoi(tournoiId).map((m) => ({ ...m }));
  const cible = actuels.find((m) => m.id === matchId);
  if (!cible || !cible.joueur1 || !cible.joueur2 || cible.statut !== "a_venir") return;

  actuels.forEach((m) => {
    if (m.statut === "en_cours") m.statut = "a_venir";
  });
  cible.statut = "en_cours";

  const existants = lireBracketsGeneres();
  localStorage.setItem(CLE_BRACKETS_GENERES, JSON.stringify({ ...existants, [tournoiId]: actuels }));
}

/** Point 151 : met à jour le score affiché aux spectateurs SANS clôturer le
 * match (pas de passage à "termine", pas de propagation du vainqueur au tour
 * suivant) — action distincte de mettreAJourScoreMatch, qui reste la seule à
 * clôturer réellement le match. */
export function mettreAJourScoreEnDirect(tournoiId: string, matchId: string, score1: number, score2: number) {
  if (typeof window === "undefined") return;
  const actuels = matchsDuTournoi(tournoiId).map((m) => ({ ...m }));
  const match = actuels.find((m) => m.id === matchId);
  if (!match || match.statut !== "en_cours") return;

  match.score1 = score1;
  match.score2 = score2;

  const existants = lireBracketsGeneres();
  localStorage.setItem(CLE_BRACKETS_GENERES, JSON.stringify({ ...existants, [tournoiId]: actuels }));
}

/** Ajoute un événement au fil du match en direct (point 107), visible par
 * les spectateurs et participants — sans toucher au score ni au statut du
 * match. Matérialise le bracket en localStorage comme mettreAJourScoreMatch. */
export function ajouterEvenementMatch(tournoiId: string, matchId: string, texte: string) {
  if (typeof window === "undefined") return;
  const actuels = matchsDuTournoi(tournoiId).map((m) => ({ ...m }));
  const match = actuels.find((m) => m.id === matchId);
  if (!match) return;

  const minute = (match.evenements?.[0]?.minute ?? 0) + 1;
  match.evenements = [{ minute, texte }, ...(match.evenements ?? [])];

  const existants = lireBracketsGeneres();
  localStorage.setItem(CLE_BRACKETS_GENERES, JSON.stringify({ ...existants, [tournoiId]: actuels }));
}

/** Génère un arbre à élimination directe à partir d'une liste ordonnée de
 * participants (le seeding). Complète avec des "byes" si l'effectif n'est
 * pas une puissance de 2. Persisté en localStorage (pas de vrai backend). */
export function genererBracket(tournoiId: string, participants: string[]): MatchTournoi[] {
  const noms = participants.filter((n) => n.trim().length > 0);
  if (noms.length < 2) return [];

  let taille = 2;
  while (taille < noms.length) taille *= 2;
  const grille: (string | null)[] = [...noms, ...Array(taille - noms.length).fill(null)];

  const totalRounds = Math.log2(taille);
  const matchs: MatchTournoi[] = [];

  for (let i = 0; i < taille / 2; i++) {
    const j1 = grille[i * 2];
    const j2 = grille[i * 2 + 1];
    matchs.push({
      id: `${tournoiId}-r1-${i}`,
      tournoiId,
      round: 1,
      position: i,
      joueur1: j1,
      joueur2: j2,
      score1: null,
      score2: null,
      statut: "a_venir",
    });
  }

  for (let round = 2; round <= totalRounds; round++) {
    const nbMatchs = taille / 2 ** round;
    for (let i = 0; i < nbMatchs; i++) {
      matchs.push({
        id: `${tournoiId}-r${round}-${i}`,
        tournoiId,
        round,
        position: i,
        joueur1: null,
        joueur2: null,
        score1: null,
        score2: null,
        statut: "a_venir",
      });
    }
  }

  if (typeof window !== "undefined") {
    const existants = lireBracketsGeneres();
    localStorage.setItem(
      CLE_BRACKETS_GENERES,
      JSON.stringify({ ...existants, [tournoiId]: matchs }),
    );
  }

  return matchs;
}

function perdantDe(match: MatchTournoi): string | null {
  if (match.statut !== "termine") return null;
  const gagnant = (match.score1 ?? 0) > (match.score2 ?? 0) ? match.joueur1 : match.joueur2;
  return gagnant === match.joueur1 ? match.joueur2 : match.joueur1;
}

/** Classement final déduit du bracket (1er = vainqueur), pour la distribution
 * automatique des points en fin de tournoi. Vide tant que la finale n'est
 * pas terminée. */
export function classementFinalBracket(tournoiId: string): string[] {
  const matches = matchsDuTournoi(tournoiId);
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
