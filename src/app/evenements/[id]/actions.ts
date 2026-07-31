"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase-server";

export type InscriptionState = { erreur?: string; succes?: boolean };

export async function inscrire(
  eventId: string,
  _etatPrecedent: InscriptionState,
  formData: FormData,
): Promise<InscriptionState> {
  const nom = String(formData.get("nom") ?? "").trim();
  const pseudoTiktok = String(formData.get("pseudo_tiktok") ?? "").trim();
  const whatsapp = String(formData.get("whatsapp") ?? "").trim();

  if (!nom || !pseudoTiktok || !whatsapp) {
    return { erreur: "Merci de remplir tous les champs." };
  }

  const { data: event, error: erreurEvent } = await supabaseAdmin
    .from("events")
    .select("statut, max_participants")
    .eq("id", eventId)
    .single();

  if (erreurEvent || !event) {
    return { erreur: "Événement introuvable." };
  }

  if (event.statut !== "ouvert") {
    return { erreur: "Les inscriptions sont fermées pour cet événement." };
  }

  const { count } = await supabaseAdmin
    .from("participants")
    .select("*", { count: "exact", head: true })
    .eq("event_id", eventId);

  if ((count ?? 0) >= event.max_participants) {
    return { erreur: "Cet événement est complet." };
  }

  const { error: erreurInsertion } = await supabaseAdmin
    .from("participants")
    .insert({
      event_id: eventId,
      nom,
      pseudo_tiktok: pseudoTiktok,
      whatsapp,
    });

  if (erreurInsertion) {
    return { erreur: "Erreur lors de l'inscription." };
  }

  revalidatePath(`/evenements/${eventId}`);
  return { succes: true };
}
