"use server";

import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-server";

export type CreerEvenementState = { erreur?: string };

export async function creerEvenement(
  _etatPrecedent: CreerEvenementState,
  formData: FormData,
): Promise<CreerEvenementState> {
  const nom = String(formData.get("nom") ?? "").trim();
  const jeu = String(formData.get("jeu") ?? "").trim();
  const dateValue = String(formData.get("date") ?? "");
  const lieu = String(formData.get("lieu") ?? "").trim();
  const maxParticipants = Number(formData.get("max_participants"));
  const fraisInscription = Number(formData.get("frais_inscription"));

  if (!nom || !jeu || !dateValue || !lieu) {
    return { erreur: "Merci de remplir tous les champs." };
  }
  if (!Number.isInteger(maxParticipants) || maxParticipants < 2) {
    return {
      erreur: "Le nombre max de participants doit être un entier d'au moins 2.",
    };
  }
  if (!Number.isInteger(fraisInscription) || fraisInscription < 0) {
    return {
      erreur: "Les frais d'inscription doivent être un entier positif (FCFA).",
    };
  }

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return { erreur: "Date invalide." };
  }

  const { data, error } = await supabaseAdmin
    .from("events")
    .insert({
      nom,
      jeu,
      date: date.toISOString(),
      lieu,
      max_participants: maxParticipants,
      frais_inscription: fraisInscription,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { erreur: "Erreur lors de la création de l'événement." };
  }

  redirect(`/evenements/${data.id}`);
}
