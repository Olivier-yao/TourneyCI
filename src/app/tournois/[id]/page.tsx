"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { ArrowLeft, Wifi, Settings2, Share2, Check, MessageCircle, Heart, HeartCrack, ChevronRight, Swords } from "lucide-react";
import { ImagePlaceholder } from "@/components/ds/ImagePlaceholder";
import { ProgressBar } from "@/components/ds/ProgressBar";
import { AvatarPile } from "@/components/ds/Avatar";
import { Modal } from "@/components/ds/Modal";
import { LiveBadge } from "@/components/ds/LiveBadge";
import { formatXof } from "@/lib/formatXof";
import { tournoiParId, inscriptionsFermees, reevaluerPaiementsEnAttente, cashPrizeEnSequestre, type Tournoi } from "@/lib/mockTournaments";
import { matchsDuTournoi, type MatchTournoi } from "@/lib/mockBracket";
import { participantsBR, classementCumuleBR, manchesBR } from "@/lib/mockBattleRoyale";
import { estOrganisateur } from "@/lib/mockAuth";
import { nomOrganisateurActuel } from "@/lib/mockOrganisateur";
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

/** Vue "en cours" affichée directement sur la fiche du tournoi une fois qu'il
 * a débuté : score/classement en direct + dernières informations de la
 * compétition, visible par tout visiteur (inscrit ou non), dans le même
 * esprit que l'écran Match en direct plutôt que de forcer un clic de plus. */
function EnDirectBloc({ tournoi }: { tournoi: Tournoi }) {
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
        <div className="flex items-center justify-between">
          <LiveBadge />
          <span className="text-[10px]" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
            {manches.length} manche{manches.length > 1 ? "s" : ""}
          </span>
        </div>
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

  const matchsEnCours = matchsDuTournoi(tournoi.id).filter((m) => m.statut === "en_cours");

  if (matchsEnCours.length === 0) {
    return (
      <Link
        href={`/tournois/${tournoi.id}/bracket`}
        className="flex items-center gap-3 p-4"
        style={{ borderRadius: "var(--ds-radius-lg)", background: "linear-gradient(var(--ds-accent-900), var(--ds-surface))", boxShadow: "0 0 0 1px var(--ds-accent-700)" }}
      >
        <Swords size={17} strokeWidth={2} style={{ color: "var(--ds-accent-300)" }} />
        <span className="flex-1 text-sm">Compétition en cours — entre deux matchs.</span>
        <LiveBadge />
      </Link>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {matchsEnCours.map((m: MatchTournoi) => (
        <Link
          key={m.id}
          href={`/matches/${m.id}`}
          className="flex flex-col gap-2 p-4"
          style={{ borderRadius: "var(--ds-radius-lg)", background: "linear-gradient(var(--ds-accent-900), var(--ds-surface))", boxShadow: "0 0 0 1px var(--ds-accent-700)" }}
        >
          <div className="flex items-center justify-between">
            <LiveBadge texte={m.minute !== undefined ? `EN DIRECT · ${m.minute}'` : "EN DIRECT"} />
            <ChevronRight size={15} style={{ color: "var(--ds-muted)" }} />
          </div>
          <div className="flex items-center justify-between text-sm font-medium">
            <span className="flex-1 truncate">{m.joueur1 ?? "?"}</span>
            <span
              className="px-3 text-base font-semibold"
              style={{ fontFamily: "var(--ds-font-mono)", color: "var(--ds-accent-300)" }}
            >
              {m.score1 ?? "–"} : {m.score2 ?? "–"}
            </span>
            <span className="flex-1 truncate text-right">{m.joueur2 ?? "?"}</span>
          </div>
          {m.evenements && m.evenements.length > 0 && (
            <p className="text-xs truncate" style={{ color: "var(--ds-text-muted)" }}>
              {m.evenements[0].minute}&apos; · {m.evenements[0].texte}
            </p>
          )}
        </Link>
      ))}
    </div>
  );
}

function DetailTournoiInterne() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const equipePreselectionneeId = searchParams.get("equipe") ?? undefined;
  const tournoi = tournoiParId(params.id);
  const [organisateur, setOrganisateur] = useState(false);
  const [modaleOuverte, setModaleOuverte] = useState<"informations" | "reglement" | null>(null);
  const [fermeInscriptions, setFermeInscriptions] = useState(false);
  const [accesChat, setAccesChat] = useState(false);
  const [demanderAvis, setDemanderAvis] = useState(false);
  const [enSequestre, setEnSequestre] = useState(false);
  const [peutContester, setPeutContester] = useState(false);
  const [monAppel, setMonAppel] = useState<Appel | undefined>(undefined);
  const [estMonTournoi, setEstMonTournoi] = useState(false);
  const [avisCompte, setAvisCompte] = useState({ coeurs: 0, coeursBrises: 0 });

  useEffect(() => {
    const monTournoi = Boolean(tournoi) && tournoi?.organisateur === nomOrganisateurActuel();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrganisateur(estOrganisateur());
    setEstMonTournoi(monTournoi);
    setAccesChat(estInscrit(params.id) || estOrganisateur());
    if (tournoi) setFermeInscriptions(inscriptionsFermees(tournoi));
    // Le retour "comment s'est passé ce tournoi" n'est proposé qu'une fois le
    // tournoi terminé (point 62/67, clarifie le point 51) — jamais à
    // l'inscription ni pendant le déroulement, et jamais à l'organisateur.
    setDemanderAvis(!monTournoi && Boolean(tournoi?.termine) && !monAvisPourTournoi(params.id));
    setAvisCompte(compterAvis(params.id));
    if (tournoi?.termine) {
      reevaluerPaiementsEnAttente();
      setEnSequestre(cashPrizeEnSequestre(params.id));
      setPeutContester(estInscrit(params.id));
      setMonAppel(monAppelPourTournoi(params.id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

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
      : tournoi.type === "equipes" && tournoi.modeEquipe
        ? tournoi.modeEquipe === "libre" ? "Libre" : "Prédéfinies"
        : undefined;
  const typeLabel = sousType ? `${nomType} · ${sousType}` : nomType;
  const aUnBracket =
    tournoi.type === "battle_royale"
      ? participantsBR(params.id).length > 0
      : matchsDuTournoi(params.id).length > 0;
  const lienBracket =
    tournoi.type === "battle_royale"
      ? `/tournois/${params.id}/battle-royale`
      : `/tournois/${params.id}/bracket`;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}
    >
      <div className="relative">
        {tournoi.banniereUrl ? (
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
        <BoutonPartager />
      </div>

      <div className="px-5 -mt-6 relative flex-1 flex flex-col gap-3 pb-28">
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

        <div className="grid grid-cols-2 gap-2 mt-1">
          {tournoi.cashPrizeXof > 0 && <Vignette label="Cash prize" valeur={formatXof(tournoi.cashPrizeXof)} />}
          {tournoi.fraisXof > 0 && <Vignette label="Frais" valeur={formatXof(tournoi.fraisXof)} />}
          <Vignette
            label="Places"
            valeur={`${tournoi.placesInscrites} / ${tournoi.placesTotal}`}
          />
          {tournoi.checkin && <Vignette label="Check-in" valeur={tournoi.checkin} />}
        </div>

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
            {tournoi.repartitionCashPrize.map((r) => (
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

        {organisateur && (
          <Link
            href={`/organisateur/${tournoi.id}/gestion`}
            className="flex items-center gap-2 p-3 mt-1"
            style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-accent-900)", color: "var(--ds-accent-300)" }}
          >
            <Settings2 size={16} strokeWidth={2} />
            <span className="text-sm font-medium">Gérer ce tournoi en direct</span>
          </Link>
        )}
      </div>

      <CtaInscription
        tournoiId={tournoi.id}
        titre={tournoi.titre}
        jeuLabel={tournoi.jeuLabel}
        dateLabel={tournoi.dateLabel}
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
