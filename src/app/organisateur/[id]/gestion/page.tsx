"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Share2,
  Clock,
  Radio,
  Flag,
  UserCheck,
  Pencil,
  GitBranch,
  DoorOpen,
  MessagesSquare,
  CheckCircle2,
  XCircle,
  ListChecks,
  ListOrdered,
  Receipt,
  Info,
  Lock,
  Copy,
} from "lucide-react";
import { PRESS } from "@/components/ds/Button";
import { formatXof } from "@/lib/formatXof";
import {
  tournoiParId,
  inscriptionsFermees,
  cashPrizeAffiche,
  cashPrizeEstEstime,
  type Tournoi,
} from "@/lib/mockTournaments";
import { matchsDuTournoi, classementFinalBracket, libelleRound, codeRound, spectateursDerives, type MatchTournoi } from "@/lib/mockBracket";
import { useRealtimeRefetch } from "@/hooks/useRealtimeRefetch";
import {
  manchesBR,
  mancheEnCoursBR,
  unitesBR,
  classementFinalBR,
  LABEL_UNITE_BR,
  type MancheBR,
  type UniteBR,
  type ResultatManche,
} from "@/lib/mockBattleRoyale";
import { presentsDuTournoi } from "@/lib/mockCheckin";
import { infosRoomDuTournoi, type InfosRoom } from "@/lib/mockRoomInfo";
import { resumeMouvementsTournoi, type ResumeMouvementsTournoi } from "@/lib/mockWallet";
import { derniereDemandeAnnulation, type DemandeAnnulation } from "@/lib/mockDemandesAnnulation";
import { nomOrganisateurActuel } from "@/lib/mockOrganisateur";
import { peutSuperviser } from "@/lib/mockAdjointsOrganisateur";

type NiveauTuile = "hot" | "on" | "soon" | "off";

const SKIN_TUILE: Record<NiveauTuile, { bg: string; ring: string; iconC: string; labelC: string; stateC: string; op: number }> = {
  hot: { bg: "var(--ds-surface)", ring: "0 0 0 1px var(--ds-accent)", iconC: "var(--ds-accent-300)", labelC: "var(--ds-text)", stateC: "var(--ds-accent-300)", op: 1 },
  on: { bg: "var(--ds-surface)", ring: "var(--ds-shadow-sm)", iconC: "var(--ds-neutral-500)", labelC: "var(--ds-text)", stateC: "var(--ds-neutral-500)", op: 1 },
  soon: { bg: "transparent", ring: "0 0 0 1px var(--ds-border)", iconC: "var(--ds-neutral-600)", labelC: "var(--ds-muted)", stateC: "var(--ds-neutral-600)", op: 1 },
  off: { bg: "transparent", ring: "0 0 0 1px var(--ds-border)", iconC: "var(--ds-neutral-600)", labelC: "var(--ds-muted)", stateC: "var(--ds-neutral-600)", op: 0.6 },
};

function heureCourte(ts: number): string {
  const jour = new Date(ts).toLocaleDateString("fr-FR", { weekday: "short" }).replace(".", "").toUpperCase();
  const heure = new Date(ts).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  return `${jour}. ${heure}`;
}

function dateLongue(ts: number): string {
  return new Date(ts).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

async function partager(titre: string) {
  const url = window.location.href;
  if (navigator.share) {
    try {
      await navigator.share({ url, title: titre });
      return;
    } catch {
      // annulé ou indisponible : on retombe sur la copie
    }
  }
  await navigator.clipboard.writeText(url).catch(() => undefined);
}

function Kpi({ valeur, label, accent }: { valeur: string; label: string; accent?: boolean }) {
  return (
    <div className="p-2.5" style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", boxShadow: "var(--ds-shadow-sm)" }}>
      <div className="text-sm whitespace-nowrap truncate" style={{ fontFamily: "var(--ds-font-mono)", color: accent ? "var(--ds-accent-300)" : "var(--ds-text)" }}>{valeur}</div>
      <div className="mt-0.5 text-[10px] truncate" style={{ color: "var(--ds-neutral-600)" }}>{label}</div>
    </div>
  );
}

function Tuile({ icon: Icone, label, etat, niveau, href, badge }: { icon: typeof GitBranch; label: string; etat: string; niveau: NiveauTuile; href: string; badge?: number }) {
  const s = SKIN_TUILE[niveau];
  return (
    <Link href={href} className={`p-2.5 block ${PRESS}`} style={{ borderRadius: "var(--ds-radius-md)", background: s.bg, boxShadow: s.ring, opacity: s.op }}>
      <div className="flex items-center gap-2">
        <Icone size={16} strokeWidth={2} style={{ color: s.iconC }} className="shrink-0" />
        <div className="flex-1 min-w-0 text-[13px] font-medium truncate" style={{ color: s.labelC }}>{label}</div>
        {badge !== undefined && badge > 0 && (
          <div className="min-w-[18px] h-[18px] px-1 flex items-center justify-center shrink-0" style={{ borderRadius: "var(--ds-radius-pill)", background: "var(--ds-accent-800)", fontFamily: "var(--ds-font-mono)", fontSize: 9, color: "var(--ds-accent-300)" }}>{badge}</div>
        )}
      </div>
      <div className="mt-1.5 text-[9px] tracking-wide truncate" style={{ fontFamily: "var(--ds-font-mono)", color: s.stateC }}>{etat}</div>
    </Link>
  );
}

function CarteEtat({ children, accent = false, pad = 13 }: { children: React.ReactNode; accent?: boolean; pad?: number }) {
  return (
    <div
      className="flex flex-col"
      style={{
        padding: pad,
        borderRadius: "var(--ds-radius-lg)",
        background: accent ? "linear-gradient(var(--ds-accent-900), var(--ds-surface))" : "var(--ds-surface)",
        boxShadow: accent ? "0 0 0 1px var(--ds-accent)" : "var(--ds-shadow-sm)",
      }}
    >
      {children}
    </div>
  );
}

function BarreProgression({ label, valeur, pourcentage }: { label: string; valeur: string; pourcentage: number }) {
  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-1.5">
        <div className="text-[11px]" style={{ color: "var(--ds-neutral-500)" }}>{label}</div>
        <div className="text-[10px]" style={{ fontFamily: "var(--ds-font-mono)", color: "var(--ds-accent-300)" }}>{valeur}</div>
      </div>
      <div className="h-[3px] rounded-full overflow-hidden" style={{ background: "var(--ds-surface-2)" }}>
        <div className="h-[3px] rounded-full" style={{ width: `${Math.min(100, Math.max(0, pourcentage))}%`, background: "linear-gradient(90deg, var(--ds-accent-700), var(--ds-accent-400))" }} />
      </div>
    </div>
  );
}

export default function GestionTournoiPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [pret, setPret] = useState(false);
  const [tournoi, setTournoi] = useState<Tournoi | undefined>(undefined);
  const [autorise, setAutorise] = useState(false);

  const [matches, setMatches] = useState<MatchTournoi[]>([]);
  const [manches, setManches] = useState<MancheBR[]>([]);
  const [mancheEnCours, setMancheEnCours] = useState<ResultatManche[]>([]);
  const [unites, setUnites] = useState<UniteBR[]>([]);
  const [presents, setPresents] = useState<string[]>([]);
  const [room, setRoom] = useState<InfosRoom | undefined>(undefined);
  const [classementFinal, setClassementFinal] = useState<string[]>([]);
  const [resume, setResume] = useState<ResumeMouvementsTournoi | undefined>(undefined);
  const [demande, setDemande] = useState<DemandeAnnulation | undefined>(undefined);
  const [codeCopie, setCodeCopie] = useState(false);
  const [maintenant, setMaintenant] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setMaintenant(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    tournoiParId(params.id).then(async (t) => {
      setTournoi(t);
      setAutorise(Boolean(t) && (await peutSuperviser(t!.organisateur, nomOrganisateurActuel())));
      setPret(true);
    });
  }, [params.id]);

  useEffect(() => {
    if (!tournoi) return;
    if (tournoi.type === "battle_royale") {
      manchesBR(tournoi.id).then(setManches);
      unitesBR(tournoi.id, tournoi.brSousType ?? "solo").then(setUnites);
      if (!tournoi.termine && !tournoi.annule) mancheEnCoursBR(tournoi.id).then(setMancheEnCours);
    } else {
      matchsDuTournoi(tournoi.id).then(setMatches);
    }
    if (tournoi.checkinTs !== undefined && Date.now() >= tournoi.checkinTs) presentsDuTournoi(tournoi.id).then(setPresents);
    if (inscriptionsFermees(tournoi)) infosRoomDuTournoi(tournoi.id).then(setRoom);
    if (tournoi.termine) {
      if (tournoi.type === "battle_royale") classementFinalBR(tournoi.id, tournoi.brSousType ?? "solo").then(setClassementFinal);
      else classementFinalBracket(tournoi.id).then(setClassementFinal);
      resumeMouvementsTournoi(tournoi.id).then(setResume);
    }
    if (tournoi.annule) {
      resumeMouvementsTournoi(tournoi.id).then(setResume);
      derniereDemandeAnnulation(tournoi.id).then(setDemande);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournoi?.id, tournoi?.termine, tournoi?.annule]);

  // Poste de travail pendant l'événement : jusqu'ici chargé une seule fois
  // au montage, sans aucun rafraîchissement — un organisateur resté sur
  // cette page ne voyait jamais un score saisi depuis un autre appareil
  // (adjoint) tant qu'il ne rechargeait pas manuellement.
  useRealtimeRefetch(
    [{ table: "tournois", filter: `id=eq.${params.id}`, event: "UPDATE" }],
    () => { tournoiParId(params.id).then((t) => t && setTournoi(t)); },
  );
  useRealtimeRefetch(
    tournoi && tournoi.type !== "battle_royale" ? [{ table: "matches", filter: `tournoi_id=eq.${params.id}`, event: "*" }] : [],
    () => { matchsDuTournoi(params.id).then(setMatches); },
  );
  useRealtimeRefetch(
    tournoi && tournoi.type === "battle_royale" ? [{ table: "manche_br_en_cours", filter: `tournoi_id=eq.${params.id}` }, { table: "manches_br", filter: `tournoi_id=eq.${params.id}` }] : [],
    () => {
      if (!tournoi) return;
      mancheEnCoursBR(tournoi.id).then(setMancheEnCours);
      manchesBR(tournoi.id).then(setManches);
    },
  );

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
        <p>Cette page est réservée aux organisateurs.</p>
        <Link href={`/tournois/${params.id}`} style={{ color: "var(--ds-accent-300)" }}>Retour au tournoi</Link>
      </div>
    );
  }

  const estBR = tournoi.type === "battle_royale";
  const uniteLabel = estBR ? LABEL_UNITE_BR[tournoi.brSousType ?? "solo"] : undefined;
  const totalRounds = matches.length > 0 ? Math.max(...matches.map((m) => m.round)) : 0;
  const matchEnCours = matches.find((m) => m.statut === "en_cours");
  const roundActuel = matchEnCours ? libelleRound(matchEnCours.round, totalRounds).toUpperCase() : undefined;
  const matchsEnAttente = matches.filter((m) => m.statut !== "termine" && m.joueur1 && m.joueur2);
  const cashPrize = cashPrizeAffiche(tournoi);
  const estime = cashPrizeEstEstime(tournoi);
  const spectateurs = spectateursDerives(tournoi.id);
  const checkinOuvert = tournoi.checkinTs !== undefined && maintenant >= tournoi.checkinTs;

  // ---------- en-tête ----------
  const pill = tournoi.annule
    ? { texte: "ANNULÉ", pulse: false }
    : tournoi.termine
      ? { texte: "TERMINÉ", pulse: false }
      : tournoi.enDirect
        ? { texte: "EN DIRECT", pulse: true }
        : { texte: "À VENIR", pulse: false };
  const headerFlat = tournoi.termine || tournoi.annule;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--ds-bg)", color: tournoi.annule ? "var(--ds-text-muted)" : "var(--ds-text)" }}>
      <div
        className="relative px-5 pt-[42px] pb-4"
        style={headerFlat ? { background: "var(--ds-bg)" } : { background: `radial-gradient(${tournoi.enDirect ? "135% 150%" : "130% 130%"} at 50% 0%, var(--ds-accent-900) 0%, var(--ds-bg) ${tournoi.enDirect ? "74%" : "82%"})` }}
      >
        <div className="relative flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className={`flex items-center justify-center w-8 h-8 shrink-0 ${PRESS}`}
            style={{ borderRadius: "var(--ds-radius-md)", background: "color-mix(in srgb, var(--ds-bg) 60%, transparent)", border: "1px solid var(--ds-border)", color: "var(--ds-text)" }}
          >
            <ArrowLeft size={15} strokeWidth={2} />
          </button>
          <div className="flex items-center gap-1.5 px-3 py-1" style={{ borderRadius: "var(--ds-radius-pill)", border: `1px solid ${tournoi.enDirect ? "var(--ds-accent)" : "var(--ds-border)"}` }}>
            {pill.pulse && <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--ds-accent-400)" }} />}
            <span className="text-[10px] tracking-wide whitespace-nowrap" style={{ color: tournoi.enDirect ? "var(--ds-accent-300)" : "var(--ds-neutral-500)", fontFamily: "var(--ds-font-mono)" }}>{pill.texte}</span>
          </div>
          <button
            type="button"
            onClick={() => partager(tournoi.titre)}
            className={`flex items-center justify-center w-8 h-8 shrink-0 ${PRESS}`}
            style={{ borderRadius: "var(--ds-radius-md)", background: "color-mix(in srgb, var(--ds-bg) 60%, transparent)", border: "1px solid var(--ds-border)", color: "var(--ds-text)" }}
          >
            <Share2 size={14} strokeWidth={2} />
          </button>
        </div>

        <div className="mt-3.5">
          <div className="text-[9px] tracking-wide uppercase" style={{ color: "var(--ds-accent-300)", fontFamily: "var(--ds-font-mono)" }}>Régie du tournoi</div>
          <div className="mt-1 text-[21px] leading-tight" style={{ fontFamily: "var(--ds-font-heading)", fontWeight: "var(--ds-heading-weight)" as React.CSSProperties["fontWeight"], color: tournoi.annule ? "var(--ds-text-muted)" : "var(--ds-text)" }}>{tournoi.titre}</div>
          <div className="mt-1 text-[9px] tracking-wide uppercase truncate" style={{ color: "var(--ds-neutral-600)", fontFamily: "var(--ds-font-mono)" }}>
            {tournoi.jeuLabel} · {roundActuel && tournoi.enDirect ? roundActuel : tournoi.format} · {tournoi.code}
          </div>
        </div>
      </div>

      <div className="px-5 pb-3 grid grid-cols-3 gap-1.5">
        {tournoi.annule ? (
          <>
            <Kpi valeur={String(resume?.remboursementsCount ?? 0)} label="remboursés" />
            <Kpi valeur={formatXof(resume?.remboursementsXof ?? 0)} label="rendu" accent />
            <Kpi valeur={String(tournoi.placesInscrites)} label="inscrits" />
          </>
        ) : tournoi.termine ? (
          <>
            <Kpi valeur={String(tournoi.placesInscrites)} label={estBR ? uniteLabel!.pluriel.toLowerCase() : "joueurs"} />
            <Kpi valeur={cashPrize > 0 ? formatXof(resume?.gainsXof ?? cashPrize) : "Gratuit"} label="versé" accent={cashPrize > 0} />
            <Kpi valeur={estBR ? `${tournoi.manchesPrevues ?? manches.length} / ${tournoi.manchesPrevues ?? manches.length}` : `${matches.filter((m) => m.statut === "termine").length} / ${matches.length}`} label="manches/matchs" />
          </>
        ) : estBR ? (
          <>
            <Kpi valeur={`${unites.length} / ${tournoi.placesTotal}`} label={uniteLabel!.pluriel.toLowerCase()} />
            <Kpi valeur={cashPrize > 0 ? formatXof(cashPrize) : "Gratuit"} label={estime ? "estimé" : "cash prize"} accent={cashPrize > 0} />
            <Kpi valeur={`${manches.length} / ${tournoi.manchesPrevues ?? 1}`} label="manches" accent />
          </>
        ) : tournoi.enDirect ? (
          <>
            <Kpi valeur={`${tournoi.placesInscrites} / ${tournoi.placesTotal}`} label="inscrits" />
            <Kpi valeur={cashPrize > 0 ? formatXof(cashPrize) : "Gratuit"} label="cash prize" accent={cashPrize > 0} />
            <Kpi valeur={String(matchsEnAttente.length)} label="à saisir" accent={matchsEnAttente.length > 0} />
          </>
        ) : (
          <>
            <Kpi valeur={`${tournoi.placesInscrites} / ${tournoi.placesTotal}`} label="inscrits" />
            <Kpi valeur={cashPrize > 0 ? formatXof(cashPrize) : "Gratuit"} label={estime ? "estimé" : "cash prize"} accent={cashPrize > 0} />
            <Kpi valeur={heureCourte(tournoi.debutTournoiTs ?? maintenant)} label="début" />
          </>
        )}
      </div>

      <div className="px-5 pb-3">
        {tournoi.annule ? (
          <CarteEtat>
            <div className="flex items-center gap-2">
              <XCircle size={15} strokeWidth={2} style={{ color: "var(--ds-neutral-500)" }} className="shrink-0" />
              <div className="flex-1 text-[10px] tracking-wide uppercase" style={{ color: "var(--ds-neutral-500)", fontFamily: "var(--ds-font-mono)" }}>Tournoi annulé</div>
            </div>
            <div className="mt-2.5 text-lg font-medium" style={{ fontFamily: "var(--ds-font-heading)", color: "var(--ds-text-muted)" }}>
              {resume && resume.remboursementsCount > 0 ? "Inscrits remboursés" : "Aucun remboursement nécessaire"}
            </div>
            <p className="mt-2 text-[12px] leading-relaxed" style={{ color: "color-mix(in srgb, var(--ds-text) 52%, transparent)" }}>
              {resume && resume.remboursementsCount > 0
                ? `${resume.remboursementsCount} inscription${resume.remboursementsCount > 1 ? "s" : ""} remboursée${resume.remboursementsCount > 1 ? "s" : ""} automatiquement, ${formatXof(Math.round(resume.remboursementsXof / resume.remboursementsCount))} chacune.`
                : "Ce tournoi était gratuit ou n'avait aucun inscrit au moment de l'annulation."}
              {demande?.motif ? ` Motif transmis : ${demande.motif}` : ""}
            </p>
          </CarteEtat>
        ) : tournoi.termine ? (
          <CarteEtat accent={cashPrize > 0}>
            <div className="flex items-center gap-2">
              <Lock size={15} strokeWidth={2} style={{ color: "var(--ds-neutral-500)" }} className="shrink-0" />
              <div className="flex-1 text-[10px] tracking-wide uppercase" style={{ color: "var(--ds-neutral-500)", fontFamily: "var(--ds-font-mono)" }}>Tournoi clôturé</div>
            </div>
            {classementFinal[0] && (
              <div className="mt-2.5 text-xl font-medium" style={{ fontFamily: "var(--ds-font-heading)" }}>{classementFinal[0]}</div>
            )}
            <p className="mt-2 text-[12px] leading-relaxed" style={{ color: "color-mix(in srgb, var(--ds-text) 56%, transparent)" }}>
              {cashPrize > 0
                ? "Points attribués et cash prize crédité directement sur le compte du/des vainqueur(s). Les scores sont verrouillés."
                : "Points attribués, scores verrouillés."}
            </p>
            <Link
              href={estBR ? `/tournois/${tournoi.id}/battle-royale` : `/tournois/${tournoi.id}/bracket`}
              className={`mt-3 h-11 flex items-center justify-center gap-2 text-sm font-medium ${PRESS}`}
              style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-accent)", color: "var(--ds-accent-300)" }}
            >
              <ListOrdered size={16} strokeWidth={2} />
              Voir le classement final
            </Link>
          </CarteEtat>
        ) : estBR ? (
          mancheEnCours.length > 0 ? (
            <CarteEtat accent pad={16}>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0" style={{ background: "var(--ds-accent-400)" }} />
                <div className="flex-1 text-[10px] tracking-wide uppercase" style={{ color: "var(--ds-accent-300)", fontFamily: "var(--ds-font-mono)" }}>Action requise</div>
              </div>
              <div className="mt-2.5 text-xl font-medium" style={{ fontFamily: "var(--ds-font-heading)" }}>Manche {manches.length + 1} à valider</div>
              <div className="mt-1 text-xs" style={{ color: "var(--ds-text-muted)" }}>{mancheEnCours.length} résultat{mancheEnCours.length > 1 ? "s" : ""} saisi{mancheEnCours.length > 1 ? "s" : ""}, à confirmer.</div>
              <Link
                href={`/organisateur/${tournoi.id}/qualification`}
                className={`mt-3 h-12 flex items-center justify-center gap-2 text-[15px] font-medium ${PRESS}`}
                style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-accent)", color: "var(--ds-accent-300)" }}
              >
                <ListChecks size={17} strokeWidth={2} />
                Valider la manche
              </Link>
            </CarteEtat>
          ) : (
            <CarteEtat>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={15} strokeWidth={2} style={{ color: "var(--ds-accent-400)" }} className="shrink-0" />
                <div className="flex-1 text-[10px] tracking-wide uppercase" style={{ color: "var(--ds-neutral-500)", fontFamily: "var(--ds-font-mono)" }}>Tout est à jour</div>
              </div>
              <p className="mt-2 text-[12px] leading-relaxed" style={{ color: "color-mix(in srgb, var(--ds-text) 56%, transparent)" }}>
                {manches.length > 0
                  ? `Les points de la manche ${manches.length} sont saisis. La manche ${manches.length + 1} pourra être renseignée dès qu'elle sera jouée.`
                  : "Aucune manche jouée pour l'instant."}
              </p>
              <Link
                href={`/tournois/${tournoi.id}/battle-royale`}
                className={`mt-3 h-11 flex items-center justify-center gap-2 text-sm font-medium ${PRESS}`}
                style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-border)", color: "var(--ds-neutral-500)" }}
              >
                <ListOrdered size={16} strokeWidth={2} />
                Voir le classement des manches
              </Link>
              <BarreProgression label="Manches jouées" valeur={`${manches.length} / ${tournoi.manchesPrevues ?? 1}`} pourcentage={(manches.length / (tournoi.manchesPrevues ?? 1)) * 100} />
            </CarteEtat>
          )
        ) : !tournoi.enDirect ? (
          <CarteEtat>
            <div className="flex items-center gap-2">
              <Clock size={15} strokeWidth={2} style={{ color: "var(--ds-neutral-500)" }} className="shrink-0" />
              <div className="flex-1 text-[10px] tracking-wide uppercase" style={{ color: "var(--ds-neutral-500)", fontFamily: "var(--ds-font-mono)" }}>Rien à faire pour l&apos;instant</div>
            </div>
            <p className="mt-2 text-[12px] leading-relaxed" style={{ color: "color-mix(in srgb, var(--ds-text) 58%, transparent)" }}>
              {checkinOuvert
                ? `Le check-in est ouvert, ${presents.length} sur ${tournoi.placesInscrites} inscrits ont confirmé leur présence. Le tournoi démarre à ${heureCourte(tournoi.debutTournoiTs ?? maintenant)}.`
                : `Le check-in ouvre à ${tournoi.checkin}. D'ici là, tu peux encore régler le stream et compléter les infos du tournoi.`}
            </p>
            <Link
              href={checkinOuvert ? `/tournois/${tournoi.id}/inscrits` : `/organisateur/${tournoi.id}/stream`}
              className={`mt-3 h-11 flex items-center justify-center gap-2 text-sm font-medium ${PRESS}`}
              style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-border)", color: "var(--ds-neutral-500)" }}
            >
              {checkinOuvert ? <UserCheck size={15} strokeWidth={2} /> : <Radio size={15} strokeWidth={2} />}
              {checkinOuvert ? "Suivre le check-in" : "Préparer le stream"}
            </Link>
            <BarreProgression label={checkinOuvert ? "Présents confirmés" : "Places remplies"} valeur={checkinOuvert ? `${presents.length} / ${tournoi.placesInscrites}` : `${tournoi.placesInscrites} / ${tournoi.placesTotal}`} pourcentage={checkinOuvert ? (tournoi.placesInscrites > 0 ? (presents.length / tournoi.placesInscrites) * 100 : 0) : (tournoi.placesInscrites / tournoi.placesTotal) * 100} />
          </CarteEtat>
        ) : matchsEnAttente.length > 0 ? (
          <CarteEtat accent pad={16}>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0" style={{ background: "var(--ds-accent-400)" }} />
              <div className="flex-1 text-[10px] tracking-wide uppercase" style={{ color: "var(--ds-accent-300)", fontFamily: "var(--ds-font-mono)" }}>Action requise</div>
              {roundActuel && <div className="text-[9px] whitespace-nowrap" style={{ color: "var(--ds-neutral-500)", fontFamily: "var(--ds-font-mono)" }}>{roundActuel}</div>}
            </div>
            <div className="mt-2.5 text-xl font-medium" style={{ fontFamily: "var(--ds-font-heading)" }}>
              {matchsEnAttente.length} match{matchsEnAttente.length > 1 ? "s" : ""} en attente de score
            </div>
            <div className="mt-3 flex flex-col gap-1.5">
              {matchsEnAttente.slice(0, 4).map((m) => (
                <div key={m.id} className="flex items-center gap-2.5 px-2.5 py-1.5" style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-neutral-900)", border: "1px solid var(--ds-accent-700)" }}>
                  <div className="w-8 shrink-0 text-[9px]" style={{ color: "var(--ds-neutral-600)", fontFamily: "var(--ds-font-mono)" }}>{codeRound(m.round, totalRounds)}</div>
                  <div className="flex-1 min-w-0 text-[12px] truncate">{m.joueur1} vs {m.joueur2}</div>
                  <div className="text-[9px] whitespace-nowrap" style={{ color: m.statut === "en_cours" ? "var(--ds-accent-300)" : "var(--ds-neutral-600)", fontFamily: "var(--ds-font-mono)" }}>
                    {m.statut === "en_cours" ? `${m.score1 ?? 0}—${m.score2 ?? 0}` : "À JOUER"}
                  </div>
                </div>
              ))}
            </div>
            <Link
              href={`/organisateur/${tournoi.id}/qualification`}
              className={`mt-3 h-12 flex items-center justify-center gap-2 text-[15px] font-medium ${PRESS}`}
              style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-accent)", color: "var(--ds-accent-300)" }}
            >
              <Pencil size={17} strokeWidth={2} />
              Saisir les scores
            </Link>
          </CarteEtat>
        ) : (
          <CarteEtat>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={15} strokeWidth={2} style={{ color: "var(--ds-accent-400)" }} className="shrink-0" />
              <div className="flex-1 text-[10px] tracking-wide uppercase" style={{ color: "var(--ds-neutral-500)", fontFamily: "var(--ds-font-mono)" }}>Tout est à jour</div>
            </div>
            <p className="mt-2 text-[12px] leading-relaxed" style={{ color: "color-mix(in srgb, var(--ds-text) 56%, transparent)" }}>
              Aucun score en attente pour l&apos;instant — le prochain tour démarre dès que les paires seront connues.
            </p>
            <Link
              href={`/tournois/${tournoi.id}/bracket`}
              className={`mt-3 h-11 flex items-center justify-center gap-2 text-sm font-medium ${PRESS}`}
              style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-border)", color: "var(--ds-neutral-500)" }}
            >
              <GitBranch size={16} strokeWidth={2} />
              Voir le bracket
            </Link>
          </CarteEtat>
        )}
      </div>

      <div className="h-px" style={{ background: "linear-gradient(to right, transparent, var(--ds-border) 48px, var(--ds-border) calc(100% - 48px), transparent)" }} />

      <div className="px-5 pt-3.5 pb-6">
        <div className="flex items-center gap-2 mb-2.5">
          <div className="text-[10px] tracking-wide uppercase whitespace-nowrap" style={{ color: "var(--ds-neutral-600)", fontFamily: "var(--ds-font-mono)" }}>
            {tournoi.termine ? "Accès · lecture seule" : tournoi.annule ? "Accès · fermé" : "Accès"}
          </div>
          <div className="flex-1 h-px" style={{ background: "var(--ds-neutral-900)" }} />
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* Check-in */}
          <Tuile
            icon={UserCheck}
            label="Check-in"
            href={`/tournois/${tournoi.id}/inscrits`}
            niveau={tournoi.annule ? "off" : tournoi.termine ? "off" : checkinOuvert ? "on" : "soon"}
            etat={
              tournoi.annule
                ? "JAMAIS OUVERT"
                : tournoi.termine
                  ? "ARCHIVÉ"
                  : checkinOuvert
                    ? `${presents.length} / ${tournoi.placesInscrites} PRÉSENTS`
                    : `OUVRE À ${tournoi.checkin.toUpperCase()}`
            }
          />

          {/* Scores / Manches */}
          <Tuile
            icon={estBR ? ListChecks : Pencil}
            label={estBR ? "Manches" : "Scores"}
            href={`/organisateur/${tournoi.id}/qualification`}
            niveau={
              tournoi.annule || tournoi.termine
                ? "off"
                : !tournoi.enDirect
                  ? "soon"
                  : estBR
                    ? "on"
                    : matchsEnAttente.length > 0
                      ? "hot"
                      : "on"
            }
            badge={!tournoi.enDirect || tournoi.termine || tournoi.annule || estBR ? undefined : matchsEnAttente.length}
            etat={
              tournoi.annule
                ? "AUCUN MATCH JOUÉ"
                : tournoi.termine
                  ? "VERROUILLÉES"
                  : !tournoi.enDirect
                    ? "APRÈS LE DÉBUT"
                    : estBR
                      ? `MANCHE ${manches.length + 1} À VENIR`
                      : `${matchsEnAttente.length} EN ATTENTE`
            }
          />

          {/* Paramètres */}
          <Tuile
            icon={Radio}
            label="Paramètres"
            href={`/organisateur/${tournoi.id}/stream`}
            niveau={tournoi.annule ? "off" : tournoi.termine ? "off" : "on"}
            etat={
              tournoi.annule
                ? "INDISPONIBLE"
                : tournoi.termine
                  ? "STREAM ARRÊTÉ"
                  : !tournoi.enDirect
                    ? "STREAM · DIFFUSION"
                    : tournoi.streamActif
                      ? "STREAM ACTIF"
                      : "STREAM INACTIF"
            }
          />

          {/* Aperçu bracket / classement */}
          <Tuile
            icon={estBR ? ListOrdered : GitBranch}
            label={estBR ? "Aperçu classement" : "Aperçu bracket"}
            href={estBR ? `/tournois/${tournoi.id}/battle-royale` : `/tournois/${tournoi.id}/bracket`}
            niveau={tournoi.annule ? "off" : "on"}
            etat={
              tournoi.annule
                ? "TIRAGE ANNULÉ"
                : tournoi.termine
                  ? estBR
                    ? `${unites.length} ${uniteLabel!.pluriel.toUpperCase()}`
                    : "CLASSEMENT FINAL"
                  : estBR
                    ? `${unites.length} ${uniteLabel!.pluriel.toUpperCase()} EN JEU`
                    : matches.length === 0
                      ? "TIRAGE NON FAIT"
                      : roundActuel
                        ? `${roundActuel} EN COURS`
                        : "TIRAGE FAIT"
            }
          />

          {/* Clôture (avant/pendant) ou Remboursements (annulé) */}
          {tournoi.annule ? (
            <Tuile
              icon={Receipt}
              label="Remboursements"
              href="/profil/solde"
              niveau={resume && resume.remboursementsCount > 0 ? "on" : "off"}
              etat={resume ? `${resume.remboursementsCount} SUR ${tournoi.placesInscrites} · FAIT` : "AUCUN"}
            />
          ) : tournoi.termine ? (
            <Tuile
              icon={DoorOpen}
              label="Infos de room"
              href={`/organisateur/${tournoi.id}/room`}
              niveau="on"
              etat="LECTURE SEULE"
            />
          ) : !tournoi.enDirect ? (
            <Tuile
              icon={Flag}
              label="Clôture"
              href={`/organisateur/${tournoi.id}/cloture`}
              niveau="off"
              etat="INDISPONIBLE"
            />
          ) : (
            <Tuile
              icon={DoorOpen}
              label="Infos de room"
              href={`/organisateur/${tournoi.id}/room`}
              niveau={inscriptionsFermees(tournoi) ? (room?.lien.trim() ? "on" : "soon") : "off"}
              etat={!inscriptionsFermees(tournoi) ? "APRÈS LA CLÔTURE DES INSCRIPTIONS" : room?.lien.trim() ? "LIEN + MOT DE PASSE" : "PAS ENCORE DÉFINIES"}
            />
          )}

          {/* Tribune */}
          <Tuile
            icon={MessagesSquare}
            label="Tribune"
            href={`/tournois/${tournoi.id}/chat-spectateurs`}
            niveau={tournoi.annule ? "off" : "on"}
            etat={tournoi.annule ? "FERMÉE" : tournoi.termine ? "ARCHIVÉE" : `${spectateurs} SPECTATEURS`}
          />
        </div>
      </div>

      <div className="mt-auto px-5 flex items-center gap-2" style={{ paddingTop: 12, paddingBottom: 22, borderTop: "1px solid var(--ds-border)" }}>
        {tournoi.annule ? (
          <>
            <Info size={13} strokeWidth={2} style={{ color: "var(--ds-neutral-600)" }} className="shrink-0" />
            <div className="flex-1 min-w-0 text-[9px] tracking-wide truncate" style={{ color: "var(--ds-neutral-600)", fontFamily: "var(--ds-font-mono)" }}>
              ANNULÉ {tournoi.annuleLe ? `LE ${dateLongue(tournoi.annuleLe).toUpperCase()}` : ""}
            </div>
          </>
        ) : tournoi.termine ? (
          <>
            <CheckCircle2 size={13} strokeWidth={2} style={{ color: "var(--ds-accent-400)" }} className="shrink-0" />
            <div className="flex-1 min-w-0 text-[9px] tracking-wide truncate" style={{ color: "var(--ds-neutral-500)", fontFamily: "var(--ds-font-mono)" }}>
              CLÔTURÉ {tournoi.termineLe ? `LE ${dateLongue(tournoi.termineLe).toUpperCase()}` : ""}
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={async () => {
              await navigator.clipboard.writeText(tournoi.code);
              setCodeCopie(true);
              setTimeout(() => setCodeCopie(false), 1800);
            }}
            className={`flex items-center gap-2 w-full ${PRESS}`}
          >
            <Copy size={13} strokeWidth={2} style={{ color: codeCopie ? "var(--ds-accent-300)" : "var(--ds-neutral-600)" }} className="shrink-0" />
            <div className="flex-1 min-w-0 text-left text-[9px] tracking-wide truncate" style={{ color: codeCopie ? "var(--ds-accent-300)" : "var(--ds-neutral-600)", fontFamily: "var(--ds-font-mono)" }}>
              {codeCopie ? "CODE COPIÉ" : `CODE ${tournoi.code} · PARTAGE-LE AVEC TES INSCRITS`}
            </div>
          </button>
        )}
      </div>
    </div>
  );
}
