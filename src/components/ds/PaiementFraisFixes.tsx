"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, Loader2, CreditCard } from "lucide-react";
import { Field } from "./Input";
import { Button } from "./Button";
import { identifiantConnexion } from "@/lib/mockAuth";
import { formatXof } from "@/lib/formatXof";
import { lireSolde, debiter } from "@/lib/mockWallet";

const MOYENS_MOBILE_MONEY = [
  { id: "orange", label: "Orange Money", indice: "07 ••" },
  { id: "mtn", label: "MTN MoMo", indice: "05 ••" },
  { id: "moov", label: "Moov Money", indice: "01 ••" },
  { id: "wave", label: "Wave", indice: "01 ••" },
] as const;

type MoyenPaiement = (typeof MOYENS_MOBILE_MONEY)[number]["id"] | "tourneycard";

function numeroInitial(): string {
  const identifiant = identifiantConnexion();
  return identifiant && !identifiant.includes("@") ? identifiant : "";
}

/** Paiement bloquant d'un montant fixe (ex: frais de création de tournoi
 * payant, cf. point 34), avant de continuer un flux en cours — même logique
 * de moyen de paiement Mobile Money que src/app/paiement/[id]/FluxPaiement.tsx. */
export function PaiementFraisFixes({
  montantXof,
  libelle,
  onValide,
  onAnnuler,
}: {
  montantXof: number;
  libelle: string;
  onValide: () => void;
  onAnnuler: () => void;
}) {
  const [moyen, setMoyen] = useState<MoyenPaiement>("orange");
  const [telephone, setTelephone] = useState(numeroInitial);
  const [erreur, setErreur] = useState<string | null>(null);
  const [attente, setAttente] = useState(false);
  const [soldeCarte, setSoldeCarte] = useState(0);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSoldeCarte(lireSolde());
  }, []);

  function payer(e: React.FormEvent) {
    e.preventDefault();

    if (moyen === "tourneycard") {
      const ok = debiter(montantXof, libelle, "inscription");
      if (!ok) {
        setErreur("Solde TourneyCard insuffisant.");
        return;
      }
      setErreur(null);
      onValide();
      return;
    }

    if (telephone.replace(/\D/g, "").length < 8) {
      setErreur("Numéro invalide.");
      return;
    }
    setErreur(null);
    setAttente(true);
    setTimeout(() => {
      setAttente(false);
      if (telephone.includes("0000")) {
        setErreur("Le paiement a échoué. Vérifie ton solde ou réessaie avec un autre numéro.");
        return;
      }
      onValide();
    }, 1800);
  }

  if (attente) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <Loader2 size={28} className="animate-spin" style={{ color: "var(--ds-accent)" }} />
        <p className="text-sm font-medium">Validation en cours...</p>
        <p className="text-xs max-w-xs" style={{ color: "var(--ds-text-muted)" }}>
          Compose le code USSD reçu par SMS sur {telephone} pour confirmer le paiement.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={payer} className="flex flex-col gap-4">
      <div className="p-3.5" style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-accent-900)" }}>
        <div className="text-[11px] uppercase tracking-wide" style={{ color: "var(--ds-accent-300)", fontFamily: "var(--ds-font-mono)" }}>
          Montant à payer
        </div>
        <div className="mt-1 text-2xl font-semibold" style={{ fontFamily: "var(--ds-font-mono)" }}>
          {formatXof(montantXof)}
        </div>
        <div className="mt-1 text-xs" style={{ color: "var(--ds-muted)" }}>{libelle}</div>
      </div>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => setMoyen("tourneycard")}
          className="flex items-center gap-3 p-3 text-left cursor-pointer"
          style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: `1px solid ${moyen === "tourneycard" ? "var(--ds-accent)" : "var(--ds-border)"}` }}
        >
          <CreditCard size={17} strokeWidth={2} style={{ color: "var(--ds-accent-300)" }} />
          <span className="flex-1 text-sm font-medium">TourneyCard</span>
          <span className="text-xs" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>{soldeCarte.toLocaleString("fr-FR")} F</span>
        </button>
        {MOYENS_MOBILE_MONEY.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMoyen(m.id)}
            className="flex items-center gap-3 p-3 text-left cursor-pointer"
            style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: `1px solid ${moyen === m.id ? "var(--ds-accent)" : "var(--ds-border)"}` }}
          >
            <span
              className="flex items-center justify-center w-[18px] h-[18px] shrink-0"
              style={{ borderRadius: "var(--ds-radius-pill)", border: `1px solid ${moyen === m.id ? "var(--ds-accent)" : "var(--ds-border-strong)"}` }}
            >
              {moyen === m.id && <span className="w-2 h-2 rounded-full" style={{ background: "var(--ds-accent-300)" }} />}
            </span>
            <span className="flex-1 text-sm font-medium">{m.label}</span>
            <span className="text-xs" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>{m.indice}</span>
          </button>
        ))}
      </div>

      {moyen !== "tourneycard" && (
        <Field label="Numéro à débiter" placeholder="07 58 42 19 06" value={telephone} onChange={(e) => setTelephone(e.target.value)} />
      )}

      {erreur && <p className="text-xs" style={{ color: "var(--ds-danger)" }}>{erreur}</p>}

      <div className="flex items-start gap-2 text-xs" style={{ color: "var(--ds-muted)" }}>
        <ShieldCheck size={14} strokeWidth={2} className="shrink-0 mt-0.5" style={{ color: "var(--ds-accent)" }} />
        <span>Paiement requis avant la publication du tournoi.</span>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onAnnuler}
          className="flex-1 h-11 text-sm font-medium cursor-pointer"
          style={{ borderRadius: "var(--ds-radius-btn)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}
        >
          Annuler
        </button>
        <div className="flex-[2]">
          <Button variante="primary" bloc type="submit">
            Payer {formatXof(montantXof)}
          </Button>
        </div>
      </div>
    </form>
  );
}
