"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Wifi, Settings2 } from "lucide-react";
import { ImagePlaceholder } from "@/components/ds/ImagePlaceholder";
import { ProgressBar } from "@/components/ds/ProgressBar";
import { AvatarPile } from "@/components/ds/Avatar";
import { formatXof } from "@/lib/formatXof";
import { tournoiParId } from "@/lib/mockTournaments";
import { matchsDuTournoi } from "@/lib/mockBracket";
import { participantsBR } from "@/lib/mockBattleRoyale";
import { estOrganisateur } from "@/lib/mockAuth";
import { CtaInscription } from "./CtaInscription";

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

export default function DetailTournoiPage() {
  const params = useParams<{ id: string }>();
  const tournoi = tournoiParId(params.id);
  const [organisateur, setOrganisateur] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrganisateur(estOrganisateur());
  }, []);

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
        <ImagePlaceholder label="bannière du tournoi" hauteur={210} />
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

        <h1
          className="text-2xl leading-tight"
          style={{
            fontFamily: "var(--ds-font-heading)",
            fontWeight: "var(--ds-heading-weight)" as React.CSSProperties["fontWeight"],
          }}
        >
          {tournoi.titre}
        </h1>

        <p className="text-[13px]" style={{ color: "var(--ds-muted)" }}>
          Organisé par{" "}
          <span style={{ color: "var(--ds-accent-300)" }}>{tournoi.organisateur}</span> ·{" "}
          {tournoi.dateLabel}
        </p>

        <div className="grid grid-cols-2 gap-2 mt-1">
          <Vignette label="Cash prize" valeur={formatXof(tournoi.cashPrizeXof)} />
          <Vignette label="Frais" valeur={formatXof(tournoi.fraisXof)} />
          <Vignette
            label="Places"
            valeur={`${tournoi.placesInscrites} / ${tournoi.placesTotal}`}
          />
          <Vignette label="Check-in" valeur={tournoi.checkin} />
        </div>

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

        <p className="text-sm mt-1 leading-relaxed" style={{ color: "var(--ds-text-muted)" }}>
          {tournoi.reglement}
        </p>

        {aUnBracket && (
          <Link
            href={lienBracket}
            className="text-sm font-medium mt-1"
            style={{ color: "var(--ds-accent-300)" }}
          >
            {tournoi.type === "battle_royale" ? "Voir le classement en direct →" : "Voir le bracket →"}
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
      />
    </div>
  );
}
