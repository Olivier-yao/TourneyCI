"use client";

import { useState } from "react";
import { Button } from "@/components/ds/Button";
import { genererBracket } from "@/lib/mockBracket";
import { tournoiParId } from "@/lib/mockTournaments";
import { notifierParticipants } from "@/lib/mockNotifications";

type Mode = "auto" | "manuel";

function melanger<T>(liste: T[]): T[] {
  const copie = [...liste];
  for (let i = copie.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copie[i], copie[j]] = [copie[j], copie[i]];
  }
  return copie;
}

export function GenerationBracket({
  tournoiId,
  inscrits,
  onGenere,
}: {
  tournoiId: string;
  inscrits: string[];
  onGenere: () => void;
}) {
  const [mode, setMode] = useState<Mode>("auto");
  const [texte, setTexte] = useState(inscrits.join("\n"));

  function generer() {
    const noms = texte.split("\n").map((l) => l.trim()).filter(Boolean);
    const ordre = mode === "auto" ? melanger(noms) : noms;
    genererBracket(tournoiId, ordre);
    const titre = tournoiParId(tournoiId)?.titre ?? "Ton tournoi";
    notifierParticipants(tournoiId, titre, "le bracket est disponible !");
    onGenere();
  }

  const noms = texte.split("\n").map((l) => l.trim()).filter(Boolean);

  return (
    <div className="flex flex-col gap-4 max-w-sm">
      <p className="text-sm" style={{ color: "var(--ds-text-muted)" }}>
        Le bracket n&apos;a pas encore été généré. En tant qu&apos;organisateur, choisis
        l&apos;ordre des participants puis génère l&apos;arbre.
      </p>

      <div
        className="flex p-[3px] gap-[3px] text-xs w-fit"
        style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-border)" }}
      >
        {(["auto", "manuel"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className="px-3 py-1.5 cursor-pointer transition-colors"
            style={{
              borderRadius: "var(--ds-radius-sm)",
              background: mode === m ? "var(--ds-accent-900)" : "transparent",
              color: mode === m ? "var(--ds-accent-300)" : "var(--ds-muted)",
            }}
          >
            {m === "auto" ? "Ordre automatique" : "Ordre manuel"}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          className="text-[11px] uppercase tracking-wide"
          style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}
        >
          {mode === "auto" ? "Participants (l'ordre sera tiré au sort)" : "Participants, dans l'ordre du bracket"}
        </label>
        <textarea
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
          rows={6}
          placeholder={"Kader B.\nAya K.\nSory D.\n..."}
          className="p-3 text-sm resize-none"
          style={{
            borderRadius: "var(--ds-radius-md)",
            background: "var(--ds-surface)",
            border: "1px solid var(--ds-border)",
            color: "var(--ds-text)",
            fontFamily: "var(--ds-font-body)",
          }}
        />
        <span className="text-xs" style={{ color: "var(--ds-muted)" }}>
          {noms.length} participant{noms.length > 1 ? "s" : ""} · un nom par ligne
        </span>
      </div>

      <Button variante="primary" onClick={generer} disabled={noms.length < 2}>
        Générer le bracket
      </Button>
    </div>
  );
}
