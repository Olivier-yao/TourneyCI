"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, ShieldAlert } from "lucide-react";
import { AppBar } from "@/components/ds/AppBar";
import { Field } from "@/components/ds/Input";
import { Button } from "@/components/ds/Button";
import { lireSolde, fraisRetrait, montantNetRetrait, retirer } from "@/lib/mockWallet";
import { estCertifie } from "@/lib/mockOrganisateur";

const DESTINATIONS = [
  { id: "wave", label: "Wave", indice: "01 •• 42" },
  { id: "orange", label: "Orange Money", indice: "07 •• 19" },
  { id: "mtn", label: "MTN MoMo", indice: "05 •• 07" },
  { id: "moov", label: "Moov Money", indice: "01 •• 88" },
] as const;

export default function RetirerPage() {
  const router = useRouter();
  const [solde, setSolde] = useState(0);
  const [montantSaisi, setMontantSaisi] = useState("40000");
  const [destination, setDestination] = useState<(typeof DESTINATIONS)[number]["id"]>("wave");
  const [erreur, setErreur] = useState<string | null>(null);
  const [fait, setFait] = useState(false);
  const [verifie, setVerifie] = useState<boolean | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSolde(lireSolde());
    setVerifie(estCertifie());
  }, []);

  const montant = Number(montantSaisi) || 0;
  const frais = fraisRetrait(montant);
  const net = montantNetRetrait(montant);

  function confirmer() {
    const libelle = DESTINATIONS.find((d) => d.id === destination)?.label ?? destination;
    const resultat = retirer(montant, libelle);
    if (!resultat.ok) {
      setErreur(resultat.erreur ?? "Retrait impossible.");
      return;
    }
    setErreur(null);
    setFait(true);
    setTimeout(() => router.push("/profil/solde"), 1400);
  }

  if (verifie === false) {
    return (
      <div className="min-h-screen flex flex-col px-6 py-4 gap-5" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
        <AppBar retour titre="Retirer mes gains" onRetour={() => router.back()} />
        <div className="flex flex-col items-center justify-center flex-1 gap-3 text-center px-4">
          <ShieldAlert size={36} style={{ color: "var(--ds-danger)" }} />
          <p className="text-base font-medium">Identité non vérifiée</p>
          <p className="text-sm max-w-xs" style={{ color: "var(--ds-text-muted)" }}>
            Tu peux déposer et gagner de l&apos;argent librement, mais il faut vérifier ton identité avant de
            pouvoir retirer tes gains.
          </p>
          <Link href="/verification-identite">
            <Button variante="primary">Vérifier mon identité</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (fait) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-6 text-center" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
        <CheckCircle2 size={36} style={{ color: "var(--ds-accent-300)" }} />
        <p className="text-base font-medium">Retrait en vérification</p>
        <p className="text-sm" style={{ color: "var(--ds-text-muted)" }}>
          {net.toLocaleString("fr-FR")} F sont en cours de vérification (5 minutes) avant traitement définitif, puis arrivent sur ton compte.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col px-5 py-4 gap-5" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
      <AppBar retour titre="Retirer mes gains" onRetour={() => router.back()} />

      <div className="p-4" style={{ borderRadius: "var(--ds-radius-lg)", background: "var(--ds-surface)", border: "1px solid var(--ds-border)" }}>
        <div className="text-[11px] uppercase tracking-wide" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
          Disponible
        </div>
        <div className="mt-1.5 text-2xl font-medium" style={{ fontFamily: "var(--ds-font-mono)" }}>
          {solde.toLocaleString("fr-FR")} F
        </div>
        <div className="mt-1 text-xs" style={{ color: "var(--ds-muted)" }}>Minimum de retrait : 1 000 F</div>
      </div>

      <Field
        label="Montant à retirer"
        value={montantSaisi}
        onChange={(e) => setMontantSaisi(e.target.value.replace(/[^0-9]/g, ""))}
        erreur={erreur ?? undefined}
      />

      <div>
        <div className="text-[11px] uppercase tracking-wide mb-2.5" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
          Vers
        </div>
        <div className="grid grid-cols-2 gap-2">
          {DESTINATIONS.map((d) => {
            const actif = destination === d.id;
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => setDestination(d.id)}
                className="p-3.5 text-left cursor-pointer"
                style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: `1px solid ${actif ? "var(--ds-accent)" : "var(--ds-border)"}` }}
              >
                <div className="text-sm font-medium">{d.label}</div>
                <div className="text-xs" style={{ color: actif ? "var(--ds-accent-300)" : "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                  {d.indice}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {montant > 0 && (
        <div className="p-3 flex flex-col gap-1.5 text-sm" style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: "1px solid var(--ds-border)" }}>
          <div className="flex justify-between">
            <span style={{ color: "var(--ds-muted)" }}>Montant demandé (débité de ton solde)</span>
            <span style={{ fontFamily: "var(--ds-font-mono)" }}>{montant.toLocaleString("fr-FR")} F</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: "var(--ds-muted)" }}>Frais de retrait déduits (1 %)</span>
            <span style={{ fontFamily: "var(--ds-font-mono)" }}>- {frais.toLocaleString("fr-FR")} F</span>
          </div>
          <div className="flex justify-between font-medium pt-1.5" style={{ borderTop: "1px solid var(--ds-border)" }}>
            <span>Montant net reçu</span>
            <span style={{ fontFamily: "var(--ds-font-mono)", color: "var(--ds-accent-300)" }}>{net.toLocaleString("fr-FR")} F</span>
          </div>
        </div>
      )}

      <div className="mt-auto">
        <Button variante="primary" bloc onClick={confirmer} disabled={montant < 1000}>
          Retirer {montant > 0 ? `${montant.toLocaleString("fr-FR")} F` : ""}
        </Button>
      </div>
    </div>
  );
}
