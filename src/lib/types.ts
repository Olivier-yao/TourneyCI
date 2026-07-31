export type EventStatut = "ouvert" | "cloture" | "en_cours" | "termine";

export type Event = {
  id: string;
  nom: string;
  jeu: string;
  date: string;
  lieu: string;
  max_participants: number;
  frais_inscription: number;
  statut: EventStatut;
  created_at: string;
};

export type StatutPaiement = "en_attente" | "paye";

export type Participant = {
  id: string;
  event_id: string;
  nom: string;
  pseudo_tiktok: string;
  whatsapp: string;
  statut_paiement: StatutPaiement;
  created_at: string;
};

export type MatchStatut = "a_venir" | "en_cours" | "termine";

export type Match = {
  id: string;
  event_id: string;
  round: number;
  position: number;
  participant1_id: string | null;
  participant2_id: string | null;
  score1: number | null;
  score2: number | null;
  gagnant_id: string | null;
  statut: MatchStatut;
};
