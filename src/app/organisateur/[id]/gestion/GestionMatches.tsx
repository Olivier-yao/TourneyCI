"use client";

import { useState } from "react";
import Link from "next/link";
import { mettreAJourScoreMatch, type MatchTournoi } from "@/lib/mockBracket";
import { notifierParticipants } from "@/lib/mockNotifications";
import { PRESS } from "@/components/ds/Button";

function nomRound(round: number, totalRounds: number): string {
  if (round === totalRounds) return "Finale";
  if (round === totalRounds - 1) return "Demies";
  if (round === totalRounds - 2) return "Quarts";
  return `Round ${round}`;
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
  const [saisies, setSaisies] = useState<Record<string, { s1: string; s2: string }>>({});

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

  function saisie(matchId: string): { s1: string; s2: string } {
    return saisies[matchId] ?? { s1: "", s2: "" };
  }

  function setSaisie(matchId: string, patch: Partial<{ s1: string; s2: string }>) {
    setSaisies((v) => ({ ...v, [matchId]: { ...saisie(matchId), ...patch } }));
  }

  function enregistrer(match: MatchTournoi) {
    const { s1, s2 } = saisie(match.id);
    const n1 = Number(s1);
    const n2 = Number(s2);
    if (!Number.isFinite(n1) || !Number.isFinite(n2) || n1 === n2) return;
    mettreAJourScoreMatch(tournoiId, match.id, n1, n2);
    notifierParticipants(tournoiId, tournoiTitre, `Score mis à jour : ${match.joueur1} ${n1} - ${n2} ${match.joueur2}`);
    onEnregistre();
  }

  const totalRounds = Math.max(...matches.map((m) => m.round));
  const rounds = Array.from({ length: totalRounds }, (_, i) => i + 1);

  const pretsAEnregistrer = matches.filter((m) => {
    const { s1, s2 } = saisie(m.id);
    const n1 = Number(s1);
    const n2 = Number(s2);
    return s1 !== "" && s2 !== "" && Number.isFinite(n1) && Number.isFinite(n2) && n1 !== n2;
  });

  function enregistrerTout() {
    pretsAEnregistrer.forEach(enregistrer);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-5">
        {rounds.map((round) => {
          const matchsRound = matches.filter((m) => m.round === round);
          return (
            <div key={round} className="flex flex-col gap-2">
              <div className="flex items-center gap-2.5">
                <div className="text-[10px] tracking-wide uppercase shrink-0" style={{ color: "var(--ds-accent-300)", fontFamily: "var(--ds-font-mono)" }}>
                  {nomRound(round, totalRounds).toUpperCase()}
                </div>
                <div className="flex-1 h-px" style={{ background: "var(--ds-divider, var(--ds-border))" }} />
                <div className="text-[9px] shrink-0" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                  {matchsRound.length} MATCH{matchsRound.length > 1 ? "S" : ""}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {matchsRound.map((m) => {
                  const termine = m.statut === "termine";
                  const pretAJouer = Boolean(m.joueur1 && m.joueur2);
                  const { s1, s2 } = saisie(m.id);
                  const s1Val = s1 || (termine ? String(m.score1 ?? "") : "");
                  const s2Val = s2 || (termine ? String(m.score2 ?? "") : "");
                  const gagnant1 = termine && (m.score1 ?? 0) > (m.score2 ?? 0);
                  const gagnant2 = termine && (m.score2 ?? 0) > (m.score1 ?? 0);
                  return (
                    <div
                      key={m.id}
                      className="p-3"
                      style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", boxShadow: termine ? "var(--ds-shadow-sm, none)" : "0 0 0 1px var(--ds-accent)" }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-[9px]" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>{m.id}</div>
                        <div className="text-[9px]" style={{ color: termine ? "var(--ds-muted)" : "var(--ds-accent-300)", fontFamily: "var(--ds-font-mono)" }}>
                          {termine ? "Terminé" : "En attente"}
                        </div>
                      </div>
                      <div className="mt-2 flex items-center gap-2.5">
                        <div className="flex-1 min-w-0 flex flex-col gap-1">
                          <div className="text-sm truncate" style={{ color: gagnant2 ? "var(--ds-muted)" : "var(--ds-text)" }}>{m.joueur1 ?? "À définir"}</div>
                          <div className="text-sm truncate" style={{ color: gagnant1 ? "var(--ds-muted)" : "var(--ds-text)" }}>{m.joueur2 ?? "À définir"}</div>
                        </div>
                        {pretAJouer ? (
                          <>
                            <div className="flex flex-col gap-1 shrink-0">
                              <input
                                value={s1Val}
                                onChange={(e) => setSaisie(m.id, { s1: e.target.value.replace(/[^0-9]/g, "") })}
                                inputMode="numeric"
                                className="w-9 h-[26px] text-center text-sm"
                                style={{ borderRadius: "var(--ds-radius-sm)", background: "var(--ds-bg)", border: `1px solid ${termine ? "var(--ds-border)" : "var(--ds-accent)"}`, color: gagnant1 ? "var(--ds-accent-300)" : "var(--ds-text)" }}
                              />
                              <input
                                value={s2Val}
                                onChange={(e) => setSaisie(m.id, { s2: e.target.value.replace(/[^0-9]/g, "") })}
                                inputMode="numeric"
                                className="w-9 h-[26px] text-center text-sm"
                                style={{ borderRadius: "var(--ds-radius-sm)", background: "var(--ds-bg)", border: `1px solid ${termine ? "var(--ds-border)" : "var(--ds-accent)"}`, color: gagnant2 ? "var(--ds-accent-300)" : "var(--ds-text)" }}
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => enregistrer(m)}
                              disabled={s1Val === "" || s2Val === ""}
                              className={`w-[62px] h-[54px] text-xs font-medium shrink-0 disabled:opacity-40 disabled:cursor-not-allowed ${PRESS}`}
                              style={{ borderRadius: "var(--ds-radius-md)", border: `1px solid ${termine ? "var(--ds-border)" : "var(--ds-accent)"}`, color: termine ? "var(--ds-muted)" : "var(--ds-accent-300)" }}
                            >
                              {termine ? "Modifier" : "Valider"}
                            </button>
                          </>
                        ) : (
                          <span className="text-xs shrink-0" style={{ color: "var(--ds-muted)" }}>
                            En attente des qualifiés
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={enregistrerTout}
        disabled={pretsAEnregistrer.length === 0}
        className={`mt-2 h-11 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed ${PRESS}`}
        style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-accent)", color: "var(--ds-accent-300)" }}
      >
        Enregistrer les scores du round
      </button>
    </div>
  );
}
