"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase-server";
import { genererStructureBracket } from "@/lib/bracket";

export async function validerPaiement(eventId: string, participantId: string) {
  await supabaseAdmin
    .from("participants")
    .update({ statut_paiement: "paye" })
    .eq("id", participantId);

  revalidatePath(`/admin/evenements/${eventId}`);
}

export type GenererBracketState = { erreur?: string; succes?: boolean };

export async function genererBracket(
  eventId: string,
  _etatPrecedent: GenererBracketState,
): Promise<GenererBracketState> {
  const { data: event, error: erreurEvent } = await supabaseAdmin
    .from("events")
    .select("statut")
    .eq("id", eventId)
    .single();

  if (erreurEvent || !event) {
    return { erreur: "Événement introuvable." };
  }

  if (event.statut !== "ouvert") {
    return { erreur: "Le bracket a déjà été généré pour cet événement." };
  }

  const { data: participants, error: erreurParticipants } = await supabaseAdmin
    .from("participants")
    .select("id")
    .eq("event_id", eventId);

  if (erreurParticipants) {
    return { erreur: "Impossible de récupérer les participants." };
  }

  const participantIds = (participants ?? []).map((p) => p.id as string);

  if (participantIds.length < 2) {
    return { erreur: "Il faut au moins 2 participants inscrits." };
  }

  const structure = genererStructureBracket(participantIds);

  const { error: erreurInsertion } = await supabaseAdmin.from("matches").insert(
    structure.map((m) => ({ event_id: eventId, ...m })),
  );

  if (erreurInsertion) {
    return { erreur: "Erreur lors de la création du bracket." };
  }

  const { error: erreurCloture } = await supabaseAdmin
    .from("events")
    .update({ statut: "cloture" })
    .eq("id", eventId);

  if (erreurCloture) {
    return { erreur: "Bracket créé, mais impossible de clôturer l'événement." };
  }

  revalidatePath(`/admin/evenements/${eventId}`);
  return { succes: true };
}

export type SaisirScoreState = { erreur?: string; succes?: boolean };

export async function saisirScore(
  eventId: string,
  matchId: string,
  score1: number,
  score2: number,
): Promise<SaisirScoreState> {
  if (
    !Number.isInteger(score1) ||
    !Number.isInteger(score2) ||
    score1 < 0 ||
    score2 < 0
  ) {
    return { erreur: "Scores invalides." };
  }

  if (score1 === score2) {
    return { erreur: "Pas d'égalité possible, il doit y avoir un gagnant." };
  }

  const { data: match, error: erreurMatch } = await supabaseAdmin
    .from("matches")
    .select("*")
    .eq("id", matchId)
    .single();

  if (erreurMatch || !match) {
    return { erreur: "Match introuvable." };
  }

  if (match.statut === "termine") {
    return { erreur: "Ce match est déjà terminé." };
  }

  if (!match.participant1_id || !match.participant2_id) {
    return { erreur: "Ce match n'a pas encore ses deux participants." };
  }

  const gagnantId =
    score1 > score2 ? match.participant1_id : match.participant2_id;

  const { error: erreurUpdate } = await supabaseAdmin
    .from("matches")
    .update({ score1, score2, gagnant_id: gagnantId, statut: "termine" })
    .eq("id", matchId);

  if (erreurUpdate) {
    return { erreur: "Erreur lors de l'enregistrement du score." };
  }

  const { data: matchSuivant } = await supabaseAdmin
    .from("matches")
    .select("id")
    .eq("event_id", eventId)
    .eq("round", match.round + 1)
    .eq("position", Math.floor(match.position / 2))
    .maybeSingle();

  if (matchSuivant) {
    const champ =
      match.position % 2 === 0 ? "participant1_id" : "participant2_id";
    await supabaseAdmin
      .from("matches")
      .update({ [champ]: gagnantId })
      .eq("id", matchSuivant.id);

    const { data: event } = await supabaseAdmin
      .from("events")
      .select("statut")
      .eq("id", eventId)
      .single();

    if (event?.statut === "cloture") {
      await supabaseAdmin
        .from("events")
        .update({ statut: "en_cours" })
        .eq("id", eventId);
    }
  } else {
    // Pas de round suivant : c'était la finale, le tournoi est terminé.
    await supabaseAdmin
      .from("events")
      .update({ statut: "termine" })
      .eq("id", eventId);
  }

  revalidatePath(`/admin/evenements/${eventId}`);
  revalidatePath(`/evenements/${eventId}/live`);

  return { succes: true };
}
