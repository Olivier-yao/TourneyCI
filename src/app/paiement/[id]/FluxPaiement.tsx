"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck, Loader2, CheckCircle2, XCircle, CreditCard } from "lucide-react";
import { AppBar } from "@/components/ds/AppBar";
import { Field } from "@/components/ds/Input";
import { Button } from "@/components/ds/Button";
import { identifiantConnexion } from "@/lib/mockAuth";
import { formatXof } from "@/lib/formatXof";
import { incrementerInscrits } from "@/lib/mockTournaments";
import { enregistrerInscription } from "@/lib/mockInscriptions";
import { lireSolde, debiter } from "@/lib/mockWallet";
import type { Tournoi } from "@/lib/mockTournaments";

type Etape = "moyen" | "attente" | "succes" | "echec";

const MOYENS_MOBILE_MONEY = [
  { id: "orange", label: "Orange Money", indice: "07 ••" },
  { id: "mtn", label: "MTN MoMo", indice: "05 ••" },
  { id: "moov", label: "Moov Money", indice: "01 ••" },
  { id: "wave", label: "Wave", indice: "01 ••" },
] as const;

type MoyenPaiement = (typeof MOYENS_MOBILE_MONEY)[number]["id"] | "tourneycard";

function numeroInitial(): string {
  const identifiant = identifiantConnexion();
  if (identifiant && !identifiant.includes("@")) return identifiant;
  return "";
}

export function FluxPaiement({
  tournoi,
  equipe,
}: {
  tournoi: Tournoi;
  equipe?: string;
}) {
  const router = useRouter();
  const [etape, setEtape] = useState<Etape>("moyen");
  const [moyen, setMoyen] = useState<MoyenPaiement>("orange");
  const [telephone, setTelephone] = useState(numeroInitial);
  const [erreur, setErreur] = useState<string | null>(null);
  const [soldeCarte, setSoldeCarte] = useState(0);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSoldeCarte(lireSolde());
  }, []);

  function payer(e: React.FormEvent) {
    e.preventDefault();

    if (moyen === "tourneycard") {
      const ok = tournoi.fraisXof === 0 || debiter(tournoi.fraisXof, `Inscription · ${tournoi.titre}`, "inscription");
      if (!ok) {
        setErreur("Solde TourneyCard insuffisant. Recharge ta carte pour continuer.");
        return;
      }
      setErreur(null);
      enregistrerInscription(tournoi.id, equipe);
      incrementerInscrits(tournoi.id);
      setEtape("succes");
      return;
    }

    if (telephone.replace(/\D/g, "").length < 8) {
      setErreur("Numéro invalide.");
      return;
    }
    setErreur(null);
    setEtape("attente");
    // Simulation : le vrai flux attendrait la confirmation USSD de l'agrégateur.
    setTimeout(() => {
      const reussi = !telephone.includes("0000");
      if (reussi) {
        enregistrerInscription(tournoi.id, equipe);
        incrementerInscrits(tournoi.id);
      }
      setEtape(reussi ? "succes" : "echec");
    }, 2200);
  }

  if (etape === "attente") {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center"
        style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}
      >
        <Loader2 size={32} className="animate-spin" style={{ color: "var(--ds-accent)" }} />
        <p className="text-base font-medium">Validation en cours...</p>
        <p className="text-sm max-w-xs" style={{ color: "var(--ds-text-muted)" }}>
          Compose le code USSD reçu par SMS sur {telephone} pour confirmer le paiement.
        </p>
      </div>
    );
  }

  if (etape === "succes" || etape === "echec") {
    const reussi = etape === "succes";
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center"
        style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}
      >
        {reussi ? (
          <CheckCircle2 size={40} style={{ color: "var(--ds-accent-300)" }} />
        ) : (
          <XCircle size={40} style={{ color: "var(--ds-danger)" }} />
        )}
        <p className="text-lg font-medium">
          {reussi ? "Paiement confirmé" : "Le paiement a échoué"}
        </p>
        <p className="text-sm max-w-xs" style={{ color: "var(--ds-text-muted)" }}>
          {reussi
            ? `Ton inscription à ${tournoi.titre} est validée. À bientôt sur le terrain !`
            : "Vérifie ton solde Mobile Money ou réessaie avec un autre numéro."}
        </p>
        {reussi ? (
          <Link href="/accueil">
            <Button variante="primary">Retour à l&apos;accueil</Button>
          </Link>
        ) : (
          <Button variante="primary" onClick={() => setEtape("moyen")}>
            Réessayer
          </Button>
        )}
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col px-6 py-4"
      style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}
    >
      <AppBar
        retour
        titre="Paiement de l'inscription"
        onRetour={() => router.push(`/tournois/${tournoi.id}`)}
      />

      <form onSubmit={payer} className="flex flex-col gap-5 mt-4 max-w-sm">
        <div
          className="p-4"
          style={{
            borderRadius: "var(--ds-radius-lg)",
            background: "var(--ds-accent-900)",
          }}
        >
          <div
            className="text-[11px] uppercase tracking-wide"
            style={{ color: "var(--ds-accent-300)", fontFamily: "var(--ds-font-mono)" }}
          >
            Montant à payer
          </div>
          <div className="mt-1.5 text-3xl font-semibold" style={{ fontFamily: "var(--ds-font-mono)" }}>
            {formatXof(tournoi.fraisXof)}
          </div>
          <div className="mt-1 text-[13px]" style={{ color: "var(--ds-muted)" }}>
            {tournoi.titre} · frais inclus
          </div>
          {equipe && (
            <div className="mt-1 text-[13px]" style={{ color: "var(--ds-accent-300)" }}>
              Équipe : {equipe}
            </div>
          )}
        </div>

        <div>
          <div
            className="text-[11px] uppercase tracking-wide mb-2.5"
            style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}
          >
            Moyen de paiement
          </div>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setMoyen("tourneycard")}
              className="flex items-center gap-3 p-3.5 text-left cursor-pointer"
              style={{
                borderRadius: "var(--ds-radius-md)",
                background: "var(--ds-surface)",
                border: `1px solid ${moyen === "tourneycard" ? "var(--ds-accent)" : "var(--ds-border)"}`,
              }}
            >
              <CreditCard size={18} strokeWidth={2} style={{ color: "var(--ds-accent-300)" }} />
              <span className="flex-1 text-sm font-medium">TourneyCard</span>
              <span className="text-xs" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                {soldeCarte.toLocaleString("fr-FR")} F
              </span>
            </button>
            {MOYENS_MOBILE_MONEY.map((m) => {
              const actif = moyen === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMoyen(m.id)}
                  className="flex items-center gap-3 p-3.5 text-left cursor-pointer"
                  style={{
                    borderRadius: "var(--ds-radius-md)",
                    background: "var(--ds-surface)",
                    border: `1px solid ${actif ? "var(--ds-accent)" : "var(--ds-border)"}`,
                  }}
                >
                  <span
                    className="flex items-center justify-center w-[18px] h-[18px] shrink-0"
                    style={{
                      borderRadius: "var(--ds-radius-pill)",
                      border: `1px solid ${actif ? "var(--ds-accent)" : "var(--ds-border-strong)"}`,
                    }}
                  >
                    {actif && (
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ background: "var(--ds-accent-300)" }}
                      />
                    )}
                  </span>
                  <span className="flex-1 text-sm font-medium">{m.label}</span>
                  <span
                    className="text-xs"
                    style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}
                  >
                    {m.indice}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {moyen === "tourneycard" ? (
          erreur && <p className="text-xs" style={{ color: "var(--ds-danger)" }}>{erreur}</p>
        ) : (
          <Field
            label="Numéro à débiter"
            placeholder="07 58 42 19 06"
            value={telephone}
            onChange={(e) => setTelephone(e.target.value)}
            erreur={erreur ?? undefined}
          />
        )}

        <div
          className="flex items-start gap-2 text-xs"
          style={{ color: "var(--ds-muted)" }}
        >
          <ShieldCheck size={15} strokeWidth={2} className="shrink-0 mt-0.5" style={{ color: "var(--ds-accent)" }} />
          <span>
            {moyen === "tourneycard"
              ? "Paiement instantané depuis ton solde. Remboursement si le tournoi est annulé."
              : "Tu recevras un code USSD pour valider. Remboursement si le tournoi est annulé."}
          </span>
        </div>

        <Button variante="primary" bloc type="submit">
          Payer {formatXof(tournoi.fraisXof)}
        </Button>
      </form>
    </div>
  );
}
