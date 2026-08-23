/**
 * Stockage fichiers dédié (dernière priorité backend) — remplace les data
 * URL stockées directement dans les colonnes text de Postgres
 * (profiles.photo_url, organisateur_profils.photo_url/banniere_url,
 * tournois.banniere_url, kyc_verifications.recto_url/verso_url/selfie_url)
 * par de vrais objets Supabase Storage.
 *
 * Toujours médié par le serveur, clé service_role (jamais exposée au
 * client, jamais NEXT_PUBLIC_*) — même discipline que Prisma qui contourne
 * le RLS Postgres : ici on contourne le RLS storage.objects, donc chaque
 * route appelante doit avoir déjà vérifié elle-même que l'utilisateur a le
 * droit d'écrire à cet endroit (même règle que partout ailleurs dans ce
 * projet).
 */

import { createClient } from "@supabase/supabase-js";

const BUCKET_PUBLIC = "public-assets";
const BUCKET_KYC = "kyc-documents";

let client: ReturnType<typeof createClient> | null = null;
function clientService() {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const cle = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !cle) throw new Error("Stockage fichiers non configuré : SUPABASE_SERVICE_ROLE_KEY manquante.");
    client = createClient(url, cle, { auth: { persistSession: false } });
  }
  return client;
}

function decoderDataUrl(dataUrl: string): { contentType: string; buffer: Buffer } {
  const correspondance = dataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!correspondance) throw new Error("Format d'image invalide (data URL attendue).");
  const [, contentType, base64] = correspondance;
  return { contentType, buffer: Buffer.from(base64, "base64") };
}

function extensionDe(contentType: string): string {
  return contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";
}

/** Téléverse une image publique (avatar, bannière) — retourne l'URL
 * publique directement utilisable en <img src>. `upsert` : un même chemin
 * (ex. avatars/{profileId}.jpg) remplace l'ancienne image plutôt que d'en
 * accumuler une nouvelle à chaque changement. */
export async function televerserImagePublique(dataUrl: string, dossier: string, idStable: string): Promise<string> {
  const { contentType, buffer } = decoderDataUrl(dataUrl);
  const chemin = `${dossier}/${idStable}.${extensionDe(contentType)}`;
  const { error } = await clientService().storage.from(BUCKET_PUBLIC).upload(chemin, buffer, { contentType, upsert: true });
  if (error) throw error;
  return clientService().storage.from(BUCKET_PUBLIC).getPublicUrl(chemin).data.publicUrl;
}

/** Téléverse un document privé (KYC) — retourne le CHEMIN dans le bucket
 * (pas une URL, le bucket n'est pas public), à stocker tel quel en base.
 * La lecture passe systématiquement par urlSigneeDocument ci-dessous. */
export async function televerserDocumentPrive(dataUrl: string, dossier: string, nomFichier: string): Promise<string> {
  const { contentType, buffer } = decoderDataUrl(dataUrl);
  const chemin = `${dossier}/${nomFichier}.${extensionDe(contentType)}`;
  const { error } = await clientService().storage.from(BUCKET_KYC).upload(chemin, buffer, { contentType, upsert: true });
  if (error) throw error;
  return chemin;
}

/** URL signée temporaire (5 min par défaut) pour afficher un document KYC —
 * générée à la demande, jamais stockée : un lien volé expire vite. */
export async function urlSigneeDocument(chemin: string, expirationSec = 300): Promise<string | undefined> {
  const { data } = await clientService().storage.from(BUCKET_KYC).createSignedUrl(chemin, expirationSec);
  return data?.signedUrl;
}
