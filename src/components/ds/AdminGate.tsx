"use client";

import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import type { ReactNode } from "react";

const CLE_DEVERROUILLE = "tourney-admin-deverrouille";

/**
 * Déterrent léger pour les écrans d'administration (pas un vrai contrôle
 * d'accès : ce code est visible dans le bundle JS envoyé au client). Il ne
 * fait qu'empêcher un testeur de tomber par hasard sur ces écrans en
 * devinant l'URL — à remplacer par une vraie authentification admin en
 * phase 8, avant tout usage avec de vrais enjeux.
 */
const CODE_ADMIN = "tourney-admin";

export function AdminGate({ children }: { children: ReactNode }) {
  const [pret, setPret] = useState(false);
  const [deverrouille, setDeverrouille] = useState(false);
  const [saisie, setSaisie] = useState("");
  const [erreur, setErreur] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDeverrouille(sessionStorage.getItem(CLE_DEVERROUILLE) === "1");
    setPret(true);
  }, []);

  function valider(e: React.FormEvent) {
    e.preventDefault();
    if (saisie.trim() === CODE_ADMIN) {
      sessionStorage.setItem(CLE_DEVERROUILLE, "1");
      setDeverrouille(true);
      setErreur(false);
    } else {
      setErreur(true);
    }
  }

  if (!pret) return null;

  if (!deverrouille) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
        <Lock size={24} style={{ color: "var(--ds-muted)" }} />
        <form onSubmit={valider} className="flex flex-col gap-2.5 w-full max-w-xs">
          <input
            type="password"
            value={saisie}
            onChange={(e) => setSaisie(e.target.value)}
            placeholder="Code d'accès admin"
            autoFocus
            className="h-11 px-3.5 text-sm outline-none text-center"
            style={{ borderRadius: "var(--ds-radius-input)", background: "var(--ds-surface-2)", border: "1px solid var(--ds-border)", color: "var(--ds-text)" }}
          />
          {erreur && <p className="text-xs text-center" style={{ color: "var(--ds-danger)" }}>Code incorrect.</p>}
          <button
            type="submit"
            className="h-11 text-sm font-medium cursor-pointer"
            style={{ borderRadius: "var(--ds-radius-btn)", background: "var(--ds-btn-primary-bg)", color: "var(--ds-btn-primary-text)" }}
          >
            Continuer
          </button>
        </form>
      </div>
    );
  }

  return <>{children}</>;
}
