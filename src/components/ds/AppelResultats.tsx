"use client";

import { useState } from "react";
import { Gavel, Clock, CheckCircle2, XCircle } from "lucide-react";
import { creerAppel, type Appel } from "@/lib/mockAppel";

export function AppelResultats({
  tournoiId,
  tournoiTitre,
  auteur,
  appelExistant,
  onEnvoye,
}: {
  tournoiId: string;
  tournoiTitre: string;
  auteur: string;
  appelExistant?: Appel;
  onEnvoye: () => void;
}) {
  const [ouvert, setOuvert] = useState(false);
  const [motif, setMotif] = useState("");

  if (appelExistant) {
    const config =
      appelExistant.statut === "ouvert"
        ? { Icone: Clock, texte: "Appel en cours de traitement", couleur: "var(--ds-muted)" }
        : appelExistant.statut === "valide"
          ? { Icone: CheckCircle2, texte: "Appel validé", couleur: "var(--ds-accent-300)" }
          : { Icone: XCircle, texte: "Appel rejeté", couleur: "var(--ds-danger)" };
    return (
      <div className="flex items-center gap-2 text-xs" style={{ color: config.couleur }}>
        <config.Icone size={13} strokeWidth={2} />
        {config.texte}
      </div>
    );
  }

  if (!ouvert) {
    return (
      <button
        type="button"
        onClick={() => setOuvert(true)}
        className="flex items-center gap-1.5 text-xs font-medium cursor-pointer"
        style={{ color: "var(--ds-muted)" }}
      >
        <Gavel size={13} strokeWidth={2} />
        Contester les résultats
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-3" style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: "1px solid var(--ds-border)" }}>
      <div className="text-sm font-medium">Contester les résultats</div>
      <textarea
        value={motif}
        onChange={(e) => setMotif(e.target.value)}
        rows={3}
        placeholder="Explique le problème constaté dans le classement final..."
        className="px-3 py-2.5 text-sm outline-none resize-none"
        style={{ borderRadius: "var(--ds-radius-input)", background: "var(--ds-surface-2)", border: "1px solid var(--ds-border)", color: "var(--ds-text)" }}
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setOuvert(false)}
          className="flex-1 h-9 text-sm font-medium cursor-pointer"
          style={{ borderRadius: "var(--ds-radius-sm)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={() => {
            if (!motif.trim()) return;
            creerAppel(tournoiId, tournoiTitre, auteur, motif);
            setOuvert(false);
            onEnvoye();
          }}
          className="flex-[2] h-9 text-sm font-medium cursor-pointer"
          style={{ borderRadius: "var(--ds-radius-sm)", background: "var(--ds-accent-900)", color: "var(--ds-accent-300)" }}
        >
          Envoyer l&apos;appel
        </button>
      </div>
    </div>
  );
}
