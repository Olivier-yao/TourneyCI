"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { ArrowLeft, Wifi, Share2, Check, MessageCircle, Heart, HeartCrack, ChevronRight, Swords, Radio, ShieldCheck, XCircle } from "lucide-react";
import { ImagePlaceholder } from "@/components/ds/ImagePlaceholder";
import { ProgressBar } from "@/components/ds/ProgressBar";
import { AvatarPile } from "@/components/ds/Avatar";
import { Modal } from "@/components/ds/Modal";
import { LiveBadge } from "@/components/ds/LiveBadge";
import { formatXof } from "@/lib/formatXof";
import {
  tournoiParId,
  inscriptionsFermees,
  reevaluerPaiementsEnAttente,
  cashPrizeEnSequestre,
  cashPrizeAffiche,
  cashPrizeEstEstime,
  repartitionAutomatique,
  type Tournoi,
} from "@/lib/mockTournaments";
import { matchsDuTournoi, codeRound, type MatchTournoi } from "@/lib/mockBracket";
import { participantsBR, classementCumuleBR, manchesBR } from "@/lib/mockBattleRoyale";
import { nomOrganisateurActuel } from "@/lib/mockOrganisateur";
import { peutSuperviser } from "@/lib/mockAdjointsOrganisateur";
import { classementOrganisateurs } from "@/lib/mockClassementOrganisateurs";
import { estInscrit } from "@/lib/mockInscriptions";
import { lireProfil } from "@/lib/mockProfil";
import { monAvisPourTournoi, compterAvis } from "@/lib/mockAvis";
import { monAppelPourTournoi, type Appel } from "@/lib/mockAppel";
import { AvisCoeur } from "@/components/ds/AvisCoeur";
import { AppelResultats } from "@/components/ds/AppelResultats";
import { CtaInscription } from "./CtaInscription";

const SEUIL_TEXTE_LONG = 140;

function estTexteLong(texte: string): boolean {
  return texte.length > SEUIL_TEXTE_LONG || texte.includes("\n");
}

function Vignette({ label, valeur }: { label: string; valeur: string }) {
  return (
    <div
      className="p-3"
      style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: "1px solid var(--ds-border)" }}
    >
      <div className="text-[11px]" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
        {label}
      </div>
      <div className="text-[17px] font-semibold">{valeur}</div>
    </div>
  );
}

function BoutonPartager() {
  const [copie, setCopie] = useState(false);

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

  return (
    <button
      type="button"
      onClick={partager}
      className="absolute top-5 right-5 flex items-center justify-center w-[34px] h-[34px]"
      style={{
        borderRadius: "var(--ds-radius-md)",
        background: "color-mix(in srgb, var(--ds-bg) 70%, transparent)",
        border: "1px solid var(--ds-border)",
        color: copie ? "var(--ds-accent-300)" : "var(--ds-text)",
      }}
      aria-label="Partager le tournoi"
    >
      {copie ? <Check size={16} strokeWidth={2} /> : <Share2 size={16} strokeWidth={2} />}
    </button>
  );
}

/** Cadre dédié au stream live de la partie en cours, à la place de la
 * bannière statique une fois le tournoi en direct, uniquement si
 * l'organisateur l'a activé pour ce tournoi. Aucun flux réel dans ce mock
 * (backlog CLAUDE.md) : juste l'emplacement visuel avec un indicateur "en
 * direct", prêt à recevoir un lecteur vidéo plus tard. Fidèle au design
 * "Tourney v5 Écrans" (écran J1). */
function CadreStream({ hauteur, sousTitre }: { hauteur: number; sousTitre: string }) {
  return (
    <div className="relative w-full overflow-hidden" style={{ height: hauteur, background: "var(--ds-surface-2)", borderBottom: "1px solid var(--ds-accent-800)" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(90% 110% at 50% 50%, var(--ds-accent-900), var(--ds-surface-2) 72%)" }} />
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: "linear-gradient(var(--ds-accent) 1px, transparent 1px), linear-gradient(90deg, var(--ds-accent) 1px, transparent 1px)",
          backgroundSize: "30px 30px",
        }}
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
        <div
          className="flex items-center justify-center w-[58px] h-[58px]"
          style={{ borderRadius: "var(--ds-radius-pill)", border: "1px solid var(--ds-accent)", boxShadow: "0 0 34px color-mix(in srgb, var(--ds-accent) 28%, transparent)" }}
        >
          <Radio size={26} strokeWidth={2} style={{ color: "var(--ds-accent-300)" }} />
        </div>
        <div className="text-center">
          <div className="text-sm font-medium">Stream en direct de la partie</div>
          {sousTitre && (
            <div className="mt-1 text-[9px] tracking-wide uppercase" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
              {sousTitre}
            </div>
          )}
        </div>
      </div>
      <div
        className="absolute left-[18px] bottom-3.5 flex items-center gap-1.5 px-2.5 py-1"
        style={{ borderRadius: "var(--ds-radius-pill)", background: "color-mix(in srgb, var(--ds-bg) 80%, transparent)", border: "1px solid var(--ds-accent)" }}
      >
        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--ds-accent-300)" }} />
        <span className="text-[9px] tracking-wide" style={{ color: "var(--ds-accent-300)", fontFamily: "var(--ds-font-mono)" }}>EN DIRECT</span>
      </div>
      <div
        className="absolute right-[18px] bottom-3.5 px-2.5 py-1 text-[9px]"
        style={{ borderRadius: "var(--ds-radius-pill)", background: "color-mix(in srgb, var(--ds-bg) 80%, transparent)", color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}
      >
        LECTEUR À VENIR
      </div>
    </div>
  );
}

function initiales(nom: string): string {
  return nom.split(/[\s.]+/).filter(Boolean).slice(0, 2).map((m) => m[0]).join("").toUpperCase();
}

function TuileStat({ valeur, label, accent = false }: { valeur: string; label: string; accent?: boolean }) {
  return (
    <div className="p-2.5" style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)" }}>
      <div className="text-[15px]" style={{ fontFamily: "var(--ds-font-mono)", color: accent ? "var(--ds-accent-300)" : "var(--ds-text)" }}>{valeur}</div>
      <div className="mt-0.5 text-[11px]" style={{ color: "var(--ds-muted)" }}>{label}</div>
    </div>
  );
}

/** Carte organisateur affichée sur la fiche tournoi en direct — nom, sceau de
 * certification, note moyenne, réutilise les données réelles du classement
 * organisateurs plutôt qu'un score inventé. */
function CarteOrganisateur({ nom }: { nom: string }) {
  const [info, setInfo] = useState<{ certifie: boolean; note: number } | undefined>(undefined);

  useEffect(() => {
    classementOrganisateurs().then((classement) => {
      const entree = classement.find((o) => o.nom === nom);
      setInfo(entree ? { certifie: entree.certifie, note: entree.note } : undefined);
    });
  }, [nom]);

  return (
    <Link
      href={`/organisateur/profil/${encodeURIComponent(nom)}`}
      className="flex items-center gap-2.5 p-[11px]"
      style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)" }}
    >
      <div className="relative shrink-0">
        <div
          className="flex items-center justify-center w-[34px] h-[34px] text-[11px] font-medium"
          style={{ borderRadius: "var(--ds-radius-sm)", background: "var(--ds-accent-800)", color: "var(--ds-accent-300)" }}
        >
          {initiales(nom)}
        </div>
        {info?.certifie && (
          <div
            className="absolute -right-[3px] -bottom-[3px] flex items-center justify-center"
            style={{ width: 15, height: 15, borderRadius: "var(--ds-radius-pill)", background: "var(--ds-accent-700)", border: "1.5px solid var(--ds-surface)" }}
          >
            <ShieldCheck size={8} strokeWidth={2} style={{ color: "var(--ds-accent-100, var(--ds-accent-300))" }} />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-medium truncate">{nom}</div>
        <div className="text-[9px]" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
          {info?.certifie ? "CERTIFIÉ · " : ""}NOTE {info ? info.note.toFixed(1) : "–"}
        </div>
      </div>
      <ChevronRight size={14} strokeWidth={2} style={{ color: "var(--ds-muted)" }} />
    </Link>
  );
}

/** Vue "en cours" affichée directement sur la fiche du tournoi une fois qu'il
 * a débuté : score/classement en direct + dernières informations de la
 * compétition, visible par tout visiteur (inscrit ou non), dans le même
 * esprit que l'écran Match en direct plutôt que de forcer un clic de plus. */
function CashPrizeEnTete({ montantXof, badgeTexte }: { montantXof: number; badgeTexte?: string }) {
  if (montantXof <= 0) return <LiveBadge texte={badgeTexte} />;
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="text-[10px] uppercase tracking-wide" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
          Cash prize
        </div>
        <div className="text-xl font-semibold" style={{ color: "var(--ds-accent-300)", fontFamily: "var(--ds-font-mono)" }}>
          {formatXof(montantXof)}
        </div>
      </div>
      <LiveBadge texte={badgeTexte} />
    </div>
  );
}

function EnDirectBloc({ tournoi }: { tournoi: Tournoi }) {
  const [tousMatchs, setTousMatchs] = useState<MatchTournoi[]>([]);
  useEffect(() => {
    if (tournoi.type === "battle_royale") return;
    matchsDuTournoi(tournoi.id).then(setTousMatchs);
  }, [tournoi.id, tournoi.type]);

  if (tournoi.type === "battle_royale") {
    const classement = classementCumuleBR(tournoi.id, tournoi.brSousType ?? "solo");
    const manches = manchesBR(tournoi.id);
    const top3 = classement.slice(0, 3);
    return (
      <Link
        href={`/tournois/${tournoi.id}/battle-royale`}
        className="flex flex-col gap-3 p-4"
        style={{ borderRadius: "var(--ds-radius-lg)", background: "linear-gradient(var(--ds-accent-900), var(--ds-surface))", boxShadow: "0 0 0 1px var(--ds-accent-700)" }}
      >
        <CashPrizeEnTete montantXof={cashPrizeAffiche(tournoi)} />
        <span className="text-[10px] -mt-2" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
          {manches.length} manche{manches.length > 1 ? "s" : ""}
        </span>
        {top3.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--ds-text-muted)" }}>
            La compétition a débuté, en attente des premiers résultats de manche.
          </p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {top3.map((l, i) => (
              <div key={l.participantId} className="flex items-center gap-2.5 text-sm">
                <span className="w-5 text-center text-xs" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                  #{i + 1}
                </span>
                <span className="flex-1 truncate">{l.nom}</span>
                <span className="font-semibold" style={{ color: "var(--ds-accent-300)", fontFamily: "var(--ds-font-mono)" }}>
                  {l.points} pt
                </span>
              </div>
            ))}
          </div>
        )}
        <span className="flex items-center gap-1 text-xs font-medium" style={{ color: "var(--ds-accent-300)" }}>
          Voir le classement complet
          <ChevronRight size={13} strokeWidth={2} />
        </span>
      </Link>
    );
  }

  const matchsEnCours = tousMatchs.filter((m) => m.statut === "en_cours");
  const totalRounds = tousMatchs.length > 0 ? Math.max(...tousMatchs.map((m) => m.round)) : 0;
  const matchVedette = matchsEnCours[0];
  const autresEnCours = matchsEnCours.slice(1);
  const roundActuel = matchVedette ? codeRound(matchVedette.round, totalRounds) : undefined;

  return (
    <div className="flex flex-col gap-2.5">
      {/* Point 208 : le match en cours est la priorité absolue de cette fiche
       * en direct — score et adversaires en grand, avant toute autre info,
       * pour qu'un spectateur ne confonde jamais ça avec un écran d'inscription. */}
      {matchVedette ? (
        <Link
          href={`/matches/${matchVedette.id}`}
          className="flex flex-col gap-4 p-4"
          style={{ borderRadius: "var(--ds-radius-lg)", background: "linear-gradient(var(--ds-accent-900), var(--ds-surface))", boxShadow: "0 0 0 1px var(--ds-accent-700)" }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wide" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
              {roundActuel} · Match en direct
            </span>
            <LiveBadge />
          </div>
          <div className="flex items-center justify-center gap-4">
            <div className="flex-1 flex flex-col items-center gap-2 min-w-0">
              <div
                className="flex items-center justify-center shrink-0 font-medium"
                style={{ width: 56, height: 56, borderRadius: "var(--ds-radius-pill)", background: (matchVedette.score1 ?? 0) > (matchVedette.score2 ?? 0) ? "var(--ds-accent-800)" : "var(--ds-surface-2)", border: `1px solid ${(matchVedette.score1 ?? 0) > (matchVedette.score2 ?? 0) ? "var(--ds-accent)" : "var(--ds-border)"}`, color: "var(--ds-accent-300)" }}
              >
                {initiales(matchVedette.joueur1 ?? "?")}
              </div>
              <span className="text-[13px] font-medium text-center truncate w-full">{matchVedette.joueur1 ?? "À définir"}</span>
            </div>
            <div className="text-2xl font-semibold shrink-0" style={{ fontFamily: "var(--ds-font-mono)", color: "var(--ds-accent-300)" }}>
              {matchVedette.score1 ?? 0} — {matchVedette.score2 ?? 0}
            </div>
            <div className="flex-1 flex flex-col items-center gap-2 min-w-0">
              <div
                className="flex items-center justify-center shrink-0 font-medium"
                style={{ width: 56, height: 56, borderRadius: "var(--ds-radius-pill)", background: (matchVedette.score2 ?? 0) > (matchVedette.score1 ?? 0) ? "var(--ds-accent-800)" : "var(--ds-surface-2)", border: `1px solid ${(matchVedette.score2 ?? 0) > (matchVedette.score1 ?? 0) ? "var(--ds-accent)" : "var(--ds-border)"}`, color: "var(--ds-accent-300)" }}
              >
                {initiales(matchVedette.joueur2 ?? "?")}
              </div>
              <span className="text-[13px] font-medium text-center truncate w-full">{matchVedette.joueur2 ?? "À définir"}</span>
            </div>
          </div>
          <span className="flex items-center justify-center gap-1 text-sm font-medium" style={{ color: "var(--ds-accent-300)" }}>
            Voir le match en direct
            <ChevronRight size={15} strokeWidth={2} />
          </span>
        </Link>
      ) : (
        <div className="flex items-center gap-3 p-3" style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)" }}>
          <Swords size={17} strokeWidth={2} style={{ color: "var(--ds-accent-300)" }} />
          <span className="flex-1 text-sm">Compétition en cours — entre deux matchs.</span>
        </div>
      )}

      {autresEnCours.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <div className="text-[10px] uppercase tracking-wide" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
            Autres matchs en cours
          </div>
          {autresEnCours.slice(0, 2).map((m: MatchTournoi) => (
            <Link
              key={m.id}
              href={`/matches/${m.id}`}
              className="flex items-center gap-2.5 py-2.5 px-2.5"
              style={{ borderRadius: "var(--ds-radius-md)", boxShadow: "0 0 0 1px var(--ds-border)" }}
            >
              <span className="w-[34px] shrink-0 text-[9px]" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                {codeRound(m.round, totalRounds)}
              </span>
              <span className="flex-1 min-w-0 truncate text-[13px]">{m.joueur1 ?? "?"} vs {m.joueur2 ?? "?"}</span>
              <span className="shrink-0 text-xs" style={{ fontFamily: "var(--ds-font-mono)", color: "var(--ds-muted)" }}>
                {m.score1 ?? "–"} — {m.score2 ?? "–"}
              </span>
            </Link>
          ))}
        </div>
      )}

      <CarteOrganisateur nom={tournoi.organisateur} />
      <div className="grid grid-cols-3 gap-2">
        <TuileStat valeur={String(tournoi.placesInscrites)} label="joueurs" />
        <TuileStat valeur={cashPrizeAffiche(tournoi).toLocaleString("fr-FR")} label="FCFA" accent />
        <TuileStat valeur={roundActuel ?? "–"} label="en cours" accent />
      </div>
      {!tournoi.streamActif && (
        <div className="flex items-center gap-2.5 p-3" style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)" }}>
          <Radio size={15} strokeWidth={2} style={{ color: "var(--ds-muted)" }} className="shrink-0" />
          <div className="text-xs leading-relaxed" style={{ color: "color-mix(in srgb, var(--ds-text) 52%, transparent)" }}>
            L&apos;organisateur n&apos;a pas activé de stream : suis le tournoi par le fil des matchs.
          </div>
        </div>
      )}
    </div>
  );
}

function DetailTournoiInterne() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const equipePreselectionneeId = searchParams.get("equipe") ?? undefined;
  const [pret, setPret] = useState(false);
  const [tournoi, setTournoi] = useState<Tournoi | undefined>(undefined);
  const [modaleOuverte, setModaleOuverte] = useState<"informations" | "reglement" | null>(null);
  const [fermeInscriptions, setFermeInscriptions] = useState(false);
  const [accesChat, setAccesChat] = useState(false);
  const [demanderAvis, setDemanderAvis] = useState(false);
  const [enSequestre, setEnSequestre] = useState(false);
  const [peutContester, setPeutContester] = useState(false);
  const [monAppel, setMonAppel] = useState<Appel | undefined>(undefined);
  const [estMonTournoi, setEstMonTournoi] = useState(false);
  const [avisCompte, setAvisCompte] = useState({ coeurs: 0, coeursBrises: 0 });
  const [matchsTournoi, setMatchsTournoi] = useState<MatchTournoi[]>([]);

  useEffect(() => {
    async function charger() {
      if (!tournoi || tournoi.type === "battle_royale") {
        setMatchsTournoi([]);
        return;
      }
      setMatchsTournoi(await matchsDuTournoi(params.id));
    }
    charger();
  }, [tournoi, params.id]);

  useEffect(() => {
    // État dépendant de l'API (tournoi) : introuvable au premier rendu
    // serveur, synchronisé côté client une fois monté (évite un mismatch
    // d'hydratation — le titre, la bannière, etc. peuvent différer si
    // l'organisateur a modifié le tournoi depuis un autre appareil).
    async function charger() {
      const t = await tournoiParId(params.id);
      setTournoi(t);
      const monTournoi = Boolean(t) && peutSuperviser(t!.organisateur, nomOrganisateurActuel());
      setEstMonTournoi(monTournoi);
      setAccesChat((await estInscrit(params.id)) || monTournoi);
      if (t) setFermeInscriptions(inscriptionsFermees(t));
      // Le retour "comment s'est passé ce tournoi" n'est proposé qu'une fois le
      // tournoi terminé (point 62/67, clarifie le point 51) — jamais à
      // l'inscription ni pendant le déroulement, et jamais à l'organisateur.
      setDemanderAvis(!monTournoi && Boolean(t?.termine) && !monAvisPourTournoi(params.id));
      setAvisCompte(compterAvis(params.id));
      if (t?.termine) {
        reevaluerPaiementsEnAttente();
        setEnSequestre(cashPrizeEnSequestre(params.id));
        setPeutContester(await estInscrit(params.id));
        setMonAppel(monAppelPourTournoi(params.id));
      }
      setPret(true);
    }
    charger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  if (!pret) return null;

  if (!tournoi) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-3 px-6 text-center"
        style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}
      >
        <p>Tournoi introuvable.</p>
        <Link href="/tournois" style={{ color: "var(--ds-accent-300)" }}>
          Retour aux tournois
        </Link>
      </div>
    );
  }

  const pourcentagePlaces = Math.round(
    (tournoi.placesInscrites / tournoi.placesTotal) * 100,
  );

  const nomType = tournoi.type === "battle_royale" ? "Battle Royale" : tournoi.type === "equipes" ? "Équipes" : "1v1";
  const sousType =
    tournoi.type === "battle_royale" && tournoi.brSousType
      ? tournoi.brSousType.charAt(0).toUpperCase() + tournoi.brSousType.slice(1)
      : tournoi.type === "equipes"
        ? [
            tournoi.equipeSousType ? tournoi.equipeSousType.charAt(0).toUpperCase() + tournoi.equipeSousType.slice(1) : undefined,
            tournoi.modeEquipe ? (tournoi.modeEquipe === "libre" ? "Libre" : "Prédéfinies") : undefined,
          ]
            .filter(Boolean)
            .join(" · ") || undefined
        : undefined;
  const typeLabel = sousType ? `${nomType} · ${sousType}` : nomType;
  const aUnBracket =
    tournoi.type === "battle_royale"
      ? participantsBR(params.id).length > 0
      : matchsTournoi.length > 0;
  const lienBracket =
    tournoi.type === "battle_royale"
      ? `/tournois/${params.id}/battle-royale`
      : `/tournois/${params.id}/bracket`;
  const matchVedetteStream =
    tournoi.enDirect && tournoi.type !== "battle_royale"
      ? matchsTournoi.find((m) => m.statut === "en_cours")
      : undefined;
  const sousTitreStream = matchVedetteStream ? `${matchVedetteStream.joueur1 ?? "?"} VS ${matchVedetteStream.joueur2 ?? "?"}` : "";

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}
    >
      <div className="relative" style={{ height: tournoi.enDirect && !tournoi.streamActif ? 74 : 210 }}>
        {tournoi.enDirect ? (
          tournoi.streamActif && <CadreStream hauteur={210} sousTitre={sousTitreStream} />
        ) : tournoi.banniereUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={tournoi.banniereUrl} alt={tournoi.titre} className="w-full object-cover" style={{ height: 210 }} />
        ) : (
          <ImagePlaceholder label="bannière du tournoi" hauteur={210} />
        )}
        <Link
          href="/accueil"
          className="absolute top-5 left-5 flex items-center justify-center w-[34px] h-[34px]"
          style={{
            borderRadius: "var(--ds-radius-md)",
            background: "color-mix(in srgb, var(--ds-bg) 70%, transparent)",
            border: "1px solid var(--ds-border)",
            color: "var(--ds-text)",
          }}
        >
          <ArrowLeft size={17} strokeWidth={2} />
        </Link>
        {tournoi.enDirect && !tournoi.streamActif && (
          <div className="absolute top-5 left-1/2 -translate-x-1/2">
            <LiveBadge />
          </div>
        )}
        <BoutonPartager />
      </div>

      <div className={`px-5 relative flex-1 flex flex-col gap-3 pb-28 ${tournoi.enDirect ? "mt-4" : "-mt-6"}`}>
        <div className="flex gap-1.5 flex-wrap">
          <span
            className="px-2.5 py-1 text-[11px]"
            style={{
              borderRadius: "var(--ds-radius-pill)",
              background: "var(--ds-accent-900)",
              color: "var(--ds-accent-300)",
              fontFamily: "var(--ds-font-mono)",
            }}
          >
            {tournoi.jeuLabel}
          </span>
          <span
            className="px-2.5 py-1 text-[11px]"
            style={{
              borderRadius: "var(--ds-radius-pill)",
              border: "1px solid var(--ds-border)",
              color: "var(--ds-muted)",
              fontFamily: "var(--ds-font-mono)",
            }}
          >
            {typeLabel}
          </span>
          <span
            className="px-2.5 py-1 text-[11px]"
            style={{
              borderRadius: "var(--ds-radius-pill)",
              border: "1px solid var(--ds-border)",
              color: "var(--ds-muted)",
              fontFamily: "var(--ds-font-mono)",
            }}
          >
            {tournoi.format}
          </span>
          {tournoi.modalite === "virtuel" && (
            <span
              className="flex items-center gap-1 px-2.5 py-1 text-[11px]"
              style={{
                borderRadius: "var(--ds-radius-pill)",
                border: "1px solid var(--ds-border)",
                color: "var(--ds-muted)",
                fontFamily: "var(--ds-font-mono)",
              }}
            >
              <Wifi size={11} strokeWidth={2} />
              En ligne
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <h1
            className="text-2xl leading-tight"
            style={{
              fontFamily: "var(--ds-font-heading)",
              fontWeight: "var(--ds-heading-weight)" as React.CSSProperties["fontWeight"],
            }}
          >
            {tournoi.titre}
          </h1>
          <span
            className="px-2 py-0.5 text-[11px] shrink-0"
            style={{
              borderRadius: "var(--ds-radius-sm)",
              background: "var(--ds-surface)",
              border: "1px solid var(--ds-border)",
              color: "var(--ds-muted)",
              fontFamily: "var(--ds-font-mono)",
              letterSpacing: "0.06em",
            }}
          >
            {tournoi.code}
          </span>
        </div>

        {tournoi.annule && (
          <div
            className="flex items-center gap-2.5 p-3"
            style={{ borderRadius: "var(--ds-radius-md)", background: "color-mix(in srgb, var(--ds-danger) 12%, var(--ds-surface))", border: "1px solid var(--ds-danger)" }}
          >
            <XCircle size={16} strokeWidth={2} style={{ color: "var(--ds-danger)" }} className="shrink-0" />
            <span className="text-sm" style={{ color: "var(--ds-danger)" }}>
              Tournoi annulé par l&apos;organisateur — les inscrits payants ont été remboursés.
            </span>
          </div>
        )}

        <p className="text-[13px]" style={{ color: "var(--ds-muted)" }}>
          Organisé par{" "}
          <Link
            href={`/organisateur/profil/${encodeURIComponent(tournoi.organisateur)}`}
            style={{
              color: "var(--ds-accent-300)",
              textDecoration: "underline",
              textDecorationStyle: "dotted",
              textDecorationColor: "var(--ds-accent-700)",
              textUnderlineOffset: "3px",
            }}
          >
            {tournoi.organisateur}
          </Link>{" "}
          · {tournoi.dateLabel}
        </p>

        {tournoi.enDirect && <EnDirectBloc tournoi={tournoi} />}

        {peutContester && (
          <AppelResultats
            tournoiId={tournoi.id}
            tournoiTitre={tournoi.titre}
            auteur={lireProfil().pseudo}
            appelExistant={monAppel}
            onEnvoye={() => {
              setMonAppel(monAppelPourTournoi(tournoi.id));
              reevaluerPaiementsEnAttente();
              setEnSequestre(cashPrizeEnSequestre(tournoi.id));
            }}
          />
        )}

        {!tournoi.enDirect && (
          <div className="grid grid-cols-2 gap-2 mt-1">
            {cashPrizeAffiche(tournoi) > 0 && (
              <Vignette label={cashPrizeEstEstime(tournoi) ? "Cash prize (estimé)" : "Cash prize"} valeur={formatXof(cashPrizeAffiche(tournoi))} />
            )}
            {tournoi.fraisXof > 0 && <Vignette label="Frais" valeur={formatXof(tournoi.fraisXof)} />}
            <Vignette
              label="Places"
              valeur={`${tournoi.placesInscrites} / ${tournoi.placesTotal}`}
            />
            {tournoi.checkin && <Vignette label="Check-in" valeur={tournoi.checkin} />}
          </div>
        )}
        {cashPrizeEstEstime(tournoi) && cashPrizeAffiche(tournoi) > 0 && (
          <p className="text-xs -mt-1" style={{ color: "var(--ds-muted)" }}>
            Cash prize estimé, basé sur les inscriptions actuelles — il évolue avec chaque nouvel inscrit jusqu&apos;à la clôture.
          </p>
        )}

        {tournoi.financementCashPrize === "organisateur" && (
          <p className="text-xs" style={{ color: "var(--ds-accent-300)" }}>
            Cash prize financé par l&apos;organisateur · inscription gratuite
          </p>
        )}

        {enSequestre && (
          <p className="text-xs" style={{ color: "var(--ds-danger)" }}>
            Cash prize en séquestre : versement suspendu le temps d&apos;une vérification (avis signalés et/ou contestation en cours).
          </p>
        )}

        <div className="mt-1">
          <ProgressBar pourcentage={pourcentagePlaces} />
          <div className="mt-2 flex items-center gap-2">
            <AvatarPile initiales={tournoi.inscrits} />
            <span className="text-xs" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
              +{tournoi.placesInscrites} inscrits
            </span>
          </div>
        </div>

        {tournoi.repartitionCashPrize && tournoi.repartitionCashPrize.length > 0 && (
          <div
            className="p-3 flex flex-col gap-1.5"
            style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: "1px solid var(--ds-border)" }}
          >
            <div
              className="text-[11px] uppercase tracking-wide mb-0.5"
              style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}
            >
              Répartition du cash prize
            </div>
            {repartitionAutomatique(cashPrizeAffiche(tournoi), tournoi.repartitionCashPrize.length).map((r) => (
              <div key={r.label} className="flex items-center justify-between text-sm">
                <span style={{ color: "var(--ds-text)" }}>{r.label}</span>
                <span style={{ color: "var(--ds-accent-300)", fontFamily: "var(--ds-font-mono)" }}>
                  {formatXof(r.montantXof)}
                </span>
              </div>
            ))}
          </div>
        )}

        {(tournoi.informations || tournoi.reglement) && (
          <div className="flex flex-col gap-2 mt-1">
            {tournoi.informations &&
              (estTexteLong(tournoi.informations) ? (
                <button
                  type="button"
                  onClick={() => setModaleOuverte("informations")}
                  className="text-left text-sm font-medium cursor-pointer"
                  style={{ color: "var(--ds-accent-300)" }}
                >
                  Voir les informations →
                </button>
              ) : (
                <p className="text-sm leading-relaxed" style={{ color: "var(--ds-text-muted)", whiteSpace: "pre-wrap" }}>
                  {tournoi.informations}
                </p>
              ))}
            {tournoi.reglement &&
              (estTexteLong(tournoi.reglement) ? (
                <button
                  type="button"
                  onClick={() => setModaleOuverte("reglement")}
                  className="text-left text-sm font-medium cursor-pointer"
                  style={{ color: "var(--ds-accent-300)" }}
                >
                  Voir le règlement →
                </button>
              ) : (
                <p className="text-sm leading-relaxed" style={{ color: "var(--ds-text-muted)", whiteSpace: "pre-wrap" }}>
                  {tournoi.reglement}
                </p>
              ))}
          </div>
        )}

        {(avisCompte.coeurs > 0 || avisCompte.coeursBrises > 0) && (
          <div className="flex items-center gap-3 text-xs" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
            <span className="flex items-center gap-1"><Heart size={12} strokeWidth={2} style={{ color: "var(--ds-accent-300)" }} />{avisCompte.coeurs}</span>
            <span className="flex items-center gap-1"><HeartCrack size={12} strokeWidth={2} style={{ color: "var(--ds-danger)" }} />{avisCompte.coeursBrises}</span>
          </div>
        )}

        {demanderAvis && (
          <AvisCoeur
            tournoiId={tournoi.id}
            tournoiTitre={tournoi.titre}
            organisateur={tournoi.organisateur}
            onEnvoye={() => {
              setDemanderAvis(false);
              reevaluerPaiementsEnAttente();
              setEnSequestre(cashPrizeEnSequestre(tournoi.id));
              setAvisCompte(compterAvis(tournoi.id));
            }}
          />
        )}

        {aUnBracket && !tournoi.enDirect && (
          <Link
            href={lienBracket}
            className="text-sm font-medium mt-1"
            style={{ color: "var(--ds-accent-300)" }}
          >
            {tournoi.type === "battle_royale" ? "Voir le classement en direct →" : "Voir le bracket →"}
          </Link>
        )}

        {tournoi.placesInscrites > 0 && (
          <Link
            href={`/tournois/${tournoi.id}/inscrits`}
            className="text-sm font-medium"
            style={{ color: "var(--ds-accent-300)" }}
          >
            Voir la liste des inscrits →
          </Link>
        )}

        {accesChat && (
          <Link
            href={`/tournois/${tournoi.id}/chat`}
            className="flex items-center gap-2 text-sm font-medium"
            style={{ color: "var(--ds-accent-300)" }}
          >
            <MessageCircle size={15} strokeWidth={2} />
            Chat du tournoi
          </Link>
        )}

      </div>

      <CtaInscription
        tournoiId={tournoi.id}
        titre={tournoi.titre}
        jeuLabel={tournoi.jeuLabel}
        dateLabel={tournoi.dateLabel}
        enDirect={tournoi.enDirect}
        fraisXof={tournoi.fraisXof}
        typeCompetition={tournoi.type}
        equipes={tournoi.equipes}
        modeEquipe={tournoi.modeEquipe}
        brSousType={tournoi.brSousType}
        organisateur={tournoi.organisateur}
        equipePreselectionneeId={equipePreselectionneeId}
        tournoiCommence={tournoi.enDirect || Boolean(tournoi.termine) || Boolean(tournoi.annule)}
        fermeInscriptions={fermeInscriptions}
        estMonTournoi={estMonTournoi}
      />

      <Modal ouvert={modaleOuverte === "informations"} titre="Informations" onFermer={() => setModaleOuverte(null)}>
        {tournoi.informations}
      </Modal>
      <Modal ouvert={modaleOuverte === "reglement"} titre="Règlement" onFermer={() => setModaleOuverte(null)}>
        {tournoi.reglement}
      </Modal>
    </div>
  );
}

export default function DetailTournoiPage() {
  return (
    <Suspense fallback={null}>
      <DetailTournoiInterne />
    </Suspense>
  );
}
