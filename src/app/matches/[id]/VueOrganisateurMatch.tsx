"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Minus, Plus, ShieldAlert, CheckCircle2, XCircle, ListChecks, Radio } from "lucide-react";
import { Avatar } from "@/components/ds/Avatar";
import { Button, PRESS } from "@/components/ds/Button";
import { ajouterEvenementMatch, mettreAJourScoreMatch, type MatchTournoi } from "@/lib/mockBracket";
import { notifierParticipants } from "@/lib/mockNotifications";
import { litigeDuMatch, resoudreLitige, type Litige } from "@/lib/mockLitige";
import { tournoiParId, genreDuJeu } from "@/lib/mockTournaments";
import { textesEvenementsPredefinis } from "@/lib/mockEvenementsJeu";

function initiales(nom: string): string {
  return nom
    .split(/[\s.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((mot) => mot[0])
    .join("")
    .toUpperCase();
}

const LABEL_STATUT_LITIGE: Record<Litige["statut"], string> = {
  en_attente: "En attente",
  resolu_faveur: "Résolu en faveur du plaignant",
  rejete: "Rejeté",
};

/** Vue organisateur : interface de gestion du match, sans mise en scène —
 * édition du score, résolution des litiges, avancement du bracket. Aucun
 * point commun visuel avec les vues spectateur ou participant : c'est un
 * outil de travail, pas un écran de suivi. */
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
  const [genreJeu, setGenreJeu] = useState<ReturnType<typeof genreDuJeu>>(undefined);
  const [acteur, setActeur] = useState<"joueur1" | "joueur2">("joueur1");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLitige(litigeDuMatch(matchInitial.id));
    const tournoi = tournoiParId(tournoiId);
    setGenreJeu(tournoi ? genreDuJeu(tournoi.jeuId) : undefined);
  }, [matchInitial.id, tournoiId]);

  const pretAJouer = Boolean(matchInitial.joueur1 && matchInitial.joueur2);
  const modifie = s1 !== (matchInitial.score1 ?? 0) || s2 !== (matchInitial.score2 ?? 0);
  const nomActeur = acteur === "joueur1" ? matchInitial.joueur1 : matchInitial.joueur2;
  const nomCible = acteur === "joueur1" ? matchInitial.joueur2 : matchInitial.joueur1;
  const textesEvenements = nomActeur && nomCible ? textesEvenementsPredefinis(genreJeu, nomActeur, nomCible) : [];

  function valider() {
    if (s1 === s2) return;
    mettreAJourScoreMatch(tournoiId, matchInitial.id, s1, s2);
    notifierParticipants(tournoiId, tournoiTitre, `Score validé : ${matchInitial.joueur1} ${s1} - ${s2} ${matchInitial.joueur2}`);
    setEnregistre(true);
    onMaj();
  }

  function ajouterEvenement(texte: string) {
    ajouterEvenementMatch(tournoiId, matchInitial.id, texte);
    onMaj();
  }

  function trancherLitige(statut: "resolu_faveur" | "rejete") {
    if (!litige) return;
    resoudreLitige(litige.id, statut);
    setLitige({ ...litige, statut });
  }

  return (
    <div className="min-h-screen flex flex-col px-5 py-4 gap-5" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => router.push(`/organisateur/${tournoiId}/gestion`)}
          className={`flex items-center justify-center w-8 h-8 shrink-0 ${PRESS}`}
          style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}
        >
          <ArrowLeft size={15} strokeWidth={2} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="text-[15px] font-medium truncate">Gérer le match</div>
          <div className="text-[9px] uppercase tracking-wide truncate" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
            {tournoiTitre}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="text-[11px] uppercase tracking-wide flex items-center gap-2" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
          <ListChecks size={13} strokeWidth={2} />
          Validation du score
        </div>
        {!pretAJouer ? (
          <p className="text-sm" style={{ color: "var(--ds-text-muted)" }}>
            En attente des qualifiés pour ce match.
          </p>
        ) : (
          <div className="p-4" style={{ borderRadius: "var(--ds-radius-lg)", background: "var(--ds-surface)" }}>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <div className="flex flex-col items-center gap-2">
                <Avatar initiales={initiales(matchInitial.joueur1 ?? "?")} taille={36} />
                <div className="text-[12px] font-medium text-center truncate w-full">{matchInitial.joueur1}</div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setS1((v) => Math.max(0, v - 1))} className={`flex items-center justify-center w-7 h-7 ${PRESS}`} style={{ borderRadius: "var(--ds-radius-sm)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}>
                    <Minus size={11} strokeWidth={2} />
                  </button>
                  <span className="w-6 text-center text-lg" style={{ fontFamily: "var(--ds-font-mono)" }}>{s1}</span>
                  <button type="button" onClick={() => setS1((v) => v + 1)} className={`flex items-center justify-center w-7 h-7 ${PRESS}`} style={{ borderRadius: "var(--ds-radius-sm)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}>
                    <Plus size={11} strokeWidth={2} />
                  </button>
                </div>
              </div>
              <div className="text-xs" style={{ color: "var(--ds-border-strong)" }}>—</div>
              <div className="flex flex-col items-center gap-2">
                <Avatar initiales={initiales(matchInitial.joueur2 ?? "?")} taille={36} />
                <div className="text-[12px] font-medium text-center truncate w-full">{matchInitial.joueur2}</div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setS2((v) => Math.max(0, v - 1))} className={`flex items-center justify-center w-7 h-7 ${PRESS}`} style={{ borderRadius: "var(--ds-radius-sm)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}>
                    <Minus size={11} strokeWidth={2} />
                  </button>
                  <span className="w-6 text-center text-lg" style={{ fontFamily: "var(--ds-font-mono)" }}>{s2}</span>
                  <button type="button" onClick={() => setS2((v) => v + 1)} className={`flex items-center justify-center w-7 h-7 ${PRESS}`} style={{ borderRadius: "var(--ds-radius-sm)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}>
                    <Plus size={11} strokeWidth={2} />
                  </button>
                </div>
              </div>
            </div>

            {enregistre && !modifie ? (
              <p className="mt-3.5 pt-3 text-xs" style={{ borderTop: "1px solid var(--ds-border)", color: "var(--ds-accent-300)" }}>
                Score validé — le bracket a été mis à jour et les inscrits notifiés.
              </p>
            ) : (
              <Button variante="primary" bloc className="mt-3.5" onClick={valider} disabled={s1 === s2}>
                Valider et passer au tour suivant
              </Button>
            )}
          </div>
        )}
      </div>

      {pretAJouer && matchInitial.statut !== "termine" && (
        <div className="flex flex-col gap-3">
          <div className="text-[11px] uppercase tracking-wide flex items-center gap-2" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
            <Radio size={13} strokeWidth={2} />
            Fil du match — ajouter un événement
          </div>
          <div className="flex p-[3px] gap-[3px]" style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-border)" }}>
            <button
              type="button"
              onClick={() => setActeur("joueur1")}
              className={`flex-1 h-8 text-[13px] font-semibold truncate px-2 ${PRESS}`}
              style={{
                borderRadius: "var(--ds-radius-sm)",
                background: acteur === "joueur1" ? "var(--ds-accent-900)" : "transparent",
                color: acteur === "joueur1" ? "var(--ds-accent-300)" : "var(--ds-muted)",
              }}
            >
              {matchInitial.joueur1}
            </button>
            <button
              type="button"
              onClick={() => setActeur("joueur2")}
              className={`flex-1 h-8 text-[13px] font-semibold truncate px-2 ${PRESS}`}
              style={{
                borderRadius: "var(--ds-radius-sm)",
                background: acteur === "joueur2" ? "var(--ds-accent-900)" : "transparent",
                color: acteur === "joueur2" ? "var(--ds-accent-300)" : "var(--ds-muted)",
              }}
            >
              {matchInitial.joueur2}
            </button>
          </div>
          <div className="flex flex-col gap-1.5">
            {textesEvenements.map((texte) => (
              <button
                key={texte}
                type="button"
                onClick={() => ajouterEvenement(texte)}
                className={`h-10 px-3.5 text-left text-sm ${PRESS}`}
                style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: "1px solid var(--ds-border)" }}
              >
                {texte}
              </button>
            ))}
          </div>
          {matchInitial.evenements && matchInitial.evenements.length > 0 && (
            <div className="flex flex-col gap-1">
              {matchInitial.evenements.slice(0, 3).map((ev, i) => (
                <p key={i} className="text-xs" style={{ color: "var(--ds-muted)" }}>
                  {ev.minute}&apos; · {ev.texte}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {litige && (
        <div className="flex flex-col gap-3">
          <div className="text-[11px] uppercase tracking-wide flex items-center gap-2" style={{ color: "var(--ds-danger)", fontFamily: "var(--ds-font-mono)" }}>
            <ShieldAlert size={13} strokeWidth={2} />
            Litige signalé
          </div>
          <div className="flex flex-col gap-2 p-3.5" style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", boxShadow: "0 0 0 1px var(--ds-danger)" }}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{litige.motifLabel}</span>
              <span className="text-[10px]" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                {LABEL_STATUT_LITIGE[litige.statut]}
              </span>
            </div>
            {litige.description && (
              <p className="text-[13px]" style={{ color: "var(--ds-text-muted)" }}>{litige.description}</p>
            )}
            <p className="text-xs" style={{ color: "var(--ds-muted)" }}>
              Contre {litige.adversaire} · {litige.preuves.length} preuve{litige.preuves.length > 1 ? "s" : ""}
            </p>
            {litige.statut === "en_attente" && (
              <div className="flex gap-2 mt-1">
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
                  style={{ borderRadius: "var(--ds-radius-sm)", background: "var(--ds-accent-900)", color: "var(--ds-accent-300)" }}
                >
                  <CheckCircle2 size={13} strokeWidth={2} />
                  Donner raison
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => router.push(`/tournois/${tournoiId}/bracket`)}
        className="text-sm font-medium mt-auto mb-4"
        style={{ color: "var(--ds-accent-300)" }}
      >
        Voir le bracket complet →
      </button>
    </div>
  );
}
