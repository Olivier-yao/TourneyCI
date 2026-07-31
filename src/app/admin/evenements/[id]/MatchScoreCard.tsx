"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saisirScore } from "./actions";
import { classeBoutonPrimaire } from "@/lib/ui";

function LigneScore({
  nom,
  score,
  onIncrementer,
  onDecrementer,
}: {
  nom: string;
  score: number;
  onIncrementer: () => void;
  onDecrementer: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="font-semibold text-ink-900 truncate">{nom}</span>
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onDecrementer}
          className="h-11 w-11 rounded-lg layer-inset text-xl font-bold text-ink-900 active:shadow-pressed"
          aria-label={`Diminuer le score de ${nom}`}
        >
          −
        </button>
        <span className="w-8 text-center text-xl font-bold text-forest-900">
          {score}
        </span>
        <button
          type="button"
          onClick={onIncrementer}
          className="h-11 w-11 rounded-lg bg-forest-900 hover:bg-forest-700 active:shadow-pressed text-white text-xl font-bold transition-colors"
          aria-label={`Augmenter le score de ${nom}`}
        >
          +
        </button>
      </div>
    </div>
  );
}

export function MatchScoreCard({
  eventId,
  matchId,
  nom1,
  nom2,
}: {
  eventId: string;
  matchId: string;
  nom1: string;
  nom2: string;
}) {
  const router = useRouter();
  const [score1, setScore1] = useState(0);
  const [score2, setScore2] = useState(0);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, startTransition] = useTransition();

  function valider() {
    setErreur(null);
    startTransition(async () => {
      const resultat = await saisirScore(eventId, matchId, score1, score2);
      if (resultat.erreur) {
        setErreur(resultat.erreur);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="layer-raised rounded-xl px-4 py-4 space-y-3">
      <LigneScore
        nom={nom1}
        score={score1}
        onIncrementer={() => setScore1((s) => s + 1)}
        onDecrementer={() => setScore1((s) => Math.max(0, s - 1))}
      />
      <div className="h-px bg-cream-300" />
      <LigneScore
        nom={nom2}
        score={score2}
        onIncrementer={() => setScore2((s) => s + 1)}
        onDecrementer={() => setScore2((s) => Math.max(0, s - 1))}
      />
      {erreur && <p className="text-error-600 text-sm">{erreur}</p>}
      <button
        type="button"
        onClick={valider}
        disabled={enCours}
        className={classeBoutonPrimaire}
      >
        {enCours ? "Enregistrement..." : "Valider le score"}
      </button>
    </div>
  );
}
