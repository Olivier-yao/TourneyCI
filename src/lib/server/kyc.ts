/**
 * Vérification d'identité organisateur (KYC) — server-side réel, remplace
 * l'ancien flux mock (mockOrganisateur.ts estCertifie/soumettreCertification,
 * localStorage) : les documents étaient capturés dans une vraie UI mais
 * jamais lus ni envoyés nulle part (juste le nom de fichier concaténé dans
 * une chaîne), et la vérification était instantanément "validée" sans aucun
 * examen. La table kyc_verifications existait déjà en base (migration
 * v2_identite_organisateurs) mais rien ne l'utilisait.
 *
 * Les 3 images (recto/verso/selfie) sont stockées en data URL directement
 * dans les colonnes text — même pattern déjà utilisé pour
 * organisateur_profils.photo_url/banniere_url (pas de object storage dédié
 * dans ce projet, chantier séparé si le volume l'exige un jour).
 */

import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import type { statut_kyc } from "@/generated/prisma/client";
import { documentEstListeNoire } from "@/lib/server/moderation";
import { analyserDocument, analyserSelfie } from "@/lib/server/kycAnalyse";

export type KycJSON = {
  id: string;
  typePiece: string;
  ageConfirme: boolean;
  statut: statut_kyc;
  horodatage: number;
};

function versKycJSON(row: { id: string; type_piece: string; age_confirme: boolean; statut: statut_kyc; created_at: Date }): KycJSON {
  return { id: row.id, typePiece: row.type_piece, ageConfirme: row.age_confirme, statut: row.statut, horodatage: row.created_at.getTime() };
}

export async function derniereVerificationKyc(profileId: string): Promise<KycJSON | undefined> {
  const row = await prisma.kyc_verifications.findFirst({ where: { profile_id: profileId }, orderBy: { created_at: "desc" } });
  return row ? versKycJSON(row) : undefined;
}

/** Le seul vrai critère "identité vérifiée" côté serveur — jamais un flag
 * client. Utilisé pour le gate commission/retraits et pour identite_verifiee
 * sur les demandes organisateur (cf. src/lib/server/demandesOrganisateur.ts). */
export async function estCertifie(profileId: string): Promise<boolean> {
  const validee = await prisma.kyc_verifications.findFirst({ where: { profile_id: profileId, statut: "validee" } });
  return Boolean(validee);
}

export type SoumissionKyc = { typePiece: string; rectoUrl: string; versoUrl: string; selfieUrl: string; ageConfirme: boolean };

/** Idempotent comme les autres flux "demande" de l'app (annulation,
 * organisateur) : une vérification déjà validée ou en attente n'en recrée
 * pas une nouvelle — seule une vérification refusée permet de resoumettre. */
export async function soumettreVerificationKyc(profileId: string, s: SoumissionKyc): Promise<{ ok: true; data: KycJSON } | { ok: false; erreur: string }> {
  if (!s.ageConfirme) return { ok: false, erreur: "Confirmation d'âge requise." };
  if (!s.rectoUrl || !s.versoUrl || !s.selfieUrl) return { ok: false, erreur: "Recto, verso et selfie sont tous requis." };

  const existante = await derniereVerificationKyc(profileId);
  if (existante && existante.statut !== "refusee") return { ok: true, data: existante };

  const documentHash = createHash("sha256").update(s.rectoUrl).digest("hex");
  if (await documentEstListeNoire(documentHash)) {
    return { ok: false, erreur: "Cette pièce d'identité ne peut pas être utilisée pour une vérification." };
  }

  // Pré-filtre automatique léger (OCR + détection de visage) : rejette les
  // soumissions manifestement invalides avant même d'atteindre la revue
  // humaine. Ce n'est qu'un heuristique — la revue dans /tourney-control
  // reste la décision finale pour tout ce qui passe ce filtre.
  const [rectoAnalyse, versoAnalyse, selfieAnalyse] = await Promise.all([
    analyserDocument(s.rectoUrl),
    analyserDocument(s.versoUrl),
    analyserSelfie(s.selfieUrl),
  ]);
  if (!rectoAnalyse.ok) return { ok: false, erreur: `Recto : ${rectoAnalyse.raison}` };
  if (!versoAnalyse.ok) return { ok: false, erreur: `Verso : ${versoAnalyse.raison}` };
  if (!selfieAnalyse.ok) return { ok: false, erreur: `Selfie : ${selfieAnalyse.raison}` };

  const row = await prisma.kyc_verifications.create({
    data: {
      profile_id: profileId,
      type_piece: s.typePiece,
      recto_url: s.rectoUrl,
      verso_url: s.versoUrl,
      selfie_url: s.selfieUrl,
      age_confirme: s.ageConfirme,
      document_hash: documentHash,
      statut: "en_attente",
    },
  });
  return { ok: true, data: versKycJSON(row) };
}

export type KycAdminJSON = KycJSON & { nomOrganisateur: string; rectoUrl: string; versoUrl: string; selfieUrl: string; profileId: string };

export async function verificationsKycEnAttente(): Promise<KycAdminJSON[]> {
  const lignes = await prisma.kyc_verifications.findMany({
    where: { statut: "en_attente" },
    orderBy: { created_at: "asc" },
    include: { profiles: { include: { organisateur_profils: true } } },
  });
  return lignes.map((l) => ({
    ...versKycJSON(l),
    profileId: l.profile_id,
    nomOrganisateur: l.profiles.organisateur_profils?.nom_organisateur ?? l.profiles.pseudo,
    rectoUrl: l.recto_url,
    versoUrl: l.verso_url,
    selfieUrl: l.selfie_url,
  }));
}

/** Traite une vérification (valide/refuse) et notifie le demandeur. */
export async function traiterVerificationKyc(id: string, statut: "validee" | "refusee"): Promise<KycJSON | undefined> {
  const existante = await prisma.kyc_verifications.findUnique({ where: { id } });
  if (!existante) return undefined;

  const row = await prisma.kyc_verifications.update({ where: { id }, data: { statut } });
  const texte =
    statut === "validee"
      ? "Ton identité a été vérifiée. Tu peux désormais retirer tes gains, et toucher ta commission si tu organises des tournois payants."
      : "Ta vérification d'identité a été refusée — vérifie que tes documents sont lisibles et non expirés, puis renvoie une nouvelle demande.";
  await prisma.notifications.create({ data: { destinataire_id: row.profile_id, texte } });

  return versKycJSON(row);
}
