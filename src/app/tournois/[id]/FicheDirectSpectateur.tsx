"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bell,
  Bookmark,
  ChevronRight,
  GitBranch,
  Info,
  MessagesSquare,
  Radio,
  Share2,
  Users,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { PRESS } from "@/components/ds/Button";
import { AvatarPile } from "@/components/ds/Avatar";
import { formatXof } from "@/lib/formatXof";
import { cashPrizeAffiche, type Tournoi } from "@/lib/mockTournaments";
import {
  matchsDuTournoi,
  evenementsDuMatch,
  spectateursDerives,
  libelleRound,
  codeRound,
  type MatchTournoi,
  type EvenementMatch,
} from "@/lib/mockBracket";
import { estFavori, basculerFavori } from "@/lib/mockFavoris";
import { notifsActivees, basculerNotifsTournoi } from "@/lib/mockNotifications";
import { CarteOrganisateur } from "./CarteOrganisateur";

const RAFRAICHISSEMENT_MS = 15_000;
const SEUIL_TEXTE_LONG = 140;

function initiales(nom: string): string {
  return nom.split(/[\s.]+/).filter(Boolean).slice(0, 2).map((m) => m[0]).join("").toUpperCase();
}

/** Score de qualification d'un joueur pour son prochain match — dérivé du
 * dernier match terminé qu'il a joué à une ronde antérieure (aucun champ
 * "qualification" dédié en base, ce n'est qu'une relecture du bracket déjà
 * chargé). undefined si le joueur n'a pas encore de match terminé avant
 * cette ronde (ex: tour 1, ou repêchage). */
function qualifDe(pseudo: string | null | undefined, matchs: MatchTournoi[], round: number): string | undefined {
  if (!pseudo) return undefined;
  const precedents = matchs
    .filter((m) => m.statut === "termine" && m.round < round && (m.joueur1 === pseudo || m.joueur2 === pseudo))
    .sort((a, b) => b.round - a.round);
  const dernier = precedents[0];
  if (!dernier) return undefined;
  const mon = dernier.joueur1 === pseudo ? dernier.score1 : dernier.score2;
  const adv = dernier.joueur1 === pseudo ? dernier.score2 : dernier.score1;
  if (mon == null || adv == null) return undefined;
  return `QUALIFIÉ ${mon}—${adv}`;
}

function BoutonSecondaire({ href, onClick, icone: Icone, label }: { href?: string; onClick?: () => void; icone: typeof GitBranch; label: string }) {
  const contenu = (
    <>
      <Icone size={15} strokeWidth={2} style={{ color: "var(--ds-neutral-500)" }} />
      <span className="text-[10px] font-medium whitespace-nowrap" style={{ color: "var(--ds-neutral-500)" }}>{label}</span>
    </>
  );
  const style: React.CSSProperties = { borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-border)" };
  if (href) {
    return (
      <Link href={href} className={`min-h-[46px] px-1 flex flex-col items-center justify-center gap-0.5 ${PRESS}`} style={style}>
        {contenu}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={`min-h-[46px] px-1 flex flex-col items-center justify-center gap-0.5 ${PRESS}`} style={style}>
      {contenu}
    </button>
  );
}

function BarreAcces({ tournoiId, onInfos }: { tournoiId: string; onInfos: () => void }) {
  return (
    <div className="px-5 pb-3 grid grid-cols-3 gap-1.5">
      <BoutonSecondaire href={`/tournois/${tournoiId}/bracket`} icone={GitBranch} label="Bracket" />
      <BoutonSecondaire onClick={onInfos} icone={Info} label="Infos" />
      <BoutonSecondaire href={`/tournois/${tournoiId}/inscrits`} icone={Users} label="Inscrits" />
    </div>
  );
}

function Entete({ badge, droite }: { badge: React.ReactNode; droite: React.ReactNode }) {
  return (
    <div className="relative flex items-center justify-between">
      <Link
        href="/accueil"
        className={`flex items-center justify-center w-8 h-8 shrink-0 ${PRESS}`}
        style={{ borderRadius: "var(--ds-radius-md)", background: "color-mix(in srgb, var(--ds-bg) 60%, transparent)", border: "1px solid var(--ds-border)", color: "var(--ds-text)" }}
      >
        <ArrowLeft size={15} strokeWidth={2} />
      </Link>
      {badge}
      <div className="flex items-center gap-1.5 shrink-0">{droite}</div>
    </div>
  );
}

function FilAriane({ titre, droite }: { titre: string; droite: string }) {
  return (
    <div className="relative mt-4 flex items-center gap-2">
      <div className="text-[10px] tracking-wide uppercase truncate" style={{ color: "var(--ds-accent-300)", fontFamily: "var(--ds-font-mono)" }}>{titre}</div>
      <div className="flex-1 h-px" style={{ background: "var(--ds-accent-800)" }} />
      <div className="shrink-0 text-[10px] whitespace-nowrap" style={{ color: "var(--ds-neutral-500)", fontFamily: "var(--ds-font-mono)" }}>{droite}</div>
    </div>
  );
}

function FeuilleInfos({
  tournoi,
  matchs,
  roundActuel,
  onFermer,
}: {
  tournoi: Tournoi;
  matchs: MatchTournoi[];
  roundActuel: string;
  onFermer: () => void;
}) {
  const elimines = new Set<string>();
  for (const m of matchs) {
    if (m.statut === "termine" && m.joueur1 && m.joueur2) {
      elimines.add((m.score1 ?? 0) > (m.score2 ?? 0) ? m.joueur2 : m.joueur1);
    }
  }
  const encoreEnCourse = Math.max(0, tournoi.placesInscrites - elimines.size);
  const reglementLong = tournoi.reglement.length > SEUIL_TEXTE_LONG || tournoi.reglement.includes("\n");

  return (
    <div className="fixed inset-0 z-20 flex flex-col justify-end" style={{ maxWidth: 480, margin: "0 auto" }}>
      <button
        type="button"
        onClick={onFermer}
        aria-label="Fermer"
        className="absolute inset-0"
        style={{ background: "color-mix(in srgb, var(--ds-bg) 76%, transparent)" }}
      />
      <div
        className="relative flex flex-col gap-3 px-5 pt-3 pb-6 max-h-[82vh] overflow-y-auto"
        style={{ borderRadius: "var(--ds-radius-lg) var(--ds-radius-lg) 0 0", background: "color-mix(in srgb, var(--ds-surface) 70%, var(--ds-bg))", boxShadow: "var(--ds-shadow-lg)" }}
      >
        <div className="w-11 h-1 rounded-full mx-auto shrink-0" style={{ background: "var(--ds-border)" }} />

        <div>
          <div className="font-medium" style={{ fontSize: 22, fontFamily: "var(--ds-font-heading)" }}>{tournoi.titre}</div>
          <div className="mt-1 text-[10px] tracking-wide uppercase" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
            {tournoi.jeuLabel} · {tournoi.format} · CODE {tournoi.code}
          </div>
        </div>

        <CarteOrganisateur nom={tournoi.organisateur} />

        <div className="grid grid-cols-3 gap-2">
          <div className="p-2.5" style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)" }}>
            <div className="text-[15px]" style={{ fontFamily: "var(--ds-font-mono)" }}>{tournoi.placesInscrites}</div>
            <div className="mt-0.5 text-[11px]" style={{ color: "var(--ds-muted)" }}>joueurs</div>
          </div>
          <div className="p-2.5" style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)" }}>
            <div className="text-[15px]" style={{ fontFamily: "var(--ds-font-mono)", color: "var(--ds-accent-300)" }}>{cashPrizeAffiche(tournoi).toLocaleString("fr-FR")}</div>
            <div className="mt-0.5 text-[11px]" style={{ color: "var(--ds-muted)" }}>CFA</div>
          </div>
          <div className="p-2.5" style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)" }}>
            <div className="text-[15px]" style={{ fontFamily: "var(--ds-font-mono)", color: "var(--ds-accent-300)" }}>{roundActuel}</div>
            <div className="mt-0.5 text-[11px]" style={{ color: "var(--ds-muted)" }}>round</div>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="text-[10px] tracking-wide uppercase" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>Règlement</div>
          <p
            className="text-[13px] leading-relaxed"
            style={{
              color: "var(--ds-text-muted)",
              whiteSpace: "pre-wrap",
              display: reglementLong ? "-webkit-box" : undefined,
              WebkitLineClamp: reglementLong ? 4 : undefined,
              WebkitBoxOrient: reglementLong ? ("vertical" as const) : undefined,
              overflow: reglementLong ? "hidden" : undefined,
            }}
          >
            {tournoi.reglement}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <AvatarPile initiales={tournoi.inscrits} />
          <div className="flex-1 min-w-0 text-[12px] truncate" style={{ color: "var(--ds-muted)" }}>
            {tournoi.placesInscrites} inscrits{matchs.length > 0 ? ` · ${encoreEnCourse} encore en course` : ""}
          </div>
          <Link href={`/tournois/${tournoi.id}/inscrits`} aria-label="Voir les inscrits" className="shrink-0">
            <ChevronRight size={13} strokeWidth={2} style={{ color: "var(--ds-border-strong)" }} />
          </Link>
        </div>

        <button
          type="button"
          onClick={onFermer}
          className={`h-[46px] mt-1 flex items-center justify-center gap-2 text-sm font-medium shrink-0 ${PRESS}`}
          style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-accent)", color: "var(--ds-accent-300)" }}
        >
          <ArrowLeft size={15} strokeWidth={2} />
          Revenir au match
        </button>
      </div>
    </div>
  );
}

/** Barre d'avancement du tournoi (écran "entre deux matchs"), avec le
 * liseré animé qui balaie la partie remplie — variante locale de
 * src/components/ds/ProgressBar.tsx (partagée avec la fiche tournoi
 * standard et /design-system, pas touchée pour ne pas répercuter ce
 * traitement décoratif ailleurs). */
function BarreAvancement({ pourcentage }: { pourcentage: number }) {
  const valeur = Math.min(100, Math.max(0, pourcentage));
  return (
    <div className="relative h-[3px] overflow-hidden" style={{ background: "var(--ds-surface-2)", borderRadius: "var(--ds-radius-pill)" }}>
      <motion.div
        className="h-[3px]"
        style={{ background: "linear-gradient(90deg, var(--ds-accent-700), var(--ds-accent-400))", borderRadius: "var(--ds-radius-pill)" }}
        initial={{ width: 0 }}
        animate={{ width: `${valeur}%` }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />
      <motion.div
        className="absolute inset-y-0 left-0"
        style={{ width: "40%", background: "linear-gradient(90deg, transparent, color-mix(in srgb, var(--ds-accent) 45%, transparent), transparent)" }}
        animate={{ x: ["-100%", "250%"] }}
        transition={{ duration: 2.6, ease: "linear", repeat: Infinity }}
      />
    </div>
  );
}

function BlocFilEvenements({ titre, badge, children }: { titre: string; badge: string; children: React.ReactNode }) {
  return (
    <div className="px-5 pt-3.5 flex-1 flex flex-col gap-0.5 min-h-0 overflow-y-auto">
      <div className="flex items-center gap-2 mb-2 shrink-0">
        <div className="text-[10px] tracking-wide uppercase" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>{titre}</div>
        <div className="flex-1" />
        <div className="text-[9px] whitespace-nowrap" style={{ color: "var(--ds-accent-300)", fontFamily: "var(--ds-font-mono)" }}>{badge}</div>
      </div>
      {children}
    </div>
  );
}

/** Fiche tournoi en direct pour un spectateur non inscrit (ni organisateur,
 * ni participant) — remplace entièrement la fiche standard tant que le
 * tournoi est en direct, pour que le match en cours soit ce qu'il voit en
 * premier, dans le même langage visuel que la vue Match en direct
 * (/matches/[id]) plutôt qu'une fiche d'infos statique. Réservée aux
 * tournois à bracket (1v1/Équipes) — le Battle Royale garde son bloc dédié
 * (classement cumulé, format de scoring différent). */
export function FicheDirectSpectateur({ tournoi }: { tournoi: Tournoi }) {
  const [matchs, setMatchs] = useState<MatchTournoi[]>([]);
  const [evenements, setEvenements] = useState<EvenementMatch[]>([]);
  const [infosOuvertes, setInfosOuvertes] = useState(false);
  const [favori, setFavori] = useState(false);
  const [notifs, setNotifs] = useState(false);
  const [copie, setCopie] = useState(false);

  useEffect(() => {
    estFavori(tournoi.id).then(setFavori);
    notifsActivees(tournoi.id).then(setNotifs);
  }, [tournoi.id]);

  useEffect(() => {
    let annule = false;
    async function charger() {
      const liste = await matchsDuTournoi(tournoi.id);
      if (!annule) setMatchs(liste);
    }
    charger();
    const id = setInterval(charger, RAFRAICHISSEMENT_MS);
    return () => {
      annule = true;
      clearInterval(id);
    };
  }, [tournoi.id]);

  const matchVedette = matchs.find((m) => m.statut === "en_cours");

  useEffect(() => {
    if (!matchVedette) {
      setEvenements([]);
      return;
    }
    let annule = false;
    async function charger() {
      const liste = await evenementsDuMatch(matchVedette!.id);
      if (!annule) setEvenements(liste);
    }
    charger();
    const id = setInterval(charger, RAFRAICHISSEMENT_MS);
    return () => {
      annule = true;
      clearInterval(id);
    };
  }, [matchVedette]);

  async function partager() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ url, title: document.title });
        return;
      } catch {
        // annulé ou indisponible : on retombe sur la copie
      }
    }
    await navigator.clipboard.writeText(url);
    setCopie(true);
    setTimeout(() => setCopie(false), 1800);
  }

  const totalRounds = matchs.length > 0 ? Math.max(...matchs.map((m) => m.round)) : 0;
  const matchsTermines = matchs.filter((m) => m.statut === "termine").length;
  const rondesPasEncoreTerminees = matchs.filter((m) => m.statut !== "termine").map((m) => m.round);
  const roundActuelCode = matchVedette
    ? codeRound(matchVedette.round, totalRounds)
    : rondesPasEncoreTerminees.length > 0
      ? codeRound(Math.min(...rondesPasEncoreTerminees), totalRounds)
      : "–";
  const spectateurs = matchVedette ? spectateursDerives(matchVedette.id) : spectateursDerives(tournoi.id);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
      {matchVedette ? (
        <SceneMatchEnCours
          tournoi={tournoi}
          match={matchVedette}
          totalRounds={totalRounds}
          evenements={evenements}
          spectateurs={spectateurs}
          favori={favori}
          onFavori={() => basculerFavori(tournoi.id).then(setFavori)}
          onPartager={partager}
          copie={copie}
        />
      ) : (
        <SceneEntreDeuxMatchs
          tournoi={tournoi}
          matchs={matchs}
          totalRounds={totalRounds}
          matchsTermines={matchsTermines}
          spectateurs={spectateurs}
          notifs={notifs}
          onNotifs={() => basculerNotifsTournoi(tournoi.id).then(setNotifs)}
        />
      )}

      <BarreAcces tournoiId={tournoi.id} onInfos={() => setInfosOuvertes(true)} />

      {infosOuvertes && (
        <FeuilleInfos tournoi={tournoi} matchs={matchs} roundActuel={roundActuelCode} onFermer={() => setInfosOuvertes(false)} />
      )}
    </div>
  );
}

function SceneMatchEnCours({
  tournoi,
  match,
  totalRounds,
  evenements,
  spectateurs,
  favori,
  onFavori,
  onPartager,
  copie,
}: {
  tournoi: Tournoi;
  match: MatchTournoi;
  totalRounds: number;
  evenements: EvenementMatch[];
  spectateurs: number;
  favori: boolean;
  onFavori: () => void;
  onPartager: () => void;
  copie: boolean;
}) {
  const s1 = match.score1 ?? 0;
  const s2 = match.score2 ?? 0;
  const j1EnTete = s1 > s2;
  const j2EnTete = s2 > s1;

  return (
    <>
      <div
        className="relative px-5 pt-[42px] pb-4 overflow-hidden"
        style={{ background: "radial-gradient(135% 150% at 50% 0%, var(--ds-accent-900), var(--ds-bg) 74%)" }}
      >
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: "linear-gradient(90deg, var(--ds-accent) 1px, transparent 1px)", backgroundSize: "24px 100%" }}
        />
        <Entete
          badge={
            <div className="flex items-center gap-1.5 px-3 py-1" style={{ borderRadius: "var(--ds-radius-pill)", border: "1px solid var(--ds-accent)", boxShadow: "0 0 18px color-mix(in srgb, var(--ds-accent) 22%, transparent)" }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--ds-accent-400)" }} />
              <span className="text-[10px] tracking-wide whitespace-nowrap" style={{ color: "var(--ds-accent-300)", fontFamily: "var(--ds-font-mono)" }}>EN DIRECT</span>
            </div>
          }
          droite={
            <>
              <button
                type="button"
                onClick={onFavori}
                aria-label={favori ? "Retirer des favoris" : "Ajouter aux favoris"}
                className={`flex items-center justify-center w-8 h-8 ${PRESS}`}
                style={{ borderRadius: "var(--ds-radius-md)", background: "color-mix(in srgb, var(--ds-bg) 60%, transparent)", border: `1px solid ${favori ? "var(--ds-accent)" : "var(--ds-border)"}`, color: favori ? "var(--ds-accent-300)" : "var(--ds-text)" }}
              >
                <Bookmark size={15} strokeWidth={2} fill={favori ? "currentColor" : "none"} />
              </button>
              <button
                type="button"
                onClick={onPartager}
                aria-label="Partager"
                className={`flex items-center justify-center w-8 h-8 ${PRESS}`}
                style={{ borderRadius: "var(--ds-radius-md)", background: "color-mix(in srgb, var(--ds-bg) 60%, transparent)", border: "1px solid var(--ds-border)", color: copie ? "var(--ds-accent-300)" : "var(--ds-text)" }}
              >
                <Share2 size={14} strokeWidth={2} />
              </button>
            </>
          }
        />

        <FilAriane titre={tournoi.titre} droite={`${codeRound(match.round, totalRounds).toUpperCase()} · ${libelleRound(match.round, totalRounds).toUpperCase()}`} />

        <div className="relative mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-1.5">
          <div className="flex flex-col items-center gap-2.5 min-w-0">
            <div
              className="flex items-center justify-center shrink-0 font-medium overflow-hidden"
              style={{ width: 76, height: 76, borderRadius: "var(--ds-radius-pill)", background: j1EnTete ? "var(--ds-accent-800)" : "var(--ds-surface-2)", border: `1px solid ${j1EnTete ? "var(--ds-accent)" : "var(--ds-border)"}`, color: j1EnTete ? "var(--ds-accent-300)" : "var(--ds-muted)", fontSize: 23, boxShadow: j1EnTete ? "0 0 34px color-mix(in srgb, var(--ds-accent) 30%, transparent)" : undefined }}
            >
              {match.joueur1PhotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={match.joueur1PhotoUrl} alt={match.joueur1 ?? ""} className="w-full h-full object-cover" />
              ) : (
                initiales(match.joueur1 ?? "?")
              )}
            </div>
            <div className="text-center min-w-0 w-full">
              <div className="text-[15px] font-medium truncate">{match.joueur1 ?? "À définir"}</div>
            </div>
          </div>
          <div className="text-center px-1">
            <div className="text-[48px] leading-none" style={{ fontFamily: "var(--ds-font-mono)", color: j1EnTete || (!j1EnTete && !j2EnTete) ? "var(--ds-text)" : "var(--ds-muted)" }}>{s1}</div>
            <div className="my-0.5 text-[13px]" style={{ color: "var(--ds-border-strong)", fontFamily: "var(--ds-font-mono)" }}>—</div>
            <div className="text-[48px] leading-none" style={{ fontFamily: "var(--ds-font-mono)", color: j2EnTete || (!j1EnTete && !j2EnTete) ? "var(--ds-text)" : "var(--ds-muted)" }}>{s2}</div>
          </div>
          <div className="flex flex-col items-center gap-2.5 min-w-0">
            <div
              className="flex items-center justify-center shrink-0 font-medium overflow-hidden"
              style={{ width: 76, height: 76, borderRadius: "var(--ds-radius-pill)", background: j2EnTete ? "var(--ds-accent-800)" : "var(--ds-surface-2)", border: `1px solid ${j2EnTete ? "var(--ds-accent)" : "var(--ds-border)"}`, color: j2EnTete ? "var(--ds-accent-300)" : "var(--ds-muted)", fontSize: 23, boxShadow: j2EnTete ? "0 0 34px color-mix(in srgb, var(--ds-accent) 30%, transparent)" : undefined }}
            >
              {match.joueur2PhotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={match.joueur2PhotoUrl} alt={match.joueur2 ?? ""} className="w-full h-full object-cover" />
              ) : (
                initiales(match.joueur2 ?? "?")
              )}
            </div>
            <div className="text-center min-w-0 w-full">
              <div className="text-[15px] font-medium truncate">{match.joueur2 ?? "À définir"}</div>
            </div>
          </div>
        </div>
        {tournoi.manchesParMatch && (
          <div className="relative mt-3 text-center text-[9px] tracking-wide uppercase whitespace-nowrap" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
            {libelleRound(match.round, totalRounds)} · MANCHE {s1 + s2 + 1} · BO{tournoi.manchesParMatch}
          </div>
        )}
      </div>

      <div className="h-px" style={{ background: "linear-gradient(to right, transparent, var(--ds-border) 48px, var(--ds-border) calc(100% - 48px), transparent)" }} />

      <BlocFilEvenements titre="Fil du match" badge="EN TEMPS RÉEL">
        {evenements.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--ds-text-muted)" }}>Aucun événement pour l&apos;instant.</p>
        ) : (
          evenements.map((ev, i) => (
            <div key={ev.id} className="flex gap-3">
              <div className="w-[38px] shrink-0 text-right text-[10px] pt-2.5" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                {new Date(ev.creeLe).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
              </div>
              <div className="relative w-px shrink-0" style={{ background: "var(--ds-border)" }}>
                <div className="absolute w-1.5 h-1.5 rounded-full" style={{ left: -3, top: 11, background: i === 0 ? "var(--ds-accent-400)" : "var(--ds-border-strong)" }} />
              </div>
              <div className="flex-1 min-w-0 py-1.5 pb-2.5">
                <div className="text-[13px]" style={{ color: i === 0 ? "var(--ds-text)" : "var(--ds-text-muted)" }}>{ev.texte}</div>
              </div>
            </div>
          ))
        )}
      </BlocFilEvenements>

      <div className="px-5 flex flex-col gap-2" style={{ borderTop: "1px solid var(--ds-border)", paddingTop: 12, paddingBottom: 22 }}>
        <Link
          href={`/matches/${match.id}/chat`}
          className={`h-12 flex items-center justify-center gap-2 text-sm font-medium ${PRESS}`}
          style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-accent)", color: "var(--ds-accent-300)" }}
        >
          <MessagesSquare size={17} strokeWidth={2} />
          {spectateurs} spectateur{spectateurs > 1 ? "s" : ""} discutent
        </Link>
        <div className="flex items-center gap-2">
          <Radio size={13} strokeWidth={2} style={{ color: tournoi.streamActif ? "var(--ds-accent-400)" : "var(--ds-muted)" }} className="shrink-0" />
          <div className="flex-1 min-w-0 text-[10px] tracking-wide truncate" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
            {tournoi.streamActif ? "STREAM ACTIF · INSCRIPTIONS CLOSES" : "STREAM NON ACTIVÉ · SUIS LE TOURNOI PAR LE FIL DES MATCHS"}
          </div>
        </div>
      </div>
    </>
  );
}

function SceneEntreDeuxMatchs({
  tournoi,
  matchs,
  totalRounds,
  matchsTermines,
  spectateurs,
  notifs,
  onNotifs,
}: {
  tournoi: Tournoi;
  matchs: MatchTournoi[];
  totalRounds: number;
  matchsTermines: number;
  spectateurs: number;
  notifs: boolean;
  onNotifs: () => void;
}) {
  const prochainMatch = matchs.find((m) => m.statut === "a_venir" && m.joueur1 && m.joueur2);
  const derniersResultats = matchs
    .filter((m) => m.statut === "termine")
    .slice(-3)
    .reverse();
  const avancement = matchs.length > 0 ? Math.round((matchsTermines / matchs.length) * 100) : 0;

  return (
    <>
      <div
        className="relative px-5 pt-[42px] pb-4 overflow-hidden"
        style={{ background: "radial-gradient(135% 150% at 50% 0%, var(--ds-accent-900), var(--ds-bg) 74%)" }}
      >
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: "linear-gradient(90deg, var(--ds-accent) 1px, transparent 1px)", backgroundSize: "24px 100%" }}
        />
        <Entete
          badge={
            <div className="flex items-center gap-1.5 px-3 py-1" style={{ borderRadius: "var(--ds-radius-pill)", border: "1px solid var(--ds-accent-700)" }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--ds-accent-400)", opacity: 0.7 }} />
              <span className="text-[10px] tracking-wide whitespace-nowrap" style={{ color: "var(--ds-accent-300)", fontFamily: "var(--ds-font-mono)" }}>ENTRE DEUX MATCHS</span>
            </div>
          }
          droite={
            <button
              type="button"
              onClick={onNotifs}
              aria-label={notifs ? "Désactiver les notifications" : "Me prévenir à la reprise"}
              className={`flex items-center justify-center w-8 h-8 ${PRESS}`}
              style={{ borderRadius: "var(--ds-radius-md)", background: "color-mix(in srgb, var(--ds-bg) 60%, transparent)", border: `1px solid ${notifs ? "var(--ds-accent)" : "var(--ds-border)"}`, color: notifs ? "var(--ds-accent-300)" : "var(--ds-text)" }}
            >
              <Bell size={14} strokeWidth={2} fill={notifs ? "currentColor" : "none"} />
            </button>
          }
        />

        <FilAriane titre={tournoi.titre} droite={prochainMatch ? codeRound(prochainMatch.round, totalRounds).toUpperCase() : "EN PAUSE"} />

        <div className="relative mt-5 text-center">
          <div className="text-[9px] tracking-wide uppercase" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>Compétition en pause</div>
          <p className="mt-2 text-sm max-w-[280px] mx-auto" style={{ color: "var(--ds-text-muted)" }}>
            L&apos;organisateur prépare le prochain match — reste sur cette page, elle se met à jour automatiquement.
          </p>
        </div>

        {prochainMatch && (
          <div className="relative mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <div className="flex flex-col items-center gap-2 min-w-0">
              <div className="flex items-center justify-center shrink-0 font-medium" style={{ width: 56, height: 56, borderRadius: "var(--ds-radius-pill)", background: "var(--ds-surface-2)", border: "1px solid var(--ds-border)", color: "var(--ds-neutral-400)", fontSize: 17 }}>
                {initiales(prochainMatch.joueur1 ?? "?")}
              </div>
              <div className="text-center min-w-0 w-full">
                <div className="text-[13px] font-medium truncate">{prochainMatch.joueur1}</div>
                {qualifDe(prochainMatch.joueur1, matchs, prochainMatch.round) && (
                  <div className="mt-0.5 text-[9px] whitespace-nowrap" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                    {qualifDe(prochainMatch.joueur1, matchs, prochainMatch.round)}
                  </div>
                )}
              </div>
            </div>
            <div className="text-[12px] tracking-wide whitespace-nowrap" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>VS</div>
            <div className="flex flex-col items-center gap-2 min-w-0">
              <div className="flex items-center justify-center shrink-0 font-medium" style={{ width: 56, height: 56, borderRadius: "var(--ds-radius-pill)", background: "var(--ds-surface-2)", border: "1px solid var(--ds-border)", color: "var(--ds-neutral-400)", fontSize: 17 }}>
                {initiales(prochainMatch.joueur2 ?? "?")}
              </div>
              <div className="text-center min-w-0 w-full">
                <div className="text-[13px] font-medium truncate">{prochainMatch.joueur2}</div>
                {qualifDe(prochainMatch.joueur2, matchs, prochainMatch.round) && (
                  <div className="mt-0.5 text-[9px] whitespace-nowrap" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                    {qualifDe(prochainMatch.joueur2, matchs, prochainMatch.round)}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="relative mt-5">
          <div className="flex items-center justify-between mb-1.5">
            <div className="text-[9px] tracking-wide uppercase" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>Avancement</div>
            <div className="text-[10px] whitespace-nowrap" style={{ color: "var(--ds-accent-300)", fontFamily: "var(--ds-font-mono)" }}>{matchsTermines} / {matchs.length} MATCHS</div>
          </div>
          <BarreAvancement pourcentage={avancement} />
        </div>
      </div>

      <div className="h-px" style={{ background: "linear-gradient(to right, transparent, var(--ds-border) 48px, var(--ds-border) calc(100% - 48px), transparent)" }} />

      <BlocFilEvenements titre="Fil du tournoi" badge={`${derniersResultats.length} DERNIERS RÉSULTATS`}>
        {derniersResultats.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--ds-text-muted)" }}>Aucun résultat pour l&apos;instant.</p>
        ) : (
          derniersResultats.map((m, i) => (
            <div key={m.id} className="flex gap-3">
              <div className="w-[38px] shrink-0 text-right text-[10px] pt-2.5" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                {codeRound(m.round, totalRounds)}
              </div>
              <div className="relative w-px shrink-0" style={{ background: "var(--ds-border)" }}>
                <div className="absolute w-1.5 h-1.5 rounded-full" style={{ left: -3, top: 11, background: i === 0 ? "var(--ds-accent-400)" : "var(--ds-border-strong)" }} />
              </div>
              <div className="flex-1 min-w-0 py-1.5 pb-2.5 flex items-center gap-2">
                <div className="flex-1 min-w-0 text-[13px] truncate" style={{ color: i === 0 ? "var(--ds-text)" : "var(--ds-text-muted)" }}>
                  {(m.score1 ?? 0) > (m.score2 ?? 0) ? m.joueur1 : m.joueur2} élimine {(m.score1 ?? 0) > (m.score2 ?? 0) ? m.joueur2 : m.joueur1}
                </div>
                <div className="shrink-0 text-xs whitespace-nowrap" style={{ fontFamily: "var(--ds-font-mono)", color: "var(--ds-accent-300)" }}>{m.score1} — {m.score2}</div>
              </div>
            </div>
          ))
        )}
      </BlocFilEvenements>

      <div className="px-5 flex flex-col gap-2" style={{ borderTop: "1px solid var(--ds-border)", paddingTop: 12, paddingBottom: 22 }}>
        <button
          type="button"
          onClick={onNotifs}
          className={`h-12 flex items-center justify-center gap-2 text-sm font-medium ${PRESS}`}
          style={{ borderRadius: "var(--ds-radius-md)", border: `1px solid ${notifs ? "var(--ds-accent)" : "var(--ds-border)"}`, color: notifs ? "var(--ds-accent-300)" : "var(--ds-text)" }}
        >
          <Bell size={16} strokeWidth={2} fill={notifs ? "currentColor" : "none"} />
          {notifs ? "Tu seras prévenu à la reprise" : "Me prévenir à la reprise"}
        </button>
        <Link
          href={`/tournois/${tournoi.id}/chat-spectateurs`}
          className={`h-10 flex items-center justify-center gap-2 text-xs font-medium ${PRESS}`}
          style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-border)", color: "var(--ds-neutral-500)" }}
        >
          <MessagesSquare size={14} strokeWidth={2} />
          {spectateurs} spectateur{spectateurs > 1 ? "s" : ""} discutent
        </Link>
      </div>
    </>
  );
}
