"use client";

import { useState } from "react";
import { Heart, HeartCrack } from "lucide-react";
import { laisserAvis } from "@/lib/mockAvis";

export function AvisCoeur({
  tournoiId,
  onEnvoye,
}: {
  tournoiId: string;
  onEnvoye: () => void;
}) {
  const [choix, setChoix] = useState<"coeur" | "coeur_brise" | null>(null);
  const [message, setMessage] = useState("");
  const [envoye, setEnvoye] = useState(false);

  async function envoyer() {
    if (!choix) return;
    await laisserAvis(tournoiId, choix, choix === "coeur_brise" ? message : undefined);
    setEnvoye(true);
    onEnvoye();
  }

  if (envoye) {
    return (
      <div
        className="p-3.5 text-sm"
        style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: "1px solid var(--ds-border)", color: "var(--ds-text-muted)" }}
      >
        Merci pour ton retour.
      </div>
    );
  }

  return (
    <div
      className="flex flex-col gap-3 p-3.5"
      style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: "1px solid var(--ds-border)" }}
    >
      <div className="text-sm font-medium">Comment s&apos;est passé ce tournoi ?</div>
      <div className="flex gap-2.5">
        <button
          type="button"
          onClick={() => setChoix("coeur")}
          className="flex-1 flex flex-col items-center gap-1.5 py-3 cursor-pointer"
          style={{
            borderRadius: "var(--ds-radius-md)",
            border: `1px solid ${choix === "coeur" ? "var(--ds-accent)" : "var(--ds-border)"}`,
            background: choix === "coeur" ? "var(--ds-accent-900)" : "transparent",
          }}
        >
          <Heart size={20} strokeWidth={2} fill={choix === "coeur" ? "currentColor" : "none"} style={{ color: "var(--ds-accent-300)" }} />
          <span className="text-xs" style={{ color: choix === "coeur" ? "var(--ds-accent-300)" : "var(--ds-muted)" }}>Équitable</span>
        </button>
        <button
          type="button"
          onClick={() => setChoix("coeur_brise")}
          className="flex-1 flex flex-col items-center gap-1.5 py-3 cursor-pointer"
          style={{
            borderRadius: "var(--ds-radius-md)",
            border: `1px solid ${choix === "coeur_brise" ? "var(--ds-danger)" : "var(--ds-border)"}`,
            background: choix === "coeur_brise" ? "color-mix(in srgb, var(--ds-danger) 10%, transparent)" : "transparent",
          }}
        >
          <HeartCrack size={20} strokeWidth={2} style={{ color: "var(--ds-danger)" }} />
          <span className="text-xs" style={{ color: choix === "coeur_brise" ? "var(--ds-danger)" : "var(--ds-muted)" }}>Problème</span>
        </button>
      </div>

      {choix === "coeur_brise" && (
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          placeholder="Explique ce qui s'est mal passé, à destination de l'administration..."
          className="px-3 py-2.5 text-sm outline-none resize-none"
          style={{
            borderRadius: "var(--ds-radius-input)",
            background: "var(--ds-surface-2)",
            border: "1px solid var(--ds-border)",
            color: "var(--ds-text)",
          }}
        />
      )}

      {choix && (
        <button
          type="button"
          onClick={envoyer}
          className="h-10 text-sm font-medium cursor-pointer"
          style={{ borderRadius: "var(--ds-radius-btn)", background: "var(--ds-btn-primary-bg)", color: "var(--ds-btn-primary-text)" }}
        >
          Envoyer
        </button>
      )}
    </div>
  );
}
