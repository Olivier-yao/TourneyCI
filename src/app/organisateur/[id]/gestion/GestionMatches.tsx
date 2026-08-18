"use client";

import { useState } from "react";
import Link from "next/link";
import { Minus, Plus } from "lucide-react";
import { mettreAJourScoreMatch, mettreAJourScoreEnDirect, demarrerMatch, type MatchTournoi } from "@/lib/mockBracket";
import { notifierParticipants } from "@/lib/mockNotifications";
import { Modal } from "@/components/ds/Modal";
import { PRESS } from "@/components/ds/Button";

function nomRound(round: number, totalRounds: number): string {
  if (round === totalRounds) return "Finale";
  if (round === totalRounds - 1) return "Demies";
  if (round === totalRounds - 2) return "Quarts";
  return `Round ${round}`;
}

/** Score par +1/-1 plutôt qu'un champ texte libre : au clavier mobile, corriger
 * un chiffre déjà saisi (ex: remplacer 2 par 3) est peu fiable — même logique
 * que les éliminations Battle Royale (GestionManchesBR). */
function ScoreStepper({
  valeur,
  accent,
  couleur,
  onMoins,
  onPlus,
}: {
  valeur: number;
  accent?: boolean;
  couleur?: string;
  onMoins: () => void;
  onPlus: () => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={onMoins}
        className={`flex items-center justify-center w-[34px] h-[34px] cursor-pointer ${PRESS}`}
        style={{ borderRadius: "var(--ds-radius-sm)", border: `1px solid ${accent ? "var(--ds-accent)" : "var(--ds-border)"}`, color: "var(--ds-muted)" }}
      >
        <Minus size={13} strokeWidth={2.5} />
      </button>
      <span className="w-6 text-center text-base" style={{ fontFamily: "var(--ds-font-mono)", color: couleur ?? "var(--ds-text)" }}>
        {valeur}
      </span>
      <button
        type="button"
        onClick={onPlus}
        className={`flex items-center justify-center w-[34px] h-[34px] cursor-pointer ${PRESS}`}
        style={{ borderRadius: "var(--ds-radius-sm)", border: `1px solid ${accent ? "var(--ds-accent)" : "var(--ds-border)"}`, color: "var(--ds-muted)" }}
      >
        <Plus size={13} strokeWidth={2.5} />
      </button>
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
  const [saisies, setSaisies] = useState<Record<string, { s1: number; s2: number }>>({});
  const [confirmationCloture, setConfirmationCloture] = useState<MatchTournoi | null>(null);

  if (matches.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm" style={{ color: "var(--ds-text-muted)" }}>
          Le bracket n&apos;a pas encore été généré.
        </p>
        <Link href={`/tournois/${tournoiId}/bracket`} className="text-sm font-medium" style={{ color: "var(--ds-accent-300)" }}>
          Voir l&apos;arbre →
        </Link>
      </div>
    );
  }

  function valeurInitiale(match: MatchTournoi): { s1: number; s2: number } {
    return { s1: match.score1 ?? 0, s2: match.score2 ?? 0 };
  }

  function saisie(match: MatchTournoi): { s1: number; s2: number } {
    return saisies[match.id] ?? valeurInitiale(match);
  }

  function ajuster(match: MatchTournoi, cote: "s1" | "s2", delta: number) {
    setSaisies((v) => {
      const actuel = v[match.id] ?? valeurInitiale(match);
      return { ...v, [match.id]: { ...actuel, [cote]: Math.max(0, actuel[cote] + delta) } };
    });
  }

  function demarrer(match: MatchTournoi) {
    demarrerMatch(tournoiId, match.id);
    notifierParticipants(tournoiId, tournoiTitre, `Le match ${match.joueur1} vs ${match.joueur2} commence !`);
    onEnregistre();
  }

  function validerScoreEnDirect(match: MatchTournoi) {
    const { s1, s2 } = saisie(match);
    mettreAJourScoreEnDirect(tournoiId, match.id, s1, s2);
    onEnregistre();
  }

  function cloturer(match: MatchTournoi) {
    const { s1, s2 } = saisie(match);
    if (s1 === s2) return;
    mettreAJourScoreMatch(tournoiId, match.id, s1, s2);
    notifierParticipants(tournoiId, tournoiTitre, `Score final : ${match.joueur1} ${s1} - ${s2} ${match.joueur2}`);
    onEnregistre();
  }

  function confirmerCloture() {
    if (!confirmationCloture) return;
    cloturer(confirmationCloture);
    setConfirmationCloture(null);
  }

  function modifierTermine(match: MatchTournoi) {
    const { s1, s2 } = saisie(match);
    if (s1 === s2) return;
    mettreAJourScoreMatch(tournoiId, match.id, s1, s2);
    onEnregistre();
  }

  const totalRounds = Math.max(...matches.map((m) => m.round));
  const rounds = Array.from({ length: totalRounds }, (_, i) => i + 1);
  const matchEnCoursId = matches.find((m) => m.statut === "en_cours")?.id;

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
                  const enCours = m.statut === "en_cours";
                  const pretAJouer = Boolean(m.joueur1 && m.joueur2);
                  const peutDemarrer = m.statut === "a_venir" && pretAJouer && !matchEnCoursId;
                  const { s1: s1Val, s2: s2Val } = saisie(m);
                  const gagnant1 = termine && (m.score1 ?? 0) > (m.score2 ?? 0);
                  const gagnant2 = termine && (m.score2 ?? 0) > (m.score1 ?? 0);
                  return (
                    <div
                      key={m.id}
                      className="p-3"
                      style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", boxShadow: enCours ? "0 0 0 1px var(--ds-accent)" : "var(--ds-shadow-sm, none)" }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-[9px]" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>{m.id}</div>
                        <div className="flex items-center gap-1 text-[9px]" style={{ color: enCours ? "var(--ds-accent-300)" : "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                          {enCours && <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--ds-accent-400)" }} />}
                          {termine ? "Terminé" : enCours ? "En direct" : "En attente"}
                        </div>
                      </div>
                      <div className="mt-2 flex items-center gap-2.5">
                        <div className="flex-1 min-w-0 flex flex-col gap-1">
                          <div className="text-sm truncate" style={{ color: gagnant2 ? "var(--ds-muted)" : "var(--ds-text)" }}>{m.joueur1 ?? "À définir"}</div>
                          <div className="text-sm truncate" style={{ color: gagnant1 ? "var(--ds-muted)" : "var(--ds-text)" }}>{m.joueur2 ?? "À définir"}</div>
                        </div>

                        {termine ? (
                          <>
                            <div className="flex flex-col gap-1 shrink-0">
                              <ScoreStepper
                                valeur={s1Val}
                                couleur={gagnant1 ? "var(--ds-accent-300)" : undefined}
                                onMoins={() => ajuster(m, "s1", -1)}
                                onPlus={() => ajuster(m, "s1", 1)}
                              />
                              <ScoreStepper
                                valeur={s2Val}
                                couleur={gagnant2 ? "var(--ds-accent-300)" : undefined}
                                onMoins={() => ajuster(m, "s2", -1)}
                                onPlus={() => ajuster(m, "s2", 1)}
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => modifierTermine(m)}
                              className={`w-[72px] h-[72px] text-xs font-medium shrink-0 ${PRESS}`}
                              style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}
                            >
                              Modifier
                            </button>
                          </>
                        ) : enCours ? (
                          <>
                            <div className="flex flex-col gap-2 shrink-0">
                              <ScoreStepper accent valeur={s1Val} onMoins={() => ajuster(m, "s1", -1)} onPlus={() => ajuster(m, "s1", 1)} />
                              <ScoreStepper accent valeur={s2Val} onMoins={() => ajuster(m, "s2", -1)} onPlus={() => ajuster(m, "s2", 1)} />
                            </div>
                            <div className="flex flex-col gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => validerScoreEnDirect(m)}
                                className={`w-[72px] h-[32px] text-[11px] font-medium ${PRESS}`}
                                style={{ borderRadius: "var(--ds-radius-sm)", border: "1px solid var(--ds-accent)", color: "var(--ds-accent-300)" }}
                                title="Met à jour le score affiché aux spectateurs, sans clôturer le match"
                              >
                                Valider
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmationCloture(m)}
                                disabled={s1Val === s2Val}
                                className={`w-[72px] h-[32px] text-[11px] font-medium disabled:opacity-40 disabled:cursor-not-allowed ${PRESS}`}
                                style={{ borderRadius: "var(--ds-radius-sm)", background: "var(--ds-btn-primary-bg)", color: "var(--ds-btn-primary-text)" }}
                                title="Termine le match et qualifie le vainqueur pour le tour suivant"
                              >
                                Clôturer
                              </button>
                            </div>
                          </>
                        ) : peutDemarrer ? (
                          <button
                            type="button"
                            onClick={() => demarrer(m)}
                            className={`px-3 h-[38px] text-xs font-medium shrink-0 ${PRESS}`}
                            style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-accent)", color: "var(--ds-accent-300)" }}
                          >
                            Démarrer ce match
                          </button>
                        ) : pretAJouer ? (
                          <span className="text-xs shrink-0" style={{ color: "var(--ds-muted)" }}>
                            En attente
                          </span>
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

      <p className="text-xs text-center" style={{ color: "var(--ds-muted)" }}>
        Choisis quel match démarrer ensuite — l&apos;ordre n&apos;est pas imposé, un seul match en direct à la fois.
      </p>

      <Modal ouvert={confirmationCloture !== null} titre="Clôturer ce match ?" onFermer={() => setConfirmationCloture(null)}>
        {confirmationCloture && (
          <p className="text-sm not-italic" style={{ whiteSpace: "normal", color: "var(--ds-text-muted)" }}>
            Score final : <b style={{ color: "var(--ds-text)" }}>{confirmationCloture.joueur1} {saisie(confirmationCloture).s1} - {saisie(confirmationCloture).s2} {confirmationCloture.joueur2}</b>. Le vainqueur sera qualifié pour le tour suivant et les participants seront notifiés — vérifie le score avant de continuer.
          </p>
        )}
        <div className="flex gap-2 pt-3">
          <button
            type="button"
            onClick={() => setConfirmationCloture(null)}
            className={`flex-1 h-10 text-sm font-medium ${PRESS}`}
            style={{ borderRadius: "var(--ds-radius-sm)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={confirmerCloture}
            className={`flex-1 h-10 text-sm font-medium ${PRESS}`}
            style={{ borderRadius: "var(--ds-radius-sm)", background: "var(--ds-btn-primary-bg)", color: "var(--ds-btn-primary-text)" }}
          >
            Confirmer
          </button>
        </div>
      </Modal>
    </div>
  );
}
