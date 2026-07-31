/**
 * Données mock pour un tournoi Battle Royale (une seule manche, pas d'arbre).
 * L'élimination est une mutation locale côté client (pas de persistance),
 * comme le fil du match en direct — cohérent avec le reste du chantier V2.
 */

export type StatutBR = "en_jeu" | "elimine";

export type ParticipantBR = {
  id: string;
  nom: string;
  statut: StatutBR;
  ordreElimination?: number;
};

const NOMS = [
  "Kader B.", "Yao M.", "Aya K.", "Sory D.", "Ismaël T.", "Fofana", "Traoré", "Bamba",
  "Malik K.", "Fatou T.", "Gohou", "Halima", "Nour", "Zeka", "Petit", "Delta",
  "Mariam D.", "Issa K.", "Abou S.", "Awa C.", "Kouassi", "Adjoua", "Brou", "Konan",
  "Yves L.", "Nadège", "Serge P.", "Aminata", "Moussa D.", "Rokia", "Boubacar", "Christelle",
  "Franck O.", "Grace A.", "Hervé", "Inès B.", "Jean-Luc", "Kadidia", "Lamine", "Marc T.",
  "Nadia S.", "Oumar B.", "Priscille", "Quentin", "Rachelle", "Salif K.", "Tenin", "Ulrich",
  "Vanessa", "William K.",
];

function genererParticipants(nbElimines: number): ParticipantBR[] {
  const melanges = [...NOMS];
  for (let i = melanges.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [melanges[i], melanges[j]] = [melanges[j], melanges[i]];
  }

  return melanges.map((nom, i) => ({
    id: `br-${i}`,
    nom,
    statut: i < nbElimines ? "elimine" : "en_jeu",
    ordreElimination: i < nbElimines ? i + 1 : undefined,
  }));
}

const PARTICIPANTS_PAR_TOURNOI: Record<string, ParticipantBR[]> = {
  "freefire-night": genererParticipants(15),
};

export function participantsBR(tournoiId: string): ParticipantBR[] {
  return PARTICIPANTS_PAR_TOURNOI[tournoiId] ?? [];
}
