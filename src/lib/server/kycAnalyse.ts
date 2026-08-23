/**
 * Contrôle automatique léger des pièces envoyées lors de la vérification
 * d'identité (KYC) : un filtre heuristique exécuté à la soumission, avant
 * la revue humaine dans /tourney-control (onglet Identité) qui reste la
 * décision finale. N'utilise aucun service tiers payant — OCR local
 * (tesseract.js) pour le recto/verso, détection de visage locale
 * (blazeface sur tfjs pur, sans binaire natif) pour le selfie.
 *
 * En cas d'échec de l'analyse elle-même (modèle indisponible, image
 * illisible, etc.), on laisse passer vers la revue manuelle plutôt que de
 * bloquer la soumission : ce n'est qu'un pré-filtre, pas la vérité finale.
 */

import { tmpdir } from "os";
import { decode as decodeJpeg } from "jpeg-js";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-cpu";
import * as blazeface from "@tensorflow-models/blazeface";
import { createWorker, OEM, type Worker } from "tesseract.js";

let backendPret: Promise<void> | null = null;
function assurerBackendCpu(): Promise<void> {
  if (!backendPret) {
    backendPret = (async () => {
      await tf.setBackend("cpu");
      await tf.ready();
    })();
  }
  return backendPret;
}

let modeleVisage: Promise<blazeface.BlazeFaceModel> | null = null;
function chargerModeleVisage(): Promise<blazeface.BlazeFaceModel> {
  if (!modeleVisage) {
    modeleVisage = assurerBackendCpu().then(() => blazeface.load());
  }
  return modeleVisage;
}

let ocrWorker: Promise<Worker> | null = null;
function chargerOcrWorker(): Promise<Worker> {
  if (!ocrWorker) {
    // cachePath explicite : le répertoire du projet n'est pas inscriptible
    // en production (Vercel), seul /tmp (os.tmpdir()) l'est.
    ocrWorker = createWorker("fra", OEM.DEFAULT, { cachePath: tmpdir() });
  }
  return ocrWorker;
}

export type ResultatAnalyseDocument = { ok: boolean; raison?: string };

/** Un vrai document d'identité contient toujours du texte (nom, numéro,
 * dates...) ; une photo quelconque envoyée par erreur (ou volontairement
 * pour contourner le contrôle) n'en contient généralement pas assez. */
export async function analyserDocument(dataUrl: string): Promise<ResultatAnalyseDocument> {
  try {
    const worker = await chargerOcrWorker();
    const { data } = await worker.recognize(dataUrl);
    const texte = data.text.replace(/\s+/g, " ").trim();
    if (texte.length < 15 || data.confidence < 35) {
      return { ok: false, raison: "Aucun texte de document lisible sur cette image." };
    }
    return { ok: true };
  } catch (erreur) {
    console.error("[kycAnalyse] Échec de l'OCR, soumission transmise à la revue manuelle :", erreur);
    return { ok: true };
  }
}

export type ResultatAnalyseSelfie = { ok: boolean; raison?: string };

/** Vérifie qu'un seul visage net est présent sur le selfie. */
export async function analyserSelfie(dataUrl: string): Promise<ResultatAnalyseSelfie> {
  let tenseur: tf.Tensor3D | null = null;
  try {
    const virgule = dataUrl.indexOf(",");
    const base64 = virgule >= 0 ? dataUrl.slice(virgule + 1) : dataUrl;
    const buffer = Buffer.from(base64, "base64");
    const { width, height, data } = decodeJpeg(buffer, { useTArray: true, formatAsRGBA: false });
    tenseur = tf.tensor3d(data, [height, width, 3], "int32");

    const modele = await chargerModeleVisage();
    const visages = await modele.estimateFaces(tenseur, false);

    if (visages.length === 0) {
      return { ok: false, raison: "Aucun visage détecté sur la photo." };
    }
    if (visages.length > 1) {
      return { ok: false, raison: "Plusieurs visages détectés : une seule personne doit apparaître." };
    }
    return { ok: true };
  } catch (erreur) {
    console.error("[kycAnalyse] Échec de la détection de visage, soumission transmise à la revue manuelle :", erreur);
    return { ok: true };
  } finally {
    tenseur?.dispose();
  }
}
