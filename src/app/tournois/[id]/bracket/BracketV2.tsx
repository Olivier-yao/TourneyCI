"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { History } from "lucide-react";
import { Modal } from "@/components/ds/Modal";
import { PRESS } from "@/components/ds/Button";
import { evenementsDuMatch, type MatchTournoi, type EvenementMatch } from "@/lib/mockBracket";

type Ligne = { id: string; d: string };

function nomRound(round: number, totalRounds: number): string {
  if (round === totalRounds) return "Finale";
  if (round === totalRounds - 1) return "Demies";
  if (round === totalRounds - 2) return "Quarts";
  return `Round ${round}`;
}

function CarteMatch({
  match,
  refCallback,
  onVoirHistorique,
}: {
  match: MatchTournoi;
  refCallback: (el: HTMLDivElement | null) => void;
  onVoirHistorique: (match: MatchTournoi) => void;
}) {
  const enCours = match.statut === "en_cours";
  const termine = match.statut === "termine";
  const p1Gagnant =
    match.statut === "termine" &&
    (match.score1 ?? 0) > (match.score2 ?? 0);
  const p2Gagnant =
    match.statut === "termine" &&
    (match.score2 ?? 0) > (match.score1 ?? 0);

  const contenu = (
    <div
      ref={refCallback}
      data-match-id={match.id}
      className="w-56 p-2.5 flex flex-col gap-1.5"
      style={{
        borderRadius: "var(--ds-radius-md)",
        background: "var(--ds-surface)",
        border: `1px solid ${enCours ? "var(--ds-accent)" : "var(--ds-border)"}`,
        boxShadow: enCours ? "var(--ds-shadow-md)" : undefined,
      }}
    >
      <div className="flex items-center justify-between text-[13px]">
        <span
          className={p1Gagnant ? "font-semibold" : ""}
          style={{ color: p1Gagnant ? "var(--ds-accent-300)" : "var(--ds-text)" }}
        >
          {match.joueur1 ?? "À définir"}
        </span>
        <span
          className="text-xs"
          style={{ color: enCours ? "var(--ds-accent-300)" : "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}
        >
          {match.score1 ?? "—"}
        </span>
      </div>
      <div className="h-px" style={{ background: "var(--ds-border)" }} />
      <div className="flex items-center justify-between text-[13px]">
        <span
          className={p2Gagnant ? "font-semibold" : ""}
          style={{ color: p2Gagnant ? "var(--ds-accent-300)" : "var(--ds-text)" }}
        >
          {match.joueur2 ?? "À définir"}
        </span>
        <span
          className="text-xs"
          style={{ color: enCours ? "var(--ds-accent-300)" : "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}
        >
          {match.score2 ?? "—"}
        </span>
      </div>
      {enCours && (
        <div
          className="flex items-center gap-1.5 text-[10px]"
          style={{ color: "var(--ds-accent-300)", fontFamily: "var(--ds-font-mono)" }}
        >
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--ds-accent-300)" }} />
          EN COURS
        </div>
      )}
      {termine && (
        <div className="flex items-center gap-1.5 text-[10px]" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
          <History size={11} strokeWidth={2} />
          Voir l&apos;historique
        </div>
      )}
    </div>
  );

  if (enCours) {
    return <Link href={`/matches/${match.id}`}>{contenu}</Link>;
  }
  if (termine) {
    return (
      <button type="button" onClick={() => onVoirHistorique(match)} className={`text-left ${PRESS}`}>
        {contenu}
      </button>
    );
  }
  return contenu;
}

function CarteVainqueur({ nom, refCallback }: { nom: string | null; refCallback: (el: HTMLDivElement | null) => void }) {
  return (
    <div
      ref={refCallback}
      className="w-56 p-3 flex items-center justify-center text-center"
      style={{
        borderRadius: "var(--ds-radius-md)",
        background: nom ? "var(--ds-accent-900)" : "var(--ds-surface)",
        border: `1px solid ${nom ? "var(--ds-accent)" : "var(--ds-border)"}`,
      }}
    >
      <span
        className="text-[15px] font-semibold"
        style={{ color: nom ? "var(--ds-accent-300)" : "var(--ds-muted)" }}
      >
        {nom ?? "À définir"}
      </span>
    </div>
  );
}

export function BracketV2({ matches }: { matches: MatchTournoi[] }) {
  const [filtre, setFiltre] = useState<"top8" | "tout">("top8");
  const [matchHistorique, setMatchHistorique] = useState<MatchTournoi | null>(null);
  const [evenementsHistorique, setEvenementsHistorique] = useState<EvenementMatch[]>([]);

  useEffect(() => {
    if (!matchHistorique) {
      setEvenementsHistorique([]);
      return;
    }
    evenementsDuMatch(matchHistorique.id).then(setEvenementsHistorique);
  }, [matchHistorique]);
  const conteneurRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const glisser = useRef<{ x: number; y: number; scrollLeft: number; scrollTop: number; deplace: boolean } | null>(null);
  const [enGlissement, setEnGlissement] = useState(false);
  const cartesRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const vainqueurRef = useRef<HTMLDivElement | null>(null);
  const [lignes, setLignes] = useState<Ligne[]>([]);
  const [dimensions, setDimensions] = useState({ largeur: 0, hauteur: 0 });

  const totalRounds = matches.length > 0 ? Math.max(...matches.map((m) => m.round)) : 0;
  const matchsParRound = new Map<number, MatchTournoi[]>();
  for (const m of matches) {
    const liste = matchsParRound.get(m.round) ?? [];
    liste.push(m);
    matchsParRound.set(m.round, liste);
  }

  const finale = (matchsParRound.get(totalRounds) ?? []).find((m) => m.position === 0);
  const nomVainqueur =
    finale && finale.statut === "termine"
      ? (finale.score1 ?? 0) > (finale.score2 ?? 0)
        ? finale.joueur1
        : finale.joueur2
      : null;

  useEffect(() => {
    function mesurer() {
      const conteneur = conteneurRef.current;
      if (!conteneur) return;
      const rectConteneur = conteneur.getBoundingClientRect();
      const nouvellesLignes: Ligne[] = [];

      for (let round = 1; round < totalRounds; round++) {
        const matchsRound = matchsParRound.get(round) ?? [];
        for (const feeder of matchsRound) {
          const positionCible = Math.floor(feeder.position / 2);
          const cible = (matchsParRound.get(round + 1) ?? []).find(
            (m) => m.position === positionCible,
          );
          if (!cible) continue;

          const elFeeder = cartesRef.current.get(feeder.id);
          const elCible = cartesRef.current.get(cible.id);
          if (!elFeeder || !elCible) continue;

          const rFeeder = elFeeder.getBoundingClientRect();
          const rCible = elCible.getBoundingClientRect();

          const x1 = rFeeder.right - rectConteneur.left;
          const y1 = rFeeder.top + rFeeder.height / 2 - rectConteneur.top;
          const x2 = rCible.left - rectConteneur.left;
          const y2 = rCible.top + rCible.height / 2 - rectConteneur.top;
          const midX = x1 + (x2 - x1) / 2;

          nouvellesLignes.push({
            id: `${feeder.id}-${cible.id}`,
            d: `M ${x1} ${y1} H ${midX} V ${y2} H ${x2}`,
          });
        }
      }

      if (finale && vainqueurRef.current) {
        const elFinale = cartesRef.current.get(finale.id);
        if (elFinale) {
          const rFinale = elFinale.getBoundingClientRect();
          const rVainqueur = vainqueurRef.current.getBoundingClientRect();
          const x1 = rFinale.right - rectConteneur.left;
          const y1 = rFinale.top + rFinale.height / 2 - rectConteneur.top;
          const x2 = rVainqueur.left - rectConteneur.left;
          const y2 = rVainqueur.top + rVainqueur.height / 2 - rectConteneur.top;
          const midX = x1 + (x2 - x1) / 2;
          nouvellesLignes.push({
            id: `${finale.id}-vainqueur`,
            d: `M ${x1} ${y1} H ${midX} V ${y2} H ${x2}`,
          });
        }
      }

      setLignes(nouvellesLignes);
      setDimensions({ largeur: conteneur.scrollWidth, hauteur: conteneur.scrollHeight });
    }

    mesurer();
    window.addEventListener("resize", mesurer);
    return () => window.removeEventListener("resize", mesurer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matches, totalRounds, filtre]);

  // Le mock ne couvre qu'un bracket à 8 joueurs : "Top 8" et "Tout" sont
  // donc identiques pour l'instant. Le filtre distinguera vraiment les
  // rounds une fois de plus gros brackets disponibles (phase 8).
  const rounds = Array.from({ length: totalRounds }, (_, i) => i + 1);

  // Déplacement libre dans la vue (clic-glisser, comme un plan) — en plus
  // du scroll natif déjà possible. Seuil de 5px avant de considérer que
  // c'est un glissement plutôt qu'un simple clic, pour ne pas casser les
  // clics sur les cartes de match (lien vers le match en cours, historique
  // d'un match terminé).
  const SEUIL_GLISSEMENT_PX = 5;

  // La capture du pointeur n'est prise qu'une fois le seuil dépassé (pas dès
  // le pointerdown) : un simple clic sur une carte de match (lien vers le
  // match en cours, bouton d'historique d'un match terminé) doit rester un
  // clic normal, jamais intercepté par le glissement.
  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    const el = scrollRef.current;
    if (!el) return;
    glisser.current = { x: e.clientX, y: e.clientY, scrollLeft: el.scrollLeft, scrollTop: el.scrollTop, deplace: false };
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const el = scrollRef.current;
    const depart = glisser.current;
    if (!el || !depart) return;
    const dx = e.clientX - depart.x;
    const dy = e.clientY - depart.y;
    if (!depart.deplace) {
      if (Math.abs(dx) < SEUIL_GLISSEMENT_PX && Math.abs(dy) < SEUIL_GLISSEMENT_PX) return;
      depart.deplace = true;
      setEnGlissement(true);
      el.setPointerCapture(e.pointerId);
    }
    el.scrollLeft = depart.scrollLeft - dx;
    el.scrollTop = depart.scrollTop - dy;
  }

  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (glisser.current?.deplace) scrollRef.current?.releasePointerCapture(e.pointerId);
    glisser.current = null;
    setEnGlissement(false);
  }

  return (
    <div>
      <div className="flex justify-end mb-3">
        <div
          className="flex p-[3px] gap-[3px] text-xs"
          style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-border)" }}
        >
          {(["top8", "tout"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFiltre(f)}
              className="px-2.5 py-1.5 cursor-pointer transition-colors"
              style={{
                borderRadius: "var(--ds-radius-sm)",
                background: filtre === f ? "var(--ds-accent-900)" : "transparent",
                color: filtre === f ? "var(--ds-accent-300)" : "var(--ds-muted)",
              }}
            >
              {f === "top8" ? "Top 8" : "Tout"}
            </button>
          ))}
        </div>
      </div>

      <div
        ref={scrollRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="overflow-auto pb-4 max-h-[70vh]"
        style={{ cursor: enGlissement ? "grabbing" : "grab", touchAction: "none" }}
      >
        <div
          ref={conteneurRef}
          className="relative flex items-stretch gap-12"
          style={{ width: "max-content" }}
        >
          <svg className="absolute inset-0 pointer-events-none" width={dimensions.largeur} height={dimensions.hauteur}>
            {lignes.map((ligne, i) => (
              <motion.path
                key={ligne.id}
                d={ligne.d}
                fill="none"
                stroke="var(--ds-accent)"
                strokeWidth={2}
                strokeLinecap="square"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.15 + i * 0.06 }}
              />
            ))}
          </svg>

          {rounds.map((round) => (
            <div key={round} className="flex flex-col justify-around gap-5 shrink-0">
              <h2
                className="text-xs font-bold uppercase tracking-widest text-center"
                style={{ color: "var(--ds-accent)", fontFamily: "var(--ds-font-mono)" }}
              >
                {nomRound(round, totalRounds)}
              </h2>
              <div className="flex flex-1 flex-col justify-around gap-5">
                {(matchsParRound.get(round) ?? []).map((match) => (
                  <CarteMatch
                    key={match.id}
                    match={match}
                    refCallback={(el) => {
                      if (el) cartesRef.current.set(match.id, el);
                      else cartesRef.current.delete(match.id);
                    }}
                    onVoirHistorique={setMatchHistorique}
                  />
                ))}
              </div>
            </div>
          ))}

          {finale && (
            <div className="flex flex-col justify-around gap-5 shrink-0">
              <h2
                className="text-xs font-bold uppercase tracking-widest text-center"
                style={{ color: "var(--ds-accent)", fontFamily: "var(--ds-font-mono)" }}
              >
                Vainqueur
              </h2>
              <div className="flex flex-1 flex-col justify-around gap-5">
                <CarteVainqueur nom={nomVainqueur} refCallback={(el) => (vainqueurRef.current = el)} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Point 163 : historique consultable d'un duel déjà joué (score final
          + fil d'événements), pas seulement le score brut affiché sur la carte. */}
      <Modal
        ouvert={matchHistorique !== null}
        titre={matchHistorique ? `${matchHistorique.joueur1 ?? "?"} vs ${matchHistorique.joueur2 ?? "?"}` : ""}
        onFermer={() => setMatchHistorique(null)}
      >
        {matchHistorique && (
          <div className="flex flex-col gap-3 not-italic" style={{ whiteSpace: "normal" }}>
            <div className="flex items-center justify-center gap-4 py-2">
              <span className="text-lg font-semibold" style={{ color: (matchHistorique.score1 ?? 0) > (matchHistorique.score2 ?? 0) ? "var(--ds-accent-300)" : "var(--ds-text)" }}>
                {matchHistorique.joueur1}
              </span>
              <span className="text-xl font-bold" style={{ fontFamily: "var(--ds-font-mono)" }}>
                {matchHistorique.score1} – {matchHistorique.score2}
              </span>
              <span className="text-lg font-semibold" style={{ color: (matchHistorique.score2 ?? 0) > (matchHistorique.score1 ?? 0) ? "var(--ds-accent-300)" : "var(--ds-text)" }}>
                {matchHistorique.joueur2}
              </span>
            </div>

            <div className="text-[10px] uppercase tracking-wide" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
              Fil du match
            </div>
            {evenementsHistorique.length > 0 ? (
              <div className="flex flex-col gap-2">
                {evenementsHistorique.map((evt) => (
                  <div key={evt.id} className="flex items-start gap-2.5">
                    <span className="shrink-0 text-xs" style={{ color: "var(--ds-accent-300)", fontFamily: "var(--ds-font-mono)" }}>
                      {new Date(evt.creeLe).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <span className="text-sm">{evt.texte}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs" style={{ color: "var(--ds-muted)" }}>
                Aucun événement enregistré pour ce match — seul le score final est disponible.
              </p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
