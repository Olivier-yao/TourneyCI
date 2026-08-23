/**
 * Plaintes/signalements envoyés depuis "Service client" (priorité backend
 * #7) — remplace mockPlaintes.ts (localStorage). La table `plaintes`
 * existait déjà en base (jamais exploitée) ; RLS laissé sans policy (accès
 * direct bloqué pour tout le monde, même profil que kyc_verifications) —
 * entièrement admin-only + auteur, tout passe par ce module côté serveur.
 */

import { prisma } from "@/lib/prisma";

export type StatutPlainte = "en_attente" | "traitee";

export type PlainteJSON = {
  id: string;
  auteur: string;
  sujet: string;
  description: string;
  statut: StatutPlainte;
  messageAdmin?: string;
  horodatage: number;
};

function versPlainteJSON(row: { id: string; sujet: string; description: string; statut: string; message_admin: string | null; created_at: Date; profiles: { pseudo: string } }): PlainteJSON {
  return {
    id: row.id,
    auteur: row.profiles.pseudo,
    sujet: row.sujet,
    description: row.description,
    statut: row.statut as StatutPlainte,
    messageAdmin: row.message_admin ?? undefined,
    horodatage: row.created_at.getTime(),
  };
}

export async function creerPlainte(profileId: string, sujet: string, description: string): Promise<PlainteJSON | null> {
  const sujetPropre = sujet.trim();
  const descriptionPropre = description.trim();
  if (!sujetPropre || !descriptionPropre) return null;

  const ligne = await prisma.plaintes.create({
    data: { auteur_id: profileId, sujet: sujetPropre, description: descriptionPropre, statut: "en_attente" },
    include: { profiles: true },
  });
  return versPlainteJSON(ligne);
}

export async function plaintesEnAttenteJSON(): Promise<PlainteJSON[]> {
  const lignes = await prisma.plaintes.findMany({ where: { statut: "en_attente" }, include: { profiles: true }, orderBy: { created_at: "asc" } });
  return lignes.map(versPlainteJSON);
}

export async function traiterPlainte(id: string, messageAdmin: string): Promise<PlainteJSON | undefined> {
  const existant = await prisma.plaintes.findUnique({ where: { id } });
  if (!existant) return undefined;
  const ligne = await prisma.plaintes.update({
    where: { id },
    data: { statut: "traitee", message_admin: messageAdmin.trim() || null },
    include: { profiles: true },
  });
  return versPlainteJSON(ligne);
}
