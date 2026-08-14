"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, CheckCircle2, Camera, IdCard, UserCircle2 } from "lucide-react";
import { AppBar } from "@/components/ds/AppBar";
import { Button, PRESS } from "@/components/ds/Button";
import { COMMISSION_PCT } from "@/lib/mockTournaments";
import { estCertifie, soumettreCertification, demandeCertification } from "@/lib/mockOrganisateur";

const TYPES_PIECE = [
  { id: "cni", label: "CNI" },
  { id: "passeport", label: "Passeport" },
  { id: "permis", label: "Permis" },
] as const;

type TypePiece = (typeof TYPES_PIECE)[number]["id"];

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
      <input type="file" accept="image/*" className="hidden" onChange={(e) => onChange(e.target.files?.[0] ?? null)} />
    </label>
  );
}

export default function VerificationIdentitePage() {
  const router = useRouter();
  const [certifie, setCertifie] = useState(false);
  const [ageConfirme, setAgeConfirme] = useState(false);
  const [typePiece, setTypePiece] = useState<TypePiece>("cni");
  const [recto, setRecto] = useState<File | null>(null);
  const [verso, setVerso] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoye, setEnvoye] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCertifie(estCertifie());
  }, []);

  const conditions = [
    { label: "Pièce d'identité lisible et non expirée", ok: Boolean(recto && verso) },
    { label: "Selfie de contrôle sans lunettes ni casquette", ok: Boolean(selfie) },
    { label: "18 ans ou plus confirmé", ok: ageConfirme },
  ];

  function soumettre() {
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
    const label = TYPES_PIECE.find((t) => t.id === typePiece)?.label ?? "Pièce";
    soumettreCertification(ageConfirme, `${label} · ${recto.name} / ${verso.name} + selfie`);
    setErreur(null);
    setEnvoye(true);
    setCertifie(true);
  }

  const demande = demandeCertification();

  if (certifie) {
    return (
      <div className="min-h-screen flex flex-col px-6 py-4 gap-5" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
        <AppBar retour titre="Vérification d'identité" onRetour={() => router.push("/profil")} />
        <div className="flex flex-col items-center justify-center flex-1 gap-3 text-center px-4">
          <CheckCircle2 size={40} style={{ color: "var(--ds-accent-300)" }} />
          <p className="text-base font-medium">Identité vérifiée</p>
          <p className="text-sm max-w-xs" style={{ color: "var(--ds-text-muted)" }}>
            {envoye
              ? "Ta demande a été validée. Tu peux désormais retirer tes gains, et toucher ta commission si tu organises des tournois payants."
              : `Vérifié le ${demande?.soumisLe ?? ""} — document : ${demande?.documentNom ?? ""}.`}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col px-5 py-4 gap-5" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
      <AppBar retour titre="Vérification d'identité" onRetour={() => router.push("/profil")} />
      <p className="text-[10px] uppercase tracking-wide -mt-3" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
        Organisateur · étape 1 sur 2
      </p>

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
        <Button variante="primary" bloc onClick={soumettre}>
          Envoyer pour vérification
        </Button>
        <p className="text-[10px] text-center" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
          RÉPONSE SOUS 48H · DOCUMENTS CHIFFRÉS, JAMAIS PUBLICS
        </p>
      </div>
    </div>
  );
}
