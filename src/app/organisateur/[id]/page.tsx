"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, MoreHorizontal, Crown, Clock, Scale, FlagTriangleRight, Lock, CheckCircle2, Users, SlidersHorizontal, MessageSquareText, ListOrdered } from "lucide-react";
import { PRESS } from "@/components/ds/Button";
import { formatXof } from "@/lib/formatXof";
import { tournoiParId, cashPrizeAffiche, cashPrizeEstEstime, commissionEstimee, COMMISSION_PCT, type Tournoi } from "@/lib/mockTournaments";
import { matchsDuTournoi, classementFinalBracket, type MatchTournoi } from "@/lib/mockBracket";
import { manchesBR, classementFinalBR, LABEL_UNITE_BR } from "@/lib/mockBattleRoyale";
import { resumeMouvementsTournoi, type ResumeMouvementsTournoi } from "@/lib/mockWallet";
import { nbLitigesOuvertsTournoi } from "@/lib/mockLitige";
import { messagesChatTournoi } from "@/lib/mockChat";
import { nomOrganisateurActuel } from "@/lib/mockOrganisateur";
import { peutSuperviser } from "@/lib/mockAdjointsOrganisateur";

type NiveauLien = "hot" | "on" | "off";

const SKIN_LIEN: Record<NiveauLien, { iconC: string; labelC: string; stateC: string; op: number }> = {
  hot: { iconC: "var(--ds-accent-300)", labelC: "var(--ds-text)", stateC: "var(--ds-accent-300)", op: 1 },
  on: { iconC: "var(--ds-neutral-500)", labelC: "var(--ds-text)", stateC: "var(--ds-neutral-600)", op: 1 },
  off: { iconC: "var(--ds-neutral-700)", labelC: "var(--ds-neutral-500)", stateC: "var(--ds-neutral-700)", op: 0.6 },
};

function LienAcces({ icon: Icone, label, etat, niveau, href, badge }: { icon: typeof Users; label: string; etat: string; niveau: NiveauLien; href: string; badge?: number }) {
  const s = SKIN_LIEN[niveau];
  return (
    <Link href={href} className={`flex items-center gap-2.5 py-2.5 -mx-1 px-1 ${PRESS}`} style={{ borderBottom: "1px solid var(--ds-neutral-900)", opacity: s.op }}>
      <Icone size={16} strokeWidth={2} style={{ color: s.iconC }} className="shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-[13px] truncate" style={{ color: s.labelC }}>{label}</div>
        <div className="mt-0.5 text-[9px] tracking-wide truncate" style={{ fontFamily: "var(--ds-font-mono)", color: s.stateC }}>{etat}</div>
      </div>
      {badge !== undefined && badge > 0 && (
        <div className="min-w-[18px] h-[18px] px-1 flex items-center justify-center shrink-0" style={{ borderRadius: "var(--ds-radius-pill)", background: "var(--ds-accent-800)", fontFamily: "var(--ds-font-mono)", fontSize: 9, color: "var(--ds-accent-300)" }}>{badge}</div>
      )}
    </Link>
  );
}

function LigneArgent({ label, valeur, accent }: { label: string; valeur: string; accent?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex-1 min-w-0 text-[12px] truncate" style={{ color: "var(--ds-neutral-500)" }}>{label}</div>
      <div className="text-[12px] whitespace-nowrap" style={{ fontFamily: "var(--ds-font-mono)", color: accent ? "var(--ds-accent-300)" : "var(--ds-text)" }}>{valeur}</div>
    </div>
  );
}

function dateHeure(ts: number): string {
  return new Date(ts).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).replace(",", " ·");
}

/**
 * Fiche organisateur — porte d'entrée quand l'organisateur (ou un adjoint
 * accepté) ouvre son propre tournoi, redirigée ici depuis /tournois/[id]
 * (cf. page.tsx de ce dernier). Distincte de la Régie
 * (/organisateur/[id]/gestion, le poste de travail pendant l'événement) :
 * ici pas de mise en scène (pas de cadre stream, pas de carte
 * "organisé par"), un registre — une seule alerte qui dit ce qui attend
 * une décision, l'argent en jeu, puis les accès. Design suivant le mockup
 * "Tourney Fiche Organisateur.dc.html".
 */
export default function FicheOrganisateurPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [pret, setPret] = useState(false);
  const [tournoi, setTournoi] = useState<Tournoi | undefined>(undefined);
  const [autorise, setAutorise] = useState(false);

  const [matches, setMatches] = useState<MatchTournoi[]>([]);
  const [manches, setManches] = useState<Awaited<ReturnType<typeof manchesBR>>>([]);
  const [classementFinal, setClassementFinal] = useState<string[]>([]);
  const [resume, setResume] = useState<ResumeMouvementsTournoi | undefined>(undefined);
  const [litigesOuverts, setLitigesOuverts] = useState(0);
  const [nbMessages, setNbMessages] = useState(0);

  useEffect(() => {
    tournoiParId(params.id).then(async (t) => {
      setTournoi(t);
      setAutorise(Boolean(t) && (await peutSuperviser(t!.organisateur, nomOrganisateurActuel())));
      setPret(true);
    });
  }, [params.id]);

  useEffect(() => {
    if (!tournoi) return;
    const estBR = tournoi.type === "battle_royale";
    if (estBR) manchesBR(tournoi.id).then(setManches);
    else matchsDuTournoi(tournoi.id).then(setMatches);
    if (!tournoi.annule) {
      nbLitigesOuvertsTournoi(tournoi.id).then(setLitigesOuverts);
      messagesChatTournoi(tournoi.id).then((m) => setNbMessages(m.length));
    }
    if (tournoi.termine) {
      resumeMouvementsTournoi(tournoi.id).then(setResume);
      if (estBR) classementFinalBR(tournoi.id, tournoi.brSousType ?? "solo").then(setClassementFinal);
      else classementFinalBracket(tournoi.id).then(setClassementFinal);
    } else if (!tournoi.annule) {
      if (estBR) classementFinalBR(tournoi.id, tournoi.brSousType ?? "solo").then(setClassementFinal);
      else classementFinalBracket(tournoi.id).then(setClassementFinal);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournoi?.id, tournoi?.termine, tournoi?.annule]);

  if (!pret) return null;

  if (!tournoi) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-6 text-center" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
        <p>Tournoi introuvable.</p>
        <Link href="/tournois" style={{ color: "var(--ds-accent-300)" }}>Retour aux tournois</Link>
      </div>
    );
  }

  if (!autorise) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-6 text-center" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
        <p>Cette fiche est réservée à l&apos;organisateur.</p>
        <Link href={`/tournois/${params.id}`} style={{ color: "var(--ds-accent-300)" }}>Retour au tournoi</Link>
      </div>
    );
  }

  const estBR = tournoi.type === "battle_royale";
  const uniteLabel = estBR ? LABEL_UNITE_BR[tournoi.brSousType ?? "solo"] : undefined;
  const matchEnCours = matches.find((m) => m.statut === "en_cours") ?? [...matches].reverse().find((m) => m.statut === "termine");
  const cashPrize = cashPrizeAffiche(tournoi);
  const estime = cashPrizeEstEstime(tournoi);
  const fraisCollectes = tournoi.fraisXof * tournoi.placesInscrites;
  const cloturePret = estBR
    ? manches.length > 0 && manches.length >= (tournoi.manchesPrevues ?? 1)
    : classementFinal.length > 0;
  const commissionActive = Boolean(tournoi.commissionActivee) && tournoi.fraisXof > 0;

  const pill = tournoi.annule
    ? { texte: "ANNULÉ", pulse: false }
    : tournoi.termine
      ? { texte: "TERMINÉ", pulse: false }
      : tournoi.enDirect
        ? { texte: "EN DIRECT", pulse: true }
        : { texte: "INSCRIPTIONS OUVERTES", pulse: false };

  // ---------- alerte (une seule, la plus urgente) ----------
  let alerte: { kicker: string; accent: boolean; headline?: string; body: string; cta?: string; ctaHref?: string; ctaIcon?: typeof Scale };
  if (tournoi.annule) {
    alerte = { kicker: "Tournoi annulé", accent: false, body: "Les inscrits payants ont été remboursés automatiquement depuis le séquestre." };
  } else if (tournoi.termine) {
    alerte = {
      kicker: "Tournoi clôturé", accent: false,
      headline: classementFinal[0] ? `Vainqueur · ${classementFinal[0]}` : undefined,
      body: "Points attribués et gains versés. Les scores sont verrouillés : un litige ouvert maintenant passe par l'administration.",
      cta: "Voir le classement final", ctaHref: estBR ? `/tournois/${tournoi.id}/battle-royale` : `/tournois/${tournoi.id}/bracket`, ctaIcon: ListOrdered,
    };
  } else if (litigesOuverts > 0) {
    alerte = {
      kicker: "Ça attend ta décision", accent: true,
      headline: `${litigesOuverts} litige${litigesOuverts > 1 ? "s" : ""} ouvert${litigesOuverts > 1 ? "s" : ""}`,
      body: "Tant que tu ne tranches pas, le tour concerné peut rester bloqué.",
      cta: "Trancher le litige", ctaHref: estBR ? `/tournois/${tournoi.id}/battle-royale` : `/tournois/${tournoi.id}/bracket`, ctaIcon: Scale,
    };
  } else if (cloturePret) {
    alerte = {
      kicker: "Clôture disponible", accent: true,
      headline: estBR ? "Toutes les manches sont saisies" : "Le bracket est terminé",
      body: cashPrize > 0 ? `La clôture attribue les points et verse ${formatXof(cashPrize)} depuis le séquestre. Elle est définitive.` : "La clôture attribue les points de classement. Elle est définitive.",
      cta: "Clôturer le tournoi", ctaHref: `/organisateur/${tournoi.id}/cloture`, ctaIcon: FlagTriangleRight,
    };
  } else {
    alerte = {
      kicker: "Rien à décider", accent: false,
      body: tournoi.enDirect
        ? "Le tournoi est en cours, aucune action n'attend ta décision pour l'instant."
        : `Le check-in ouvre à ${tournoi.checkin}. D'ici là, tu peux encore régler le stream et compléter les infos du tournoi.`,
    };
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
      <div className="px-5 pt-[42px] pb-3.5" style={{ borderBottom: "1px solid var(--ds-border)" }}>
        <div className="flex items-center justify-between">
          <button type="button" onClick={() => router.push("/organisateur")} className={`flex items-center justify-center w-8 h-8 shrink-0 ${PRESS}`} style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-border)", color: "var(--ds-neutral-500)" }}>
            <ArrowLeft size={15} strokeWidth={2} />
          </button>
          <div className="flex items-center gap-1.5 px-2.5 py-1" style={{ borderRadius: "var(--ds-radius-pill)", border: `1px solid ${tournoi.enDirect ? "var(--ds-accent)" : "var(--ds-border)"}` }}>
            {pill.pulse && <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--ds-accent-400)" }} />}
            <span className="text-[9px] tracking-wide whitespace-nowrap" style={{ color: tournoi.enDirect ? "var(--ds-accent-300)" : "var(--ds-neutral-500)", fontFamily: "var(--ds-font-mono)" }}>{pill.texte}</span>
          </div>
          <Link href={`/organisateur/${tournoi.id}/parametres`} className={`flex items-center justify-center w-8 h-8 shrink-0 ${PRESS}`} style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-border)", color: "var(--ds-neutral-500)" }}>
            <MoreHorizontal size={15} strokeWidth={2} />
          </Link>
        </div>

        <div className="mt-3 flex items-center gap-1.5">
          <Crown size={12} strokeWidth={2} style={{ color: "var(--ds-accent-400)" }} />
          <span className="text-[9px] tracking-wide uppercase" style={{ color: "var(--ds-accent-300)", fontFamily: "var(--ds-font-mono)" }}>Ton tournoi</span>
        </div>
        <div className="mt-1 text-xl leading-tight" style={{ fontFamily: "var(--ds-font-heading)", fontWeight: "var(--ds-heading-weight)" as React.CSSProperties["fontWeight"], color: tournoi.termine || tournoi.annule ? "var(--ds-text-muted)" : "var(--ds-text)" }}>
          {tournoi.titre}
        </div>
        <div className="mt-1.5 flex flex-col gap-0.5">
          <div className="text-[10px] tracking-wide uppercase truncate" style={{ color: "var(--ds-neutral-600)", fontFamily: "var(--ds-font-mono)" }}>{tournoi.jeuLabel} · {tournoi.format}</div>
          <div className="text-[10px] tracking-wide uppercase truncate" style={{ color: "var(--ds-neutral-600)", fontFamily: "var(--ds-font-mono)" }}>
            {tournoi.enDirect && !tournoi.termine && matchEnCours ? `Dernier match · ${matchEnCours.joueur1} ${matchEnCours.score1 ?? 0}—${matchEnCours.score2 ?? 0} ${matchEnCours.joueur2}` : tournoi.termine && tournoi.termineLe ? `Clôturé le ${dateHeure(tournoi.termineLe)}` : `${tournoi.dateLabel} · ${tournoi.ville || "en ligne"}`}
          </div>
        </div>
      </div>

      <div className="px-5 pt-3.5 flex-1 flex flex-col gap-2.5">
        <div className="p-3.5" style={{ borderRadius: "var(--ds-radius-lg)", background: alerte.accent ? "linear-gradient(var(--ds-accent-900), var(--ds-surface))" : "var(--ds-surface)", boxShadow: alerte.accent ? "0 0 0 1px var(--ds-accent)" : "var(--ds-shadow-sm)" }}>
          <div className="flex items-center gap-2">
            {alerte.accent && <span className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0" style={{ background: "var(--ds-accent-400)" }} />}
            {!alerte.accent && (tournoi.termine || tournoi.annule ? <Lock size={14} strokeWidth={2} style={{ color: "var(--ds-neutral-500)" }} className="shrink-0" /> : <Clock size={14} strokeWidth={2} style={{ color: "var(--ds-neutral-500)" }} className="shrink-0" />)}
            <div className="flex-1 text-[10px] tracking-wide uppercase truncate" style={{ color: alerte.accent ? "var(--ds-accent-300)" : "var(--ds-neutral-500)", fontFamily: "var(--ds-font-mono)" }}>{alerte.kicker}</div>
          </div>
          {alerte.headline && <div className="mt-2 text-[15px] font-medium leading-tight">{alerte.headline}</div>}
          <p className="mt-1.5 text-[12px] leading-relaxed" style={{ color: "color-mix(in srgb, var(--ds-text) 56%, transparent)" }}>{alerte.body}</p>
          {alerte.cta && alerte.ctaHref && (
            <Link href={alerte.ctaHref} className={`mt-3 h-10 flex items-center justify-center gap-2 text-sm font-medium ${PRESS}`} style={{ borderRadius: "var(--ds-radius-md)", border: `1px solid ${alerte.accent ? "var(--ds-accent)" : "var(--ds-border)"}`, color: alerte.accent ? "var(--ds-accent-300)" : "var(--ds-neutral-500)" }}>
              {alerte.ctaIcon && <alerte.ctaIcon size={16} strokeWidth={2} />}
              {alerte.cta}
            </Link>
          )}
        </div>

        <div className="p-3" style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", boxShadow: "var(--ds-shadow-sm)" }}>
          <div className="flex items-baseline gap-2">
            <div className="text-lg" style={{ fontFamily: "var(--ds-font-mono)", color: tournoi.annule ? "var(--ds-text-muted)" : "var(--ds-text)" }}>
              {estBR ? `${tournoi.placesInscrites} / ${tournoi.placesTotal}` : `${tournoi.placesInscrites} / ${tournoi.placesTotal}`}
            </div>
            <div className="flex-1 text-xs" style={{ color: "var(--ds-neutral-500)" }}>{estBR ? uniteLabel!.pluriel.toLowerCase() : "inscrits"}</div>
            <div className="text-[9px]" style={{ fontFamily: "var(--ds-font-mono)", color: "var(--ds-neutral-600)" }}>
              {tournoi.annule ? "ANNULÉ" : tournoi.termine ? "ARCHIVÉ" : tournoi.placesInscrites >= tournoi.placesTotal ? "COMPLET" : `${tournoi.placesTotal - tournoi.placesInscrites} PLACES`}
            </div>
          </div>
          <div className="mt-2 h-[3px] rounded-full overflow-hidden" style={{ background: "var(--ds-surface-2)" }}>
            <div className="h-[3px] rounded-full" style={{ width: `${tournoi.placesTotal > 0 ? Math.min(100, (tournoi.placesInscrites / tournoi.placesTotal) * 100) : 0}%`, background: tournoi.termine || tournoi.annule ? "var(--ds-neutral-700)" : "linear-gradient(90deg, var(--ds-accent-700), var(--ds-accent-400))" }} />
          </div>
        </div>

        <div className="p-3" style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", boxShadow: "var(--ds-shadow-sm)" }}>
          <div className="text-[10px] tracking-wide uppercase" style={{ color: "var(--ds-neutral-600)", fontFamily: "var(--ds-font-mono)" }}>{tournoi.termine ? "Bilan" : "Argent en jeu"}</div>
          <div className="mt-2.5 flex flex-col gap-1.5">
            {tournoi.termine ? (
              <>
                <LigneArgent label="Frais collectés" valeur={formatXof(fraisCollectes)} />
                {cashPrize > 0 && <LigneArgent label="Cash prize versé" valeur={formatXof(resume?.gainsXof ?? cashPrize)} accent />}
                {commissionActive && <LigneArgent label={`Ta commission · ${Math.round(COMMISSION_PCT * 100)} %`} valeur={formatXof(resume?.commissionXof ?? commissionEstimee(tournoi.fraisXof, tournoi.placesInscrites))} accent />}
              </>
            ) : (
              <>
                <LigneArgent label="Frais d'inscription" valeur={tournoi.fraisXof > 0 ? formatXof(tournoi.fraisXof) : "Gratuit"} />
                {tournoi.fraisXof > 0 && <LigneArgent label="Frais collectés" valeur={formatXof(fraisCollectes)} accent />}
                <LigneArgent label={estime ? "Cash prize engagé · estimé" : "Cash prize engagé"} valeur={cashPrize > 0 ? formatXof(cashPrize) : "Aucun"} accent={cashPrize > 0} />
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col">
          <LienAcces icon={Users} label="Liste des inscrits" href={`/tournois/${tournoi.id}/inscrits`} niveau={tournoi.annule ? "off" : "on"} etat={tournoi.annule ? "ARCHIVÉE" : `${tournoi.placesInscrites} JOUEUR${tournoi.placesInscrites > 1 ? "S" : ""}`} />
          <LienAcces icon={SlidersHorizontal} label="Réglages du tournoi" href={`/organisateur/${tournoi.id}/parametres`} niveau={tournoi.termine || tournoi.annule ? "off" : "on"} etat={tournoi.termine || tournoi.annule ? "VERROUILLÉS" : tournoi.enDirect ? "FRAIS VERROUILLÉS EN DIRECT" : "FORMAT · FRAIS · STREAM"} />
          <LienAcces icon={MessageSquareText} label="Chat du tournoi" href={`/tournois/${tournoi.id}/chat`} niveau={tournoi.annule ? "off" : "on"} etat={tournoi.annule ? "FERMÉ" : `${nbMessages} MESSAGE${nbMessages > 1 ? "S" : ""}`} />
          <LienAcces icon={Scale} label="Litiges" href={estBR ? `/tournois/${tournoi.id}/battle-royale` : `/tournois/${tournoi.id}/bracket`} niveau={litigesOuverts > 0 ? "hot" : "off"} etat={litigesOuverts > 0 ? `${litigesOuverts} OUVERT${litigesOuverts > 1 ? "S" : ""}` : "AUCUN"} badge={litigesOuverts > 0 ? litigesOuverts : undefined} />
        </div>
      </div>

      <div className="px-5 pt-2 pb-6" style={{ borderTop: "1px solid var(--ds-border)" }}>
        <Link
          href={`/organisateur/${tournoi.id}/gestion`}
          className={`mt-3 h-[50px] flex items-center justify-center gap-2.5 text-[15px] font-medium ${PRESS}`}
          style={{ borderRadius: "var(--ds-radius-md)", border: `1px solid ${alerte.accent ? "var(--ds-accent)" : "var(--ds-border)"}`, color: alerte.accent ? "var(--ds-accent-300)" : "var(--ds-neutral-500)" }}
        >
          <SlidersHorizontal size={18} strokeWidth={2} />
          {tournoi.termine ? "Régie · lecture seule" : "Régie du tournoi"}
        </Link>
        <div className="mt-2.5 flex items-center gap-2">
          <CheckCircle2 size={13} strokeWidth={2} style={{ color: "var(--ds-neutral-600)" }} className="shrink-0" />
          <div className="flex-1 min-w-0 text-[9px] tracking-wide truncate" style={{ color: "var(--ds-neutral-600)", fontFamily: "var(--ds-font-mono)" }}>
            {tournoi.annule ? "TOURNOI ANNULÉ" : tournoi.termine ? "COMMISSION CRÉDITÉE SUR TON SOLDE" : `CODE ${tournoi.code}`}
          </div>
        </div>
      </div>
    </div>
  );
}
