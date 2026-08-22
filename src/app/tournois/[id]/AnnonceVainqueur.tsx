"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BadgeCheck, Crown, Flag, ListOrdered, Medal, Share2, Trophy } from "lucide-react";
import { PRESS } from "@/components/ds/Button";
import { formatXof } from "@/lib/formatXof";
import { cashPrizeAffiche, repartitionAutomatique, LABEL_UNITE_EQUIPE, type Tournoi } from "@/lib/mockTournaments";
import { matchsDuTournoi, type MatchTournoi } from "@/lib/mockBracket";
import { classementCumuleBR, LABEL_UNITE_BR, type LigneClassementBR } from "@/lib/mockBattleRoyale";
import { tagDeJoueur } from "@/lib/mockProfil";

const HEX_CLIP = "polygon(50% 0%, 100% 16%, 100% 68%, 50% 100%, 0% 68%, 0% 16%)";

function initiales(nom: string): string {
  return nom.split(/[\s.]+/).filter(Boolean).slice(0, 2).map((m) => m[0]).join("").toUpperCase();
}

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
  await navigator.clipboard.writeText(url).catch(() => undefined);
}

const RAIS = [0, 1, 2, 3, 4, 5, 6].map((i) => {
  const mid = Math.abs(i - 3);
  return { h: 300 - mid * 54, d: (0.06 * mid).toFixed(2) };
});

const CONFETTI = Array.from({ length: 18 }, (_, i) => ({
  x: ((i * 37 + 11) % 92) + 3,
  s: 5 + ((i * 13) % 4),
  variante: i % 3,
  dur: (3.4 + ((i * 7) % 22) / 10).toFixed(1),
  delai: (((i * 17) % 34) / 10).toFixed(1),
}));

/** Lumière de fond (halo + rais + éclats losange) — entièrement dessinée avec
 * les tokens du thème, jamais un média importé (cf. animations "av-*" dans
 * globals.css). Confinée à la zone héros (position relative + overflow
 * hidden sur le conteneur parent), pas toute la page. */
function LumiereFond() {
  return (
    <>
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(120% 78% at 50% 0%, var(--ds-accent-900), var(--ds-bg) 72%)" }}
      />
      <div className="absolute left-0 right-0 top-0 flex justify-center gap-6 opacity-40 pointer-events-none" style={{ height: 300 }}>
        {RAIS.map((r, i) => (
          <div
            key={i}
            style={{
              width: 2,
              height: r.h,
              transformOrigin: "top",
              background: "linear-gradient(var(--ds-accent-400), transparent)",
              animation: `av-ray 1.1s cubic-bezier(.2,.8,.2,1) ${r.d}s both`,
            }}
          />
        ))}
      </div>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {CONFETTI.map((c, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              left: `${c.x}%`,
              top: -20,
              width: c.s,
              height: c.s,
              transform: "rotate(45deg)",
              borderRadius: 1,
              background:
                c.variante === 0 ? "var(--ds-accent-300)" : c.variante === 1 ? "var(--ds-accent-400)" : "var(--ds-accent-800)",
              animation: `av-fall ${c.dur}s linear ${c.delai}s infinite`,
            }}
          />
        ))}
      </div>
    </>
  );
}

function Entete({ onPartager }: { onPartager: () => void }) {
  return (
    <div className="relative flex items-center justify-between">
      <Link
        href="/accueil"
        className={`flex items-center justify-center w-8 h-8 shrink-0 ${PRESS}`}
        style={{ borderRadius: "var(--ds-radius-md)", background: "color-mix(in srgb, var(--ds-bg) 60%, transparent)", border: "1px solid var(--ds-border)", color: "var(--ds-text)" }}
      >
        <ArrowLeft size={15} strokeWidth={2} />
      </Link>
      <div className="flex items-center gap-1.5 px-3 py-1" style={{ borderRadius: "var(--ds-radius-pill)", border: "1px solid var(--ds-accent-700)" }}>
        <Flag size={11} strokeWidth={2} style={{ color: "var(--ds-accent-300)" }} />
        <span className="text-[10px] tracking-wide whitespace-nowrap" style={{ color: "var(--ds-accent-300)", fontFamily: "var(--ds-font-mono)" }}>TOURNOI TERMINÉ</span>
      </div>
      <button
        type="button"
        onClick={onPartager}
        aria-label="Partager"
        className={`flex items-center justify-center w-8 h-8 shrink-0 ${PRESS}`}
        style={{ borderRadius: "var(--ds-radius-md)", background: "color-mix(in srgb, var(--ds-bg) 60%, transparent)", border: "1px solid var(--ds-border)", color: "var(--ds-text)" }}
      >
        <Share2 size={14} strokeWidth={2} />
      </button>
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

/** Avatar circulaire à halo (1v1) ou écusson hexagonal (Équipes/Battle
 * Royale) surmonté d'une couronne — même géométrie que les badges de palier
 * déjà utilisés ailleurs dans le thème Nocturne. */
function AvatarVainqueur({ nom, photoUrl, hexagone }: { nom: string; photoUrl?: string; hexagone?: boolean }) {
  if (hexagone) {
    return (
      <div className="relative grid place-items-center" style={{ animation: "av-rise .8s cubic-bezier(.2,.8,.2,1) .1s both" }}>
        <div
          className="absolute rounded-full"
          style={{ width: 176, height: 176, background: "radial-gradient(closest-side, color-mix(in srgb, var(--ds-accent) 32%, transparent), transparent)", animation: "av-halo 3.4s ease-in-out infinite" }}
        />
        <div
          className="relative flex items-center justify-center"
          style={{ width: 92, height: 104, background: "linear-gradient(var(--ds-accent-800), var(--ds-accent-900))", border: "1px solid var(--ds-accent)", clipPath: HEX_CLIP, boxShadow: "0 0 42px color-mix(in srgb, var(--ds-accent) 38%, transparent)" }}
        >
          <span style={{ fontFamily: "var(--ds-font-mono)", fontSize: 26, fontWeight: 500, color: "var(--ds-accent-300)" }}>{initiales(nom)}</span>
        </div>
        <div className="absolute flex items-center justify-center rounded-full" style={{ top: -6, width: 30, height: 30, background: "var(--ds-accent-700)", border: "2px solid var(--ds-bg)" }}>
          <Crown size={14} strokeWidth={2} fill="currentColor" style={{ color: "var(--ds-accent-100)" }} />
        </div>
      </div>
    );
  }
  return (
    <div className="relative grid place-items-center" style={{ animation: "av-rise .8s cubic-bezier(.2,.8,.2,1) .1s both" }}>
      <div
        className="absolute rounded-full"
        style={{ width: 190, height: 190, background: "radial-gradient(closest-side, color-mix(in srgb, var(--ds-accent) 34%, transparent), transparent)", animation: "av-halo 3.4s ease-in-out infinite" }}
      />
      <div
        className="relative flex items-center justify-center overflow-hidden"
        style={{ width: 108, height: 108, borderRadius: "var(--ds-radius-pill)", background: "var(--ds-accent-800)", border: "1px solid var(--ds-accent)", boxShadow: "0 0 44px color-mix(in srgb, var(--ds-accent) 40%, transparent)" }}
      >
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt={nom} className="w-full h-full object-cover" />
        ) : (
          <span style={{ fontSize: 32, fontWeight: 500, color: "var(--ds-accent-300)" }}>{initiales(nom)}</span>
        )}
      </div>
      <div
        className="absolute flex items-center justify-center"
        style={{ bottom: -10, width: 40, height: 46, background: "linear-gradient(var(--ds-accent-700), var(--ds-accent-900))", border: "1px solid var(--ds-accent-400)", clipPath: HEX_CLIP }}
      >
        <Crown size={17} strokeWidth={2} fill="currentColor" style={{ color: "var(--ds-accent-100)" }} />
      </div>
    </div>
  );
}

function CarteCashPrize({ montantXof, libelle }: { montantXof: number; libelle: string }) {
  return (
    <div className="relative p-4 overflow-hidden flex items-center gap-3" style={{ borderRadius: "var(--ds-radius-lg)", background: "var(--ds-surface)", boxShadow: "0 0 0 1px var(--ds-accent)" }}>
      <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, transparent, color-mix(in srgb, var(--ds-accent) 18%, transparent), transparent)", animation: "av-sheen 3.2s ease-in-out infinite" }} />
      <Trophy size={26} strokeWidth={2} style={{ position: "relative", color: "var(--ds-accent-300)" }} className="shrink-0" />
      <div className="relative flex-1 min-w-0">
        <div className="text-[9px] tracking-wide uppercase whitespace-nowrap" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>{libelle}</div>
        <div className="mt-0.5 text-2xl leading-none whitespace-nowrap" style={{ fontFamily: "var(--ds-font-mono)", color: "var(--ds-accent-300)" }}>{formatXof(montantXof)}</div>
      </div>
    </div>
  );
}

function BoutonClassement({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className={`h-12 flex items-center justify-center gap-2 text-sm font-medium ${PRESS}`}
      style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-accent)", color: "var(--ds-accent-300)" }}
    >
      <ListOrdered size={17} strokeWidth={2} />
      Voir le classement complet
    </Link>
  );
}

function PiedDeCarte({ meta }: { meta: string }) {
  return (
    <div className="flex items-center gap-2">
      <BadgeCheck size={14} strokeWidth={2} style={{ color: "var(--ds-neutral-500)" }} className="shrink-0" />
      <div className="flex-1 min-w-0 text-[9px] tracking-wide truncate" style={{ color: "var(--ds-neutral-500)", fontFamily: "var(--ds-font-mono)" }}>{meta}</div>
    </div>
  );
}

/** Clôturé mais sans finale exploitable (forfait, bracket incomplet) — pas de
 * vainqueur clair à mettre en scène : message neutre plutôt qu'un nom
 * inventé ou une célébration qui ne correspondrait à rien de réel. */
function SceneIndisponible({ tournoi }: { tournoi: Tournoi }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
      <div className="px-5 pt-[42px]">
        <Entete onPartager={partager} />
        <FilAriane titre={tournoi.titre} droite="TERMINÉ" />
      </div>
      <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
        <Flag size={22} strokeWidth={2} style={{ color: "var(--ds-muted)" }} />
        <p className="text-sm" style={{ color: "var(--ds-text-muted)" }}>
          Ce tournoi est terminé. Le classement final n&apos;est pas encore disponible.
        </p>
      </div>
    </div>
  );
}

function Scene1v1({
  tournoi,
  nomVainqueur,
  nomFinaliste,
  photoVainqueur,
  scoreVainqueur,
  scoreFinaliste,
  nbJoueurs,
  gainVainqueur,
}: {
  tournoi: Tournoi;
  nomVainqueur: string;
  nomFinaliste: string;
  photoVainqueur?: string;
  scoreVainqueur: number;
  scoreFinaliste: number;
  nbJoueurs: number;
  gainVainqueur?: number;
}) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
      <div className="relative overflow-hidden">
        <LumiereFond />
        <div className="relative px-5 pt-[42px] pb-5 flex flex-col gap-6">
          <Entete onPartager={partager} />
          <FilAriane titre={tournoi.titre} droite="FINALE" />

          <div className="flex flex-col items-center">
            <AvatarVainqueur nom={nomVainqueur} photoUrl={photoVainqueur} />
            <div className="mt-6 text-center" style={{ animation: "av-fade 1s cubic-bezier(.2,.8,.2,1) .28s both" }}>
              <div className="text-[10px] tracking-wide uppercase" style={{ color: "var(--ds-accent-300)", fontFamily: "var(--ds-font-mono)" }}>Vainqueur</div>
              <div className="mt-2 text-[40px] leading-tight" style={{ fontFamily: "var(--ds-font-heading)", fontWeight: "var(--ds-heading-weight)" as React.CSSProperties["fontWeight"] }}>{nomVainqueur}</div>
              <div className="mt-1.5 text-[10px] tracking-wide" style={{ color: "var(--ds-neutral-500)", fontFamily: "var(--ds-font-mono)" }}>@{tagDeJoueur(nomVainqueur)} · {tournoi.ville.toUpperCase()}</div>
            </div>
          </div>

          <div style={{ animation: "av-fade 1s cubic-bezier(.2,.8,.2,1) .42s both" }}>
            <div className="p-3.5" style={{ borderRadius: "var(--ds-radius-lg)", background: "var(--ds-surface)", boxShadow: "0 0 0 1px var(--ds-accent-700)" }}>
              <div className="text-center text-[9px] tracking-wide uppercase" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>Score de la finale</div>
              <div className="mt-2.5 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex items-center justify-center shrink-0 rounded-full" style={{ width: 32, height: 32, background: "var(--ds-accent-800)", color: "var(--ds-accent-300)", fontSize: 10, fontWeight: 500 }}>{initiales(nomVainqueur)}</div>
                  <div className="min-w-0">
                    <div className="text-[13px] font-medium truncate">{nomVainqueur}</div>
                    <div className="text-[9px] whitespace-nowrap" style={{ color: "var(--ds-accent-300)", fontFamily: "var(--ds-font-mono)" }}>1ER</div>
                  </div>
                </div>
                <div className="text-[22px] whitespace-nowrap" style={{ fontFamily: "var(--ds-font-mono)" }}>
                  {scoreVainqueur}<span style={{ color: "var(--ds-border-strong)", margin: "0 6px" }}>—</span><span style={{ color: "var(--ds-muted)" }}>{scoreFinaliste}</span>
                </div>
                <div className="flex items-center gap-2.5 min-w-0 justify-end">
                  <div className="min-w-0 text-right">
                    <div className="text-[13px] font-medium truncate">{nomFinaliste}</div>
                    <div className="text-[9px] whitespace-nowrap" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>2E</div>
                  </div>
                  <div className="flex items-center justify-center shrink-0 rounded-full" style={{ width: 32, height: 32, background: "var(--ds-surface-2)", color: "var(--ds-muted)", fontSize: 10, fontWeight: 500 }}>{initiales(nomFinaliste)}</div>
                </div>
              </div>
            </div>
          </div>

          {gainVainqueur !== undefined && gainVainqueur > 0 && (
            <div style={{ animation: "av-fade 1s cubic-bezier(.2,.8,.2,1) .56s both" }}>
              <CarteCashPrize montantXof={gainVainqueur} libelle="Cash prize remporté" />
            </div>
          )}
        </div>
      </div>

      <div className="px-5 flex flex-col gap-2.5" style={{ paddingTop: 14, paddingBottom: 22 }}>
        <BoutonClassement href={`/tournois/${tournoi.id}/bracket`} />
        <PiedDeCarte meta={`${nbJoueurs} JOUEURS · ORGANISÉ PAR ${tournoi.organisateur.toUpperCase()}`} />
      </div>
    </div>
  );
}

function SceneEquipes({
  tournoi,
  nomVainqueur,
  nomFinaliste,
  scoreVainqueur,
  scoreFinaliste,
  nbEquipes,
  gainVainqueur,
}: {
  tournoi: Tournoi;
  nomVainqueur: string;
  nomFinaliste: string;
  scoreVainqueur: number;
  scoreFinaliste: number;
  nbEquipes: number;
  gainVainqueur?: number;
}) {
  const uniteLabel = tournoi.equipeSousType ? LABEL_UNITE_EQUIPE[tournoi.equipeSousType].singulier : undefined;
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
      <div className="relative overflow-hidden">
        <LumiereFond />
        <div className="relative px-5 pt-[42px] pb-5 flex flex-col gap-6">
          <Entete onPartager={partager} />
          <FilAriane titre={tournoi.titre} droite="FINALE" />

          <div className="flex flex-col items-center">
            <AvatarVainqueur nom={nomVainqueur} hexagone />
            <div className="mt-5 text-center" style={{ animation: "av-fade 1s cubic-bezier(.2,.8,.2,1) .28s both" }}>
              <div className="text-[10px] tracking-wide uppercase" style={{ color: "var(--ds-accent-300)", fontFamily: "var(--ds-font-mono)" }}>Équipe vainqueur</div>
              <div className="mt-2 text-[32px] leading-tight" style={{ fontFamily: "var(--ds-font-heading)", fontWeight: "var(--ds-heading-weight)" as React.CSSProperties["fontWeight"] }}>{nomVainqueur}</div>
              <div className="mt-1.5 text-[10px] tracking-wide" style={{ color: "var(--ds-neutral-500)", fontFamily: "var(--ds-font-mono)" }}>
                {[uniteLabel, tournoi.ville.toUpperCase()].filter(Boolean).join(" · ")}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2.5" style={{ animation: "av-fade 1s cubic-bezier(.2,.8,.2,1) .42s both" }}>
            <div className="px-3.5 py-3 flex items-center gap-2.5" style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", boxShadow: "0 0 0 1px var(--ds-accent-700)" }}>
              <div className="shrink-0 text-[9px] tracking-wide uppercase" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>FINALE</div>
              <div className="flex-1 min-w-0 text-[12px] truncate" style={{ color: "color-mix(in srgb, var(--ds-text) 72%, transparent)" }}>contre {nomFinaliste}</div>
              <div className="shrink-0 text-[17px] whitespace-nowrap" style={{ fontFamily: "var(--ds-font-mono)" }}>
                {scoreVainqueur}<span style={{ color: "var(--ds-border-strong)", margin: "0 5px" }}>—</span><span style={{ color: "var(--ds-muted)" }}>{scoreFinaliste}</span>
              </div>
            </div>
            {gainVainqueur !== undefined && gainVainqueur > 0 && <CarteCashPrize montantXof={gainVainqueur} libelle="Cash prize de l'équipe" />}
          </div>
        </div>
      </div>

      <div className="px-5 flex flex-col gap-2.5" style={{ paddingTop: 14, paddingBottom: 22 }}>
        <BoutonClassement href={`/tournois/${tournoi.id}/bracket`} />
        <PiedDeCarte meta={`${nbEquipes} ÉQUIPES · ORGANISÉ PAR ${tournoi.organisateur.toUpperCase()}`} />
      </div>
    </div>
  );
}

function LignePodium({ ligne, rang, prizeXof }: { ligne: LigneClassementBR; rang: number; prizeXof?: number }) {
  const enTete = rang === 1;
  return (
    <div
      className="flex items-center gap-3 px-3 py-2.5"
      style={{ borderRadius: "var(--ds-radius-md)", background: enTete ? "var(--ds-surface)" : "transparent", boxShadow: enTete ? "0 0 0 1px var(--ds-accent)" : "0 0 0 1px var(--ds-border)" }}
    >
      <div
        className="flex items-center justify-center shrink-0"
        style={{ width: 24, height: 28, background: enTete ? "var(--ds-accent-800)" : "var(--ds-surface-2)", border: `1px solid ${enTete ? "var(--ds-accent)" : "var(--ds-border)"}`, clipPath: HEX_CLIP }}
      >
        <span className="text-[10px]" style={{ fontFamily: "var(--ds-font-mono)", color: enTete ? "var(--ds-accent-300)" : "var(--ds-neutral-500)" }}>{rang === 1 ? "1er" : rang === 2 ? "2e" : "3e"}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-medium truncate" style={{ color: enTete ? "var(--ds-text)" : "color-mix(in srgb, var(--ds-text) 74%, transparent)" }}>{ligne.nom}</div>
        <div className="text-[9px] truncate whitespace-nowrap" style={{ color: "var(--ds-neutral-500)", fontFamily: "var(--ds-font-mono)" }}>
          {ligne.manchesJouees} manche{ligne.manchesJouees > 1 ? "s" : ""} jouée{ligne.manchesJouees > 1 ? "s" : ""}
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-[13px] whitespace-nowrap" style={{ fontFamily: "var(--ds-font-mono)", color: enTete ? "var(--ds-accent-300)" : "var(--ds-neutral-500)" }}>{ligne.points} pts</div>
        {prizeXof !== undefined && prizeXof > 0 && (
          <div className="text-[8px] whitespace-nowrap" style={{ color: "var(--ds-neutral-500)", fontFamily: "var(--ds-font-mono)" }}>{formatXof(prizeXof)}</div>
        )}
      </div>
    </div>
  );
}

function SceneBR({
  tournoi,
  classement,
  repartition,
}: {
  tournoi: Tournoi;
  classement: LigneClassementBR[];
  repartition: { label: string; montantXof: number }[];
}) {
  const vainqueur = classement[0];
  const podium = classement.slice(0, 3);
  const manchesJouees = tournoi.manchesPrevues ?? vainqueur.manchesJouees;
  const uniteLabel = LABEL_UNITE_BR[tournoi.brSousType ?? "solo"];
  const gainVainqueur = repartition[0]?.montantXof;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
      <div className="relative overflow-hidden">
        <LumiereFond />
        <div className="relative px-5 pt-[42px] pb-5 flex flex-col gap-5">
          <Entete onPartager={partager} />
          <FilAriane titre={tournoi.titre} droite={`${manchesJouees} MANCHE${manchesJouees > 1 ? "S" : ""}`} />

          <div className="flex flex-col items-center">
            <AvatarVainqueur nom={vainqueur.nom} hexagone />
            <div className="mt-3.5 text-center" style={{ animation: "av-fade 1s cubic-bezier(.2,.8,.2,1) .28s both" }}>
              <div className="text-[10px] tracking-wide uppercase" style={{ color: "var(--ds-accent-300)", fontFamily: "var(--ds-font-mono)" }}>Vainqueur au cumul</div>
              <div className="mt-1.5 text-[28px] leading-tight" style={{ fontFamily: "var(--ds-font-heading)", fontWeight: "var(--ds-heading-weight)" as React.CSSProperties["fontWeight"] }}>{vainqueur.nom}</div>
              <div className="mt-1 text-[10px] tracking-wide" style={{ color: "var(--ds-neutral-500)", fontFamily: "var(--ds-font-mono)" }}>
                {uniteLabel.singulier} · {tournoi.ville.toUpperCase()}
              </div>
            </div>

            <div
              className="mt-3.5 self-stretch px-3.5 py-2.5 flex items-center gap-3"
              style={{ borderRadius: "var(--ds-radius-lg)", background: "var(--ds-surface)", boxShadow: "0 0 0 1px var(--ds-accent)", animation: "av-fade 1s cubic-bezier(.2,.8,.2,1) .42s both" }}
            >
              <Medal size={22} strokeWidth={2} style={{ color: "var(--ds-accent-300)" }} className="shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[9px] tracking-wide uppercase whitespace-nowrap" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>Points cumulés · {manchesJouees} manche{manchesJouees > 1 ? "s" : ""}</div>
                <div className="mt-0.5 text-[26px] leading-none whitespace-nowrap" style={{ fontFamily: "var(--ds-font-mono)", color: "var(--ds-accent-300)" }}>{vainqueur.points} pts</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2" style={{ animation: "av-fade 1s cubic-bezier(.2,.8,.2,1) .5s both" }}>
            <div className="flex items-center gap-2">
              <div className="text-[9px] tracking-wide uppercase whitespace-nowrap" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>Podium</div>
              <div className="flex-1 h-px" style={{ background: "var(--ds-border)" }} />
            </div>
            {podium.map((l, i) => (
              <LignePodium key={l.participantId} ligne={l} rang={i + 1} prizeXof={repartition[i]?.montantXof} />
            ))}
          </div>

          {gainVainqueur !== undefined && gainVainqueur > 0 && (
            <div style={{ animation: "av-fade 1s cubic-bezier(.2,.8,.2,1) .66s both" }}>
              <CarteCashPrize montantXof={gainVainqueur} libelle="Cash prize de l'équipe" />
            </div>
          )}
        </div>
      </div>

      <div className="px-5 flex flex-col gap-2.5" style={{ paddingTop: 14, paddingBottom: 22 }}>
        <BoutonClassement href={`/tournois/${tournoi.id}/battle-royale`} />
        <PiedDeCarte meta={`${classement.length} ${uniteLabel.pluriel} · ORGANISÉ PAR ${tournoi.organisateur.toUpperCase()}`} />
      </div>
    </div>
  );
}

function nomsUniquesDuBracket(matchs: MatchTournoi[]): string[] {
  const noms = new Set<string>();
  for (const m of matchs) {
    if (m.joueur1) noms.add(m.joueur1);
    if (m.joueur2) noms.add(m.joueur2);
  }
  return Array.from(noms);
}

/** Écran affiché à la place de la fiche standard une fois le tournoi
 * `termine` (remplace CtaInscription.tournoiCommence pour tout visiteur —
 * organisateur, inscrit ou simple spectateur, la mise en scène ne dépend pas
 * du rôle). Trois variantes selon `tournoi.type` : 1v1 (score de la finale),
 * Équipes (nom d'équipe, pas de roster — cf. note ci-dessous) et Battle
 * Royale (points cumulés + podium, pas de finale 1 contre 1).
 *
 * Volontairement omis : le roster nominatif des membres d'équipe. Les
 * équipes éphémères (equipes_br) sont supprimées côté serveur dès la
 * clôture (cf. supprimerEquipesDuTournoi dans terminerTournoi()) — impossible
 * de les relire de façon fiable une fois le tournoi terminé, donc pas de
 * liste de membres inventée ; seul le nom d'équipe (stocké directement sur le
 * match/les manches, jamais supprimé) est affiché. */
export function AnnonceVainqueur({ tournoi }: { tournoi: Tournoi }) {
  const [matchs, setMatchs] = useState<MatchTournoi[]>([]);
  const [classementBR, setClassementBR] = useState<LigneClassementBR[]>([]);
  const [pret, setPret] = useState(false);

  useEffect(() => {
    let annule = false;
    async function charger() {
      if (tournoi.type === "battle_royale") {
        const c = await classementCumuleBR(tournoi.id, tournoi.brSousType ?? "solo");
        if (!annule) setClassementBR(c);
      } else {
        const m = await matchsDuTournoi(tournoi.id);
        if (!annule) setMatchs(m);
      }
      if (!annule) setPret(true);
    }
    charger();
    return () => {
      annule = true;
    };
  }, [tournoi.id, tournoi.type, tournoi.brSousType]);

  if (!pret) {
    return <div className="min-h-screen" style={{ background: "var(--ds-bg)" }} />;
  }

  const nbFinalistes = tournoi.repartitionCashPrize?.length ?? 0;
  const cashTotal = cashPrizeAffiche(tournoi);
  const repartition = nbFinalistes > 0 && cashTotal > 0 ? repartitionAutomatique(cashTotal, nbFinalistes) : [];

  if (tournoi.type === "battle_royale") {
    if (classementBR.length === 0 || classementBR[0].points === 0) {
      return <SceneIndisponible tournoi={tournoi} />;
    }
    return <SceneBR tournoi={tournoi} classement={classementBR} repartition={repartition} />;
  }

  const totalRounds = matchs.length > 0 ? Math.max(...matchs.map((m) => m.round)) : 0;
  const finale = matchs.find((m) => m.round === totalRounds && m.position === 0);
  if (!finale || finale.statut !== "termine" || !finale.joueur1 || !finale.joueur2) {
    return <SceneIndisponible tournoi={tournoi} />;
  }

  const s1 = finale.score1 ?? 0;
  const s2 = finale.score2 ?? 0;
  const vainqueurEstJ1 = s1 > s2;
  const nomVainqueur = (vainqueurEstJ1 ? finale.joueur1 : finale.joueur2)!;
  const nomFinaliste = (vainqueurEstJ1 ? finale.joueur2 : finale.joueur1)!;
  const scoreVainqueur = vainqueurEstJ1 ? s1 : s2;
  const scoreFinaliste = vainqueurEstJ1 ? s2 : s1;
  const gainVainqueur = repartition[0]?.montantXof;

  if (tournoi.type === "equipes") {
    return (
      <SceneEquipes
        tournoi={tournoi}
        nomVainqueur={nomVainqueur}
        nomFinaliste={nomFinaliste}
        scoreVainqueur={scoreVainqueur}
        scoreFinaliste={scoreFinaliste}
        nbEquipes={nomsUniquesDuBracket(matchs).length}
        gainVainqueur={gainVainqueur}
      />
    );
  }

  const photoVainqueur = vainqueurEstJ1 ? finale.joueur1PhotoUrl : finale.joueur2PhotoUrl;
  return (
    <Scene1v1
      tournoi={tournoi}
      nomVainqueur={nomVainqueur}
      nomFinaliste={nomFinaliste}
      photoVainqueur={photoVainqueur}
      scoreVainqueur={scoreVainqueur}
      scoreFinaliste={scoreFinaliste}
      nbJoueurs={tournoi.placesInscrites}
      gainVainqueur={gainVainqueur}
    />
  );
}
