"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, CheckCircle2, Upload } from "lucide-react";
import { AppBar } from "@/components/ds/AppBar";
import { Button } from "@/components/ds/Button";
import { COMMISSION_PCT } from "@/lib/mockTournaments";
import { estCertifie, soumettreCertification, demandeCertification } from "@/lib/mockOrganisateur";

export default function CertificationPage() {
  const router = useRouter();
  const [certifie, setCertifie] = useState(false);
  const [ageConfirme, setAgeConfirme] = useState(false);
  const [document, setDocument] = useState<File | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoye, setEnvoye] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCertifie(estCertifie());
  }, []);

  function soumettre() {
    if (!ageConfirme) {
      setErreur("Tu dois confirmer avoir 18 ans ou plus.");
      return;
    }
    if (!document) {
      setErreur("Ajoute un document officiel (CNI, passeport...).");
      return;
    }
    soumettreCertification(ageConfirme, document.name);
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
          <p className="text-base font-medium">Organisateur certifié</p>
          <p className="text-sm max-w-xs" style={{ color: "var(--ds-text-muted)" }}>
            {envoye
              ? "Ta demande a été validée. Tu touches désormais la commission de 5 % sur tes tournois payants."
              : `Vérifié le ${demande?.soumisLe ?? ""} — document : ${demande?.documentNom ?? ""}.`}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col px-6 py-4 gap-5" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
      <AppBar retour titre="Vérification d'identité" onRetour={() => router.push("/profil")} />

      <div className="flex items-start gap-3 p-4" style={{ borderRadius: "var(--ds-radius-lg)", background: "var(--ds-accent-900)" }}>
        <ShieldCheck size={20} strokeWidth={2} style={{ color: "var(--ds-accent-300)" }} className="shrink-0 mt-0.5" />
        <p className="text-sm" style={{ color: "var(--ds-accent-300)" }}>
          Tant que ton compte n&apos;est pas vérifié, tu peux organiser des tournois gratuits, mais tu ne touches
          pas la commission de {Math.round(COMMISSION_PCT * 100)} % sur les tournois payants. Elle reste calculée et
          affichée, mais n&apos;est créditée qu&apos;après validation.
        </p>
      </div>

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={ageConfirme}
          onChange={(e) => setAgeConfirme(e.target.checked)}
          className="mt-0.5 w-[18px] h-[18px] cursor-pointer"
        />
        <span className="text-sm">Je confirme avoir 18 ans ou plus.</span>
      </label>

      <div className="flex flex-col gap-2">
        <div className="text-xs uppercase tracking-wide" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
          Document officiel
        </div>
        <label
          className="flex items-center gap-3 p-3.5 cursor-pointer"
          style={{ borderRadius: "var(--ds-radius-md)", border: "1px dashed var(--ds-border-strong)", background: "var(--ds-surface)" }}
        >
          <Upload size={18} strokeWidth={2} style={{ color: "var(--ds-muted)" }} />
          <span className="flex-1 text-sm" style={{ color: document ? "var(--ds-text)" : "var(--ds-muted)" }}>
            {document ? document.name : "CNI, passeport ou permis de conduire"}
          </span>
          <input
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            onChange={(e) => setDocument(e.target.files?.[0] ?? null)}
          />
        </label>
      </div>

      {erreur && <p className="text-sm" style={{ color: "var(--ds-danger)" }}>{erreur}</p>}

      <div className="mt-auto">
        <Button variante="primary" bloc onClick={soumettre}>
          Envoyer pour vérification
        </Button>
      </div>
    </div>
  );
}
