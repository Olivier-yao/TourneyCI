"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, CheckCircle2, XCircle, Camera, IdCard, UserCircle2, Loader2, Clock } from "lucide-react";
import { AppBar } from "@/components/ds/AppBar";
import { Button, PRESS } from "@/components/ds/Button";
import { COMMISSION_PCT } from "@/lib/mockTournaments";
import { maVerificationIdentite, soumettreVerificationIdentite, type VerificationIdentite } from "@/lib/mockOrganisateur";

const TYPES_PIECE = [
  { id: "cni", label: "CNI" },
  { id: "passeport", label: "Passeport" },
  { id: "permis", label: "Permis" },
] as const;

type TypePiece = (typeof TYPES_PIECE)[number]["id"];

const TAILLE_MAX_PX = 1000;

/** Convertit un fichier image en data URL JPEG, redimensionnée si besoin —
 * même principe que PhotoCropper.tsx (pas d'object storage dédié dans ce
 * projet, cf. organisateur_profils.photo_url) mais sans recadrage
 * interactif : un document d'identité ne doit pas être rogné. */
function fichierVersDataUrl(fichier: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const lecteur = new FileReader();
    lecteur.onerror = () => reject(new Error("Lecture du fichier impossible."));
    lecteur.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Image invalide."));
      img.onload = () => {
        const echelle = Math.min(1, TAILLE_MAX_PX / Math.max(img.naturalWidth, img.naturalHeight));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.naturalWidth * echelle);
        canvas.height = Math.round(img.naturalHeight * echelle);
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Encodage impossible."));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = lecteur.result as string;
    };
    lecteur.readAsDataURL(fichier);
  });
}

function EmplacementFichier({
  label,
  fichier,
  onChange,
}: {
  label: string;
  fichier: File | null;
  onChange: (f: File | null) => void;
}) {
  return (
    <label
      className={`relative flex flex-col items-center justify-center gap-1.5 cursor-pointer ${PRESS}`}
      style={{
        aspectRatio: "8 / 5",
        borderRadius: "var(--ds-radius-md)",
        border: fichier ? "1px solid var(--ds-accent)" : "1px dashed var(--ds-border-strong)",
        background: fichier ? "var(--ds-accent-900)" : "var(--ds-surface)",
        color: fichier ? "var(--ds-accent-300)" : "var(--ds-muted)",
      }}
    >
      <IdCard size={19} strokeWidth={2} />
      <span className="text-[9px] uppercase tracking-wide" style={{ fontFamily: "var(--ds-font-mono)" }}>
        {fichier ? "Ajouté" : label}
      </span>
      <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => onChange(e.target.files?.[0] ?? null)} />
    </label>
  );
}

function dateLongue(ts: number): string {
  return new Date(ts).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export default function VerificationIdentitePage() {
  const router = useRouter();
  const [pret, setPret] = useState(false);
  const [verification, setVerification] = useState<VerificationIdentite | null>(null);
  const [ageConfirme, setAgeConfirme] = useState(false);
  const [typePiece, setTypePiece] = useState<TypePiece>("cni");
  const [recto, setRecto] = useState<File | null>(null);
  const [verso, setVerso] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);

  useEffect(() => {
    maVerificationIdentite().then((v) => {
      setVerification(v);
      setPret(true);
    });
  }, []);

  const conditions = [
    { label: "Pièce d'identité lisible et non expirée", ok: Boolean(recto && verso) },
    { label: "Selfie de contrôle sans lunettes ni casquette", ok: Boolean(selfie) },
    { label: "18 ans ou plus confirmé", ok: ageConfirme },
  ];

  async function soumettre() {
    if (!ageConfirme) {
      setErreur("Tu dois confirmer avoir 18 ans ou plus.");
      return;
    }
    if (!recto || !verso) {
      setErreur("Ajoute le recto et le verso de ta pièce d'identité.");
      return;
    }
    if (!selfie) {
      setErreur("Ajoute un selfie de contrôle.");
      return;
    }
    setErreur(null);
    setEnvoi(true);
    try {
      const [rectoUrl, versoUrl, selfieUrl] = await Promise.all([fichierVersDataUrl(recto), fichierVersDataUrl(verso), fichierVersDataUrl(selfie)]);
      const resultat = await soumettreVerificationIdentite({ typePiece, rectoUrl, versoUrl, selfieUrl, ageConfirme });
      if (!resultat.ok) {
        setErreur(resultat.erreur ?? "Envoi impossible pour l'instant.");
        setEnvoi(false);
        return;
      }
      setVerification(resultat.data ?? null);
    } catch {
      setErreur("Un des fichiers n'a pas pu être traité — réessaie avec une autre photo.");
      setEnvoi(false);
    }
  }

  if (!pret) return null;

  if (envoi && verification?.statut !== "en_attente") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
        <Loader2 size={32} className="animate-spin" style={{ color: "var(--ds-accent-300)" }} />
        <p className="text-base font-medium">Envoi en cours</p>
      </div>
    );
  }

  if (verification?.statut === "en_attente") {
    return (
      <div className="min-h-screen flex flex-col px-6 py-4 gap-5" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
        <AppBar retour titre="Vérification d'identité" onRetour={() => router.back()} />
        <div className="flex flex-col items-center justify-center flex-1 gap-3 text-center px-4">
          <Clock size={40} style={{ color: "var(--ds-accent-300)" }} />
          <p className="text-base font-medium">Vérification en attente</p>
          <p className="text-sm max-w-xs" style={{ color: "var(--ds-text-muted)" }}>
            Tes documents ont été envoyés le {dateLongue(verification.horodatage)}. Un administrateur les examine — réponse
            sous 48h, tu seras notifié.
          </p>
        </div>
      </div>
    );
  }

  if (verification?.statut === "validee") {
    return (
      <div className="min-h-screen flex flex-col px-6 py-4 gap-5" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
        <AppBar retour titre="Vérification d'identité" onRetour={() => router.back()} />
        <div className="flex flex-col items-center justify-center flex-1 gap-3 text-center px-4">
          <CheckCircle2 size={40} style={{ color: "var(--ds-accent-300)" }} />
          <p className="text-base font-medium">Identité vérifiée</p>
          <p className="text-sm max-w-xs" style={{ color: "var(--ds-text-muted)" }}>
            Vérifiée le {dateLongue(verification.horodatage)}. Tu peux désormais retirer tes gains, et toucher ta
            commission si tu organises des tournois payants.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col px-5 py-4 gap-5" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
      <AppBar retour titre="Vérification d'identité" onRetour={() => router.back()} />
      <p className="text-[10px] uppercase tracking-wide -mt-3" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
        Organisateur · étape 1 sur 2
      </p>

      {verification?.statut === "refusee" && (
        <div className="flex items-start gap-3 p-3.5" style={{ borderRadius: "var(--ds-radius-md)", background: "color-mix(in srgb, var(--ds-danger) 12%, var(--ds-surface))", boxShadow: "0 0 0 1px var(--ds-danger)" }}>
          <XCircle size={17} strokeWidth={2} style={{ color: "var(--ds-danger)" }} className="shrink-0 mt-0.5" />
          <p className="text-xs leading-relaxed" style={{ color: "var(--ds-text-muted)" }}>
            Ta précédente demande a été refusée — vérifie que tes documents sont lisibles et non expirés, puis renvoie une
            nouvelle demande.
          </p>
        </div>
      )}

      <div className="flex items-start gap-3 p-3.5" style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", boxShadow: "0 0 0 1px var(--ds-accent-700)" }}>
        <ShieldCheck size={17} strokeWidth={2} style={{ color: "var(--ds-accent-400)" }} className="shrink-0 mt-0.5" />
        <p className="text-xs leading-relaxed" style={{ color: "var(--ds-text-muted)" }}>
          Sans certification, tu organises des tournois gratuits mais la commission de {Math.round(COMMISSION_PCT * 100)} % reste bloquée sur la plateforme, et tu ne peux pas retirer tes gains.
        </p>
      </div>

      <div className="flex flex-col gap-2.5">
        <div className="text-[10px] uppercase tracking-wide" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
          Pièce d&apos;identité
        </div>
        <div className="flex gap-1.5">
          {TYPES_PIECE.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTypePiece(t.id)}
              className={`flex-1 h-8 text-xs font-medium ${PRESS}`}
              style={{
                borderRadius: "var(--ds-radius-md)",
                border: `1px solid ${typePiece === t.id ? "var(--ds-accent)" : "var(--ds-border)"}`,
                background: typePiece === t.id ? "var(--ds-accent-900)" : "transparent",
                color: typePiece === t.id ? "var(--ds-accent-300)" : "var(--ds-muted)",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <EmplacementFichier label="Recto" fichier={recto} onChange={setRecto} />
          <EmplacementFichier label="Verso" fichier={verso} onChange={setVerso} />
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        <div className="text-[10px] uppercase tracking-wide" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
          Selfie de contrôle
        </div>
        <label
          className={`flex items-center gap-3.5 p-3.5 cursor-pointer ${PRESS}`}
          style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)" }}
        >
          <div
            className="flex items-center justify-center w-[54px] h-[54px] shrink-0"
            style={{ borderRadius: "var(--ds-radius-pill)", border: `1px dashed ${selfie ? "var(--ds-accent)" : "var(--ds-border-strong)"}`, color: selfie ? "var(--ds-accent-300)" : "var(--ds-muted)" }}
          >
            {selfie ? <UserCircle2 size={22} strokeWidth={2} /> : <Camera size={20} strokeWidth={2} />}
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium">{selfie ? selfie.name : "Prendre un selfie"}</div>
            <div className="text-xs mt-0.5" style={{ color: "var(--ds-text-muted)" }}>
              Visage bien éclairé, sans lunettes ni casquette.
            </div>
          </div>
          <input type="file" accept="image/*" capture="user" className="hidden" onChange={(e) => setSelfie(e.target.files?.[0] ?? null)} />
        </label>
      </div>

      <label className="flex items-start gap-2.5 cursor-pointer">
        <input
          type="checkbox"
          checked={ageConfirme}
          onChange={(e) => setAgeConfirme(e.target.checked)}
          className="mt-0.5 w-[18px] h-[18px] cursor-pointer"
        />
        <span className="text-sm">Je confirme avoir 18 ans ou plus.</span>
      </label>

      <div className="flex flex-col gap-1">
        {conditions.map((c) => (
          <div key={c.label} className="flex items-center gap-2.5 py-2" style={{ borderBottom: "1px solid var(--ds-border)" }}>
            <CheckCircle2 size={15} strokeWidth={2} style={{ color: c.ok ? "var(--ds-accent-300)" : "var(--ds-muted)" }} />
            <span className="flex-1 text-[13px]" style={{ color: c.ok ? "var(--ds-text)" : "var(--ds-muted)" }}>{c.label}</span>
            <span className="text-[10px]" style={{ color: c.ok ? "var(--ds-accent-300)" : "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
              {c.ok ? "OK" : "MANQUANT"}
            </span>
          </div>
        ))}
      </div>

      {erreur && <p className="text-sm" style={{ color: "var(--ds-danger)" }}>{erreur}</p>}

      <div className="mt-auto flex flex-col gap-2">
        <Button variante="primary" bloc onClick={soumettre} disabled={envoi}>
          {envoi ? "Envoi…" : "Envoyer pour vérification"}
        </Button>
        <p className="text-[10px] text-center" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
          RÉPONSE SOUS 48H · DOCUMENTS CHIFFRÉS, JAMAIS PUBLICS
        </p>
      </div>
    </div>
  );
}
