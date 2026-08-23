import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { VALIDATION_AUTOMATIQUE_ACTIVE } from "@/lib/mockValidationAuto";
import { rembourserInscritsAnnulation } from "@/lib/server/cloture";

/** Marque le tournoi annulé de façon atomique (WHERE annule_le IS NULL) et
 * rembourse chaque inscrit réel une seule fois — cf. rembourserInscritsAnnulation. */
async function annulerEtRembourser(tournoiId: string): Promise<void> {
  const { count } = await prisma.tournois.updateMany({ where: { id: tournoiId, annule_le: null }, data: { annule_le: new Date() } });
  if (count > 0) await rembourserInscritsAnnulation(tournoiId);
}

export type StatutDemandeAnnulation = "en_attente" | "validee" | "refusee";

export type DemandeAnnulationJSON = {
  id: string;
  tournoiId: string;
  motif: string;
  statut: StatutDemandeAnnulation;
  messageAdmin?: string;
  horodatage: number;
};

export function versDemandeAnnulationJSON(d: {
  id: string;
  tournoi_id: string;
  motif: string;
  statut: string;
  message_admin: string | null;
  created_at: Date;
}): DemandeAnnulationJSON {
  return {
    id: d.id,
    tournoiId: d.tournoi_id,
    motif: d.motif,
    statut: d.statut as StatutDemandeAnnulation,
    messageAdmin: d.message_admin ?? undefined,
    horodatage: d.created_at.getTime(),
  };
}

export async function demandeEnAttentePour(tournoiId: string): Promise<DemandeAnnulationJSON | undefined> {
  const demande = await prisma.demandes_annulation.findFirst({ where: { tournoi_id: tournoiId, statut: "en_attente" } });
  return demande ? versDemandeAnnulationJSON(demande) : undefined;
}

/** Idempotent : une demande déjà en attente pour ce tournoi n'en recrée pas
 * une nouvelle (même comportement que le mock). Auto-validée immédiatement
 * (et le tournoi annulé dans la foulée) tant que VALIDATION_AUTOMATIQUE_ACTIVE
 * est vrai — pré-backend, cf. mockValidationAuto.ts. */
export async function creerDemande(tournoiId: string, organisateurId: string, motif: string): Promise<DemandeAnnulationJSON> {
  const existante = await demandeEnAttentePour(tournoiId);
  if (existante) return existante;

  const demande = await prisma.demandes_annulation.create({
    data: {
      tournoi_id: tournoiId,
      organisateur_id: organisateurId,
      motif,
      statut: VALIDATION_AUTOMATIQUE_ACTIVE ? "validee" : "en_attente",
      message_admin: VALIDATION_AUTOMATIQUE_ACTIVE ? "Validation automatique (pré-backend, point 157)." : undefined,
    },
  });
  if (VALIDATION_AUTOMATIQUE_ACTIVE) {
    await annulerEtRembourser(tournoiId);
  }
  return versDemandeAnnulationJSON(demande);
}

const includeTournoi = {
  tournois: { include: { profiles: { include: { organisateur_profils: true } }, _count: { select: { inscriptions: true } } } },
} satisfies Prisma.demandes_annulationInclude;

export type DemandeAnnulationAdminJSON = DemandeAnnulationJSON & {
  tournoiTitre: string;
  organisateurNom: string;
  placesInscrites: number;
};

export async function demandesEnAttente(): Promise<DemandeAnnulationAdminJSON[]> {
  const demandes = await prisma.demandes_annulation.findMany({
    where: { statut: "en_attente" },
    orderBy: { created_at: "asc" },
    include: includeTournoi,
  });
  return demandes.map((d) => ({
    ...versDemandeAnnulationJSON(d),
    tournoiTitre: d.tournois.titre,
    organisateurNom: d.tournois.profiles.organisateur_profils?.nom_organisateur ?? d.tournois.profiles.pseudo,
    placesInscrites: d.tournois._count.inscriptions,
  }));
}

/** Traite une demande (accepte/refuse) — l'acceptation annule réellement le
 * tournoi et rembourse chaque inscrit réel (cf. annulerEtRembourser). Pas de
 * notification ici : le mock n'en envoyait pas non plus pour ce traitement
 * (contrairement aux demandes organisateur). */
export async function traiterDemande(id: string, statut: "validee" | "refusee", messageAdmin?: string): Promise<DemandeAnnulationJSON | undefined> {
  const existante = await prisma.demandes_annulation.findUnique({ where: { id } });
  if (!existante) return undefined;

  const demande = await prisma.demandes_annulation.update({
    where: { id },
    data: { statut, message_admin: messageAdmin },
  });
  if (statut === "validee") {
    await annulerEtRembourser(demande.tournoi_id);
  }
  return versDemandeAnnulationJSON(demande);
}
