"use client";

import { useState } from "react";
import Link from "next/link";
import { mettreAJourScoreMatch, type MatchTournoi } from "@/lib/mockBracket";
import { notifierParticipants } from "@/lib/mockNotifications";

function nomRound(round: number, totalRounds: number): string {
  if (round === totalRounds) return "Finale";
  if (round === totalRounds - 1) return "Demies";
  if (round === totalRounds - 2) return "Quarts";
  return `Round ${round}`;
}

function LigneMatch({
  tournoiId,
  tournoiTitre,
  match,
  onEnregistre,
}: {
  tournoiId: string;
  tournoiTitre: string;
  match: MatchTournoi;
  onEnregistre: () => void;
}) {
  const [s1, setS1] = useState(match.score1?.toString() ?? "");
  const [s2, setS2] = useState(match.score2?.toString() ?? "");
  const pretAJouer = Boolean(match.joueur1 && match.joueur2);

  function enregistrer() {
    const n1 = Number(s1);
    const n2 = Number(s2);
    if (!Number.isFinite(n1) || !Number.isFinite(n2) || n1 === n2) return;
    mettreAJourScoreMatch(tournoiId, match.id, n1, n2);
    notifierParticipants(tournoiId, tournoiTitre, `Score mis à jour : ${match.joueur1} ${n1} - ${n2} ${match.joueur2}`);
    onEnregistre();
  }

  return (
    <div
      className="flex items-center gap-2.5 p-3"
      style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: "1px solid var(--ds-border)" }}
    >
      <div className="flex-1 flex flex-col gap-1.5 min-w-0">
        <div className="flex items-center justify-between text-sm">
          <span className="truncate">{match.joueur1 ?? "À définir"}</span>
          <span
            className="text-[10px] px-1.5 py-0.5 shrink-0"
            style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}
          >
            {match.statut === "termine" ? "Terminé" : "En attente"}
          </span>
        </div>
        <div className="text-sm truncate">{match.joueur2 ?? "À définir"}</div>
      </div>

      {pretAJouer ? (
        <div className="flex items-center gap-1.5 shrink-0">
          <input
            value={s1}
            onChange={(e) => setS1(e.target.value.replace(/[^0-9]/g, ""))}
            inputMode="numeric"
            className="w-11 h-9 text-center text-sm"
            style={{ borderRadius: "var(--ds-radius-sm)", background: "var(--ds-bg)", border: "1px solid var(--ds-border)", color: "var(--ds-text)" }}
          />
          <input
            value={s2}
            onChange={(e) => setS2(e.target.value.replace(/[^0-9]/g, ""))}
            inputMode="numeric"
            className="w-11 h-9 text-center text-sm"
            style={{ borderRadius: "var(--ds-radius-sm)", background: "var(--ds-bg)", border: "1px solid var(--ds-border)", color: "var(--ds-text)" }}
          />
          <button
            type="button"
            onClick={enregistrer}
            disabled={s1 === "" || s2 === ""}
            className="h-9 px-3 text-xs font-medium cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ borderRadius: "var(--ds-radius-sm)", background: "var(--ds-accent-900)", color: "var(--ds-accent-300)" }}
          >
            Valider
          </button>
        </div>
      ) : (
        <span className="text-xs shrink-0" style={{ color: "var(--ds-muted)" }}>
          En attente des qualifiés
        </span>
      )}
    </div>
  );
}

export function GestionMatches({
  tournoiId,
  tournoiTitre,
  matches,
  onEnregistre,
}: {
  tournoiId: string;
  tournoiTitre: string;
  matches: MatchTournoi[];
  onEnregistre: () => void;
}) {
  if (matches.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm" style={{ color: "var(--ds-text-muted)" }}>
          Le bracket n&apos;a pas encore été généré.
        </p>
        <Link href={`/tournois/${tournoiId}/bracket`} className="text-sm font-medium" style={{ color: "var(--ds-accent-300)" }}>
          Générer le bracket →
        </Link>
      </div>
    );
  }

  const totalRounds = Math.max(...matches.map((m) => m.round));
  const rounds = Array.from({ length: totalRounds }, (_, i) => i + 1);

  return (
    <div className="flex flex-col gap-5">
      {rounds.map((round) => (
        <div key={round} className="flex flex-col gap-2">
          <div
            className="text-[11px] uppercase tracking-wide"
            style={{ color: "var(--ds-accent)", fontFamily: "var(--ds-font-mono)" }}
          >
            {nomRound(round, totalRounds)}
          </div>
          {matches
            .filter((m) => m.round === round)
            .map((m) => (
              <LigneMatch key={m.id} tournoiId={tournoiId} tournoiTitre={tournoiTitre} match={m} onEnregistre={onEnregistre} />
            ))}
        </div>
      ))}
    </div>
  );
}
