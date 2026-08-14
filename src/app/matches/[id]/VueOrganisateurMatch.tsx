"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Minus,
  Plus,
  Scale,
  CheckCircle2,
  XCircle,
  ListChecks,
  Swords,
  Trophy,
  Crosshair,
  ArrowDown,
  Goal,
  Hand,
  X,
} from "lucide-react";
import { mettreAJourScoreMatch, ajouterEvenementMatch, matchsDuTournoi, libelleRound, type MatchTournoi } from "@/lib/mockBracket";
import { notifierParticipants } from "@/lib/mockNotifications";
import { litigeDuMatch, resoudreLitige, type Litige } from "@/lib/mockLitige";
import { tournoiParId, genreDuJeu } from "@/lib/mockTournaments";
import { mappeGenre, evenementsPredefinis, type CategorieEvenement } from "@/lib/mockEvenementsJeu";
import { PRESS } from "@/components/ds/Button";

function initiales(nom: string): string {
  return nom
    .split(/[\s.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((mot) => mot[0])
    .join("")
    .toUpperCase();
}

const ICONES_EVENEMENT = { ko: Swords, manche: Trophy, elimine: Crosshair, terre: ArrowDown, but: Goal, arret: Hand };

const LABEL_STATUT_LITIGE: Record<Litige["statut"], string> = {
  en_attente: "EN ATTENTE",
  resolu_faveur: "TRANCHÉ · ACCEPTÉ",
  rejete: "TRANCHÉ · REJETÉ",
};

/** Vue organisateur : interface de gestion du match, sans mise en scène —
 * édition du score, résolution des litiges, alimentation du fil d'événements,
 * avancement du bracket. Aucun point commun visuel avec les vues spectateur
 * ou participant : c'est un outil de travail, pas un écran de suivi.
 * Fidèle au design "Tourney v5 Écrans" (écran H3). */
export function VueOrganisateurMatch({
  match: matchInitial,
  tournoiId,
  tournoiTitre,
  onMaj,
}: {
  match: MatchTournoi;
  tournoiId: string;
  tournoiTitre: string;
  onMaj: () => void;
}) {
  const router = useRouter();
  const [s1, setS1] = useState(matchInitial.score1 ?? 0);
  const [s2, setS2] = useState(matchInitial.score2 ?? 0);
  const [litige, setLitige] = useState<Litige | undefined>(undefined);
  const [enregistre, setEnregistre] = useState(false);
  const [categorie, setCategorie] = useState<CategorieEvenement>("combat");
  const [acteur, setActeur] = useState<"joueur1" | "joueur2">("joueur1");
  const [roundLabel, setRoundLabel] = useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLitige(litigeDuMatch(matchInitial.id));
    const tournoi = tournoiParId(tournoiId);
    setCategorie(mappeGenre(tournoi ? genreDuJeu(tournoi.jeuId) : undefined));
    const matchs = matchsDuTournoi(tournoiId);
    const totalRounds = matchs.length > 0 ? Math.max(...matchs.map((m) => m.round)) : matchInitial.round;
    setRoundLabel(libelleRound(matchInitial.round, totalRounds));
  }, [matchInitial.id, matchInitial.round, tournoiId]);

  const pretAJouer = Boolean(matchInitial.joueur1 && matchInitial.joueur2);
  const modifie = s1 !== (matchInitial.score1 ?? 0) || s2 !== (matchInitial.score2 ?? 0);
  const j1EnTete = s1 > s2;
  const j2EnTete = s2 > s1;
  const nomActeur = acteur === "joueur1" ? matchInitial.joueur1 : matchInitial.joueur2;
  const nomCible = acteur === "joueur1" ? matchInitial.joueur2 : matchInitial.joueur1;
  const presets = nomActeur && nomCible ? evenementsPredefinis(categorie, nomActeur, nomCible) : [];
  const derniersEvenements = (matchInitial.evenements ?? []).slice(0, 2);

  function valider() {
    if (s1 === s2) return;
    mettreAJourScoreMatch(tournoiId, matchInitial.id, s1, s2);
    notifierParticipants(tournoiId, tournoiTitre, `Score validé : ${matchInitial.joueur1} ${s1} - ${s2} ${matchInitial.joueur2}`);
    setEnregistre(true);
    onMaj();
  }

  function trancherLitige(statut: "resolu_faveur" | "rejete") {
    if (!litige) return;
    resoudreLitige(litige.id, statut);
    setLitige({ ...litige, statut });
  }

  function ajouterEvenement(texte: string) {
    ajouterEvenementMatch(tournoiId, matchInitial.id, texte);
    onMaj();
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
      <div className="px-5 pt-[42px] pb-3 flex items-center gap-2.5" style={{ borderBottom: "1px solid var(--ds-border)" }}>
        <button
          type="button"
          onClick={() => router.push(`/organisateur/${tournoiId}/gestion`)}
          className={`flex items-center justify-center w-[30px] h-[30px] shrink-0 ${PRESS}`}
          style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}
        >
          <ArrowLeft size={14} strokeWidth={2} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-medium truncate">Gérer le match</div>
          <div className="text-[9px] uppercase tracking-wide truncate" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
            {tournoiTitre} · {roundLabel}
          </div>
        </div>
        <div className="px-2.5 py-1 shrink-0 text-[9px]" style={{ borderRadius: "var(--ds-radius-sm)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
          ORGA
        </div>
      </div>

      <div className="px-5 pt-3 flex-1 flex flex-col gap-2.5 min-h-0 overflow-hidden">
        <div className="p-[11px] flex flex-col gap-2.5" style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", boxShadow: "var(--ds-shadow-sm, 0 1px 2px rgba(0,0,0,.3))" }}>
          <div className="flex items-center gap-2">
            <ListChecks size={13} strokeWidth={2} style={{ color: "var(--ds-muted)" }} />
            <span className="text-[10px] uppercase tracking-wide" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>Validation du score</span>
          </div>
          {!pretAJouer ? (
            <p className="text-sm" style={{ color: "var(--ds-text-muted)" }}>En attente des qualifiés pour ce match.</p>
          ) : (
            <>
              {[
                { id: "joueur1" as const, nom: matchInitial.joueur1, score: s1, setScore: setS1, enTete: j1EnTete },
                { id: "joueur2" as const, nom: matchInitial.joueur2, score: s2, setScore: setS2, enTete: j2EnTete },
              ].map((p) => (
                <div key={p.id} className="flex items-center gap-2.5">
                  <div
                    className="flex items-center justify-center shrink-0 font-medium text-[10px]"
                    style={{ width: 30, height: 30, borderRadius: "var(--ds-radius-pill)", background: p.enTete ? "var(--ds-accent-800)" : "var(--ds-surface-2)", color: p.enTete ? "var(--ds-accent-300)" : "var(--ds-muted)" }}
                  >
                    {initiales(p.nom ?? "?")}
                  </div>
                  <div className="flex-1 min-w-0 text-[13px] truncate">{p.nom}</div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button type="button" onClick={() => p.setScore((v) => Math.max(0, v - 1))} className={`flex items-center justify-center w-[30px] h-[30px] ${PRESS}`} style={{ borderRadius: "var(--ds-radius-sm)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}>
                      <Minus size={12} strokeWidth={2} />
                    </button>
                    <div
                      className="flex items-center justify-center text-lg"
                      style={{ width: 42, height: 34, borderRadius: "var(--ds-radius-sm)", border: `1px solid ${p.enTete ? "var(--ds-accent)" : "var(--ds-border)"}`, color: p.enTete ? "var(--ds-accent-300)" : "var(--ds-text)", fontFamily: "var(--ds-font-mono)" }}
                    >
                      {p.score}
                    </div>
                    <button type="button" onClick={() => p.setScore((v) => v + 1)} className={`flex items-center justify-center w-[30px] h-[30px] ${PRESS}`} style={{ borderRadius: "var(--ds-radius-sm)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}>
                      <Plus size={12} strokeWidth={2} />
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={valider}
                disabled={s1 === s2 || (enregistre && !modifie)}
                className={`h-9 text-[13px] font-medium disabled:cursor-default ${PRESS}`}
                style={{
                  borderRadius: "var(--ds-radius-md)",
                  border: `1px solid ${enregistre && !modifie ? "var(--ds-border)" : "var(--ds-accent)"}`,
                  color: enregistre && !modifie ? "var(--ds-muted)" : "var(--ds-accent-300)",
                }}
              >
                {enregistre && !modifie ? "Score validé · tour suivant ouvert" : "Valider et passer au tour suivant"}
              </button>
            </>
          )}
        </div>

        {litige && (
          <div className="p-[11px] flex flex-col" style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", boxShadow: "0 0 0 1px var(--ds-accent)" }}>
            <div className="flex items-center gap-2">
              <Scale size={15} strokeWidth={2} style={{ color: "var(--ds-accent-400)" }} />
              <span className="flex-1 text-[10px] uppercase tracking-wide" style={{ color: "var(--ds-accent-300)", fontFamily: "var(--ds-font-mono)" }}>Litige signalé</span>
              <span className="text-[9px]" style={{ color: litige.statut === "en_attente" ? "var(--ds-accent-300)" : "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                {LABEL_STATUT_LITIGE[litige.statut]}
              </span>
            </div>
            <div className="mt-2.5 flex items-baseline gap-2 text-xs">
              <span style={{ color: "var(--ds-muted)" }}>{litige.motifLabel} · {litige.adversaire}</span>
              <span className="ml-auto text-[10px]" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                {litige.preuves.length} PREUVE{litige.preuves.length > 1 ? "S" : ""}
              </span>
            </div>
            {litige.description && (
              <p className="mt-1.5 text-xs leading-relaxed truncate" style={{ color: "color-mix(in srgb, var(--ds-text) 58%, transparent)" }}>
                « {litige.description} »
              </p>
            )}
            {litige.statut === "en_attente" && (
              <div className="flex gap-2 mt-2.5">
                <button
                  type="button"
                  onClick={() => trancherLitige("rejete")}
                  className={`flex-1 flex items-center justify-center gap-1.5 h-9 text-xs font-medium ${PRESS}`}
                  style={{ borderRadius: "var(--ds-radius-sm)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}
                >
                  <XCircle size={13} strokeWidth={2} />
                  Rejeter
                </button>
                <button
                  type="button"
                  onClick={() => trancherLitige("resolu_faveur")}
                  className={`flex-1 flex items-center justify-center gap-1.5 h-9 text-xs font-medium ${PRESS}`}
                  style={{ borderRadius: "var(--ds-radius-sm)", border: "1px solid var(--ds-accent)", color: "var(--ds-accent-300)" }}
                >
                  <CheckCircle2 size={13} strokeWidth={2} />
                  Donner raison
                </button>
              </div>
            )}
          </div>
        )}

        {pretAJouer && matchInitial.statut !== "termine" && (
          <div className="p-[11px] flex flex-col" style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", boxShadow: "var(--ds-shadow-sm, 0 1px 2px rgba(0,0,0,.3))" }}>
            <span className="text-[10px] uppercase tracking-wide" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>Alimenter le fil</span>
            <div className="mt-2.5 flex p-[3px] gap-[3px]" style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-border)" }}>
              <button
                type="button"
                onClick={() => setActeur("joueur1")}
                className={`flex-1 h-[30px] text-xs font-medium ${PRESS}`}
                style={{ borderRadius: "var(--ds-radius-sm)", background: acteur === "joueur1" ? "var(--ds-accent-800)" : "transparent", color: acteur === "joueur1" ? "var(--ds-accent-300)" : "var(--ds-muted)" }}
              >
                {matchInitial.joueur1}
              </button>
              <button
                type="button"
                onClick={() => setActeur("joueur2")}
                className={`flex-1 h-[30px] text-xs font-medium ${PRESS}`}
                style={{ borderRadius: "var(--ds-radius-sm)", background: acteur === "joueur2" ? "var(--ds-accent-800)" : "transparent", color: acteur === "joueur2" ? "var(--ds-accent-300)" : "var(--ds-muted)" }}
              >
                {matchInitial.joueur2}
              </button>
            </div>
            <div className="mt-2.5 flex flex-col gap-1.5">
              {presets.map((p) => {
                const Icone = ICONES_EVENEMENT[p.icone];
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => ajouterEvenement(p.texte)}
                    className={`flex items-center gap-2.5 px-2.5 py-2.5 text-left ${PRESS}`}
                    style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-border)" }}
                  >
                    <Icone size={14} strokeWidth={2} style={{ color: "var(--ds-accent-400)" }} className="shrink-0" />
                    <span className="flex-1 text-xs min-w-0">{p.texte}</span>
                    <Plus size={12} strokeWidth={2} style={{ color: "var(--ds-muted)" }} className="shrink-0" />
                  </button>
                );
              })}
            </div>
            {derniersEvenements.length > 0 && (
              <div className="mt-2.5 pt-2.5" style={{ borderTop: "1px solid var(--ds-border)" }}>
                <span className="text-[9px] uppercase tracking-wide" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>Derniers événements</span>
                <div className="mt-1.5 flex flex-col gap-1.5">
                  {derniersEvenements.map((e, i) => (
                    <div key={i} className="flex items-baseline gap-2">
                      <span className="w-[22px] shrink-0 text-[10px]" style={{ color: "var(--ds-accent-300)", fontFamily: "var(--ds-font-mono)" }}>{e.minute}&apos;</span>
                      <span className="flex-1 min-w-0 text-xs" style={{ color: i === 0 ? "var(--ds-text)" : "var(--ds-muted)" }}>{e.texte}</span>
                      <X size={11} strokeWidth={2} style={{ color: "var(--ds-border-strong)" }} className="shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => router.push(`/tournois/${tournoiId}/bracket`)}
        className={`px-5 flex items-center gap-2 ${PRESS}`}
        style={{ borderTop: "1px solid var(--ds-border)", paddingTop: 12, paddingBottom: 22 }}
      >
        <span className="flex-1 text-left text-sm font-medium" style={{ color: "var(--ds-accent-300)" }}>Voir le bracket complet</span>
        <ArrowRight size={14} strokeWidth={2} style={{ color: "var(--ds-accent-300)" }} />
      </button>
    </div>
  );
}
