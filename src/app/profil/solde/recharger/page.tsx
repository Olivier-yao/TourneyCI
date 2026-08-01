"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Info, CheckCircle2 } from "lucide-react";
import { AppBar } from "@/components/ds/AppBar";
import { Button } from "@/components/ds/Button";
import { recharger } from "@/lib/mockWallet";

const MONTANTS = [5000, 10000, 25000, 50000];

const MOYENS = [
  { id: "orange", label: "Orange Money", indice: "07 ••" },
  { id: "mtn", label: "MTN MoMo", indice: "05 ••" },
  { id: "moov", label: "Moov Money", indice: "01 ••" },
  { id: "wave", label: "Wave", indice: "01 ••" },
] as const;

export default function RechargerPage() {
  const router = useRouter();
  const [montant, setMontant] = useState(10000);
  const [moyen, setMoyen] = useState<(typeof MOYENS)[number]["id"]>("orange");
  const [fait, setFait] = useState(false);

  function confirmer() {
    const libelleMoyen = MOYENS.find((m) => m.id === moyen)?.label ?? moyen;
    recharger(montant, libelleMoyen);
    setFait(true);
    setTimeout(() => router.push("/profil/solde"), 1400);
  }

  if (fait) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-6 text-center" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
        <CheckCircle2 size={36} style={{ color: "var(--ds-accent-300)" }} />
        <p className="text-base font-medium">Recharge effectuée</p>
        <p className="text-sm" style={{ color: "var(--ds-text-muted)" }}>
          {montant.toLocaleString("fr-FR")} F ajoutés à ta TourneyCard.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col px-5 py-4 gap-5" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
      <AppBar retour titre="Recharger" onRetour={() => router.push("/profil/solde")} />

      <div className="p-4" style={{ borderRadius: "var(--ds-radius-lg)", background: "var(--ds-surface)", border: "1px solid var(--ds-border)" }}>
        <div className="text-[11px] uppercase tracking-wide" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
          Montant
        </div>
        <div className="mt-1.5 text-3xl font-medium" style={{ fontFamily: "var(--ds-font-mono)" }}>
          {montant.toLocaleString("fr-FR")} F
        </div>
      </div>

      <div className="flex gap-2">
        {MONTANTS.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMontant(m)}
            className="flex-1 h-9 text-xs cursor-pointer"
            style={{
              borderRadius: "var(--ds-radius-pill)",
              fontFamily: "var(--ds-font-mono)",
              background: montant === m ? "var(--ds-accent-900)" : "transparent",
              color: montant === m ? "var(--ds-accent-300)" : "var(--ds-muted)",
              border: `1px solid ${montant === m ? "var(--ds-accent)" : "var(--ds-border)"}`,
            }}
          >
            {(m / 1000).toFixed(0)} 000
          </button>
        ))}
      </div>

      <div>
        <div className="text-[11px] uppercase tracking-wide mb-2.5" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
          Depuis
        </div>
        <div className="flex flex-col gap-2">
          {MOYENS.map((m) => {
            const actif = moyen === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setMoyen(m.id)}
                className="flex items-center gap-3 p-3.5 text-left cursor-pointer"
                style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: `1px solid ${actif ? "var(--ds-accent)" : "var(--ds-border)"}` }}
              >
                <span
                  className="flex items-center justify-center w-[18px] h-[18px] shrink-0"
                  style={{ borderRadius: "var(--ds-radius-pill)", border: `1px solid ${actif ? "var(--ds-accent)" : "var(--ds-border-strong)"}` }}
                >
                  {actif && <span className="w-2 h-2 rounded-full" style={{ background: "var(--ds-accent-300)" }} />}
                </span>
                <span className="flex-1 text-sm font-medium">{m.label}</span>
                <span className="text-xs" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                  {m.indice}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-start gap-2 text-xs" style={{ color: "var(--ds-muted)" }}>
        <Info size={15} strokeWidth={2} className="shrink-0 mt-0.5" style={{ color: "var(--ds-accent)" }} />
        <span>Recharge instantanée, sans frais. Le solde sert à payer les inscriptions dans toute l&apos;app.</span>
      </div>

      <div className="mt-auto">
        <Button variante="primary" bloc onClick={confirmer}>
          Recharger {montant.toLocaleString("fr-FR")} F
        </Button>
      </div>
    </div>
  );
}
