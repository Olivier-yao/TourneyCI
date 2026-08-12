"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Wifi, Settings2, Share2, Check, MessageCircle } from "lucide-react";
import { ImagePlaceholder } from "@/components/ds/ImagePlaceholder";
import { ProgressBar } from "@/components/ds/ProgressBar";
import { AvatarPile } from "@/components/ds/Avatar";
import { Modal } from "@/components/ds/Modal";
import { formatXof } from "@/lib/formatXof";
import { tournoiParId, inscriptionsFermees, reevaluerPaiementsEnAttente, cashPrizeEnSequestre } from "@/lib/mockTournaments";
import { matchsDuTournoi } from "@/lib/mockBracket";
import { participantsBR } from "@/lib/mockBattleRoyale";
import { estOrganisateur } from "@/lib/mockAuth";
import { estInscrit } from "@/lib/mockInscriptions";
import { lireProfil } from "@/lib/mockProfil";
import { monAvisPourTournoi } from "@/lib/mockAvis";
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

export default function DetailTournoiPage() {
  const params = useParams<{ id: string }>();
  const tournoi = tournoiParId(params.id);
  const [organisateur, setOrganisateur] = useState(false);
  const [modaleOuverte, setModaleOuverte] = useState<"informations" | "reglement" | null>(null);
  const [fermeInscriptions, setFermeInscriptions] = useState(false);
  const [accesChat, setAccesChat] = useState(false);
  const [demanderAvis, setDemanderAvis] = useState(false);
  const [enSequestre, setEnSequestre] = useState(false);
  const [peutContester, setPeutContester] = useState(false);
  const [monAppel, setMonAppel] = useState<Appel | undefined>(undefined);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrganisateur(estOrganisateur());
    setAccesChat(estInscrit(params.id) || estOrganisateur());
    if (tournoi) setFermeInscriptions(inscriptionsFermees(tournoi));
    setDemanderAvis(Boolean(tournoi?.termine) && estInscrit(params.id) && !monAvisPourTournoi(params.id));
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
          <span style={{ color: "var(--ds-accent-300)" }}>{tournoi.organisateur}</span> ·{" "}
          {tournoi.dateLabel}
        </p>

        {demanderAvis && (
          <AvisCoeur
            tournoiId={tournoi.id}
            tournoiTitre={tournoi.titre}
            organisateur={tournoi.organisateur}
            onEnvoye={() => {
              setDemanderAvis(false);
              reevaluerPaiementsEnAttente();
              setEnSequestre(cashPrizeEnSequestre(tournoi.id));
            }}
          />
        )}

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

        {aUnBracket && (
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
        fraisXof={tournoi.fraisXof}
        typeCompetition={tournoi.type}
        equipes={tournoi.equipes}
        modeEquipe={tournoi.modeEquipe}
        tournoiCommence={tournoi.enDirect || Boolean(tournoi.termine) || Boolean(tournoi.annule)}
        fermeInscriptions={fermeInscriptions}
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
