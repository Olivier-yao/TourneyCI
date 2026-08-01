"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Skull } from "lucide-react";
import { estOrganisateur } from "@/lib/mockAuth";
import { tournoiParId } from "@/lib/mockTournaments";
import {
  participantsBR,
  filActionsBR,
  eliminerParticipantBR,
  ajouterActionBR,
  ACTIONS_PREDEFINIES,
} from "@/lib/mockBattleRoyale";

function tempsEcoule(horodatage: number): string {
  const secondes = Math.max(0, Math.round((Date.now() - horodatage) / 1000));
  if (secondes < 60) return "à l'instant";
  const minutes = Math.round(secondes / 60);
  return `il y a ${minutes} min`;
}

function FormulaireAction({ noms, tournoiId, onAjoute }: { noms: string[]; tournoiId: string; onAjoute: () => void }) {
  const [acteur, setActeur] = useState("");
  const [cible, setCible] = useState("");
  const [actionId, setActionId] = useState(ACTIONS_PREDEFINIES[0].id);

  function ajouter() {
    if (!acteur || !cible || acteur === cible) return;
    ajouterActionBR(tournoiId, acteur, cible, actionId);
    onAjoute();
  }

  const selectStyle: React.CSSProperties = {
    borderRadius: "var(--ds-radius-sm)",
    background: "var(--ds-bg)",
    border: "1px solid var(--ds-border)",
    color: "var(--ds-text)",
    height: 38,
    padding: "0 10px",
  };

  return (
    <div
      className="flex flex-col gap-2.5 p-3"
      style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: "1px solid var(--ds-border)" }}
    >
      <div className="grid grid-cols-2 gap-2">
        <select value={acteur} onChange={(e) => setActeur(e.target.value)} style={selectStyle} className="text-sm">
          <option value="">Qui ?</option>
          {noms.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        <select value={cible} onChange={(e) => setCible(e.target.value)} style={selectStyle} className="text-sm">
          <option value="">Sur qui ?</option>
          {noms.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {ACTIONS_PREDEFINIES.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => setActionId(a.id)}
            className="px-2.5 py-1.5 text-xs cursor-pointer"
            style={{
              borderRadius: "var(--ds-radius-pill)",
              border: `1px solid ${actionId === a.id ? "var(--ds-accent)" : "var(--ds-border)"}`,
              color: actionId === a.id ? "var(--ds-accent-300)" : "var(--ds-muted)",
            }}
          >
            {a.libelle}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={ajouter}
        disabled={!acteur || !cible || acteur === cible}
        className="h-9 text-sm font-medium cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ borderRadius: "var(--ds-radius-sm)", background: "var(--ds-accent-900)", color: "var(--ds-accent-300)" }}
      >
        Ajouter au fil
      </button>
    </div>
  );
}

export default function BattleRoyalePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const tournoi = tournoiParId(params.id);
  const [, setRafraichir] = useState(0);
  const organisateur = estOrganisateur();

  if (!tournoi) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}
      >
        Tournoi introuvable.
      </div>
    );
  }

  const participants = participantsBR(params.id);
  const actions = filActionsBR(params.id);
  const enJeu = participants.filter((p) => p.statut === "en_jeu");
  const elimines = [...participants]
    .filter((p) => p.statut === "elimine")
    .sort((a, b) => (b.ordreElimination ?? 0) - (a.ordreElimination ?? 0));
  const noms = participants.map((p) => p.nom);

  function eliminer(id: string) {
    if (!window.confirm("Marquer ce joueur comme éliminé ?")) return;
    eliminerParticipantBR(params.id, id);
    setRafraichir((n) => n + 1);
  }

  return (
    <div
      className="min-h-screen flex flex-col px-5 py-5"
      style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="text-[11px]" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
            {tournoi.titre}
          </div>
          <div
            className="text-xl"
            style={{
              fontFamily: "var(--ds-font-heading)",
              fontWeight: "var(--ds-heading-weight)" as React.CSSProperties["fontWeight"],
            }}
          >
            Battle Royale
          </div>
        </div>
        <button
          type="button"
          onClick={() => router.push(`/tournois/${params.id}`)}
          className="flex items-center justify-center w-9 h-9 cursor-pointer"
          style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}
        >
          <ArrowLeft size={17} strokeWidth={2} />
        </button>
      </div>

      <div className="flex-1 flex flex-col gap-6">
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="text-sm font-bold" style={{ color: "var(--ds-accent-300)" }}>
              En jeu
            </div>
            <div className="text-xs" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
              {enJeu.length} restants
            </div>
          </div>
          {enJeu.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between gap-3 p-3"
              style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: "1px solid var(--ds-border)" }}
            >
              <span className="text-sm font-medium">{p.nom}</span>
              {organisateur && (
                <button
                  type="button"
                  onClick={() => eliminer(p.id)}
                  className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 cursor-pointer"
                  style={{ borderRadius: "var(--ds-radius-pill)", border: "1px solid var(--ds-danger)", color: "var(--ds-danger)" }}
                >
                  <Skull size={13} strokeWidth={2} />
                  Éliminer
                </button>
              )}
            </div>
          ))}
        </div>

        {elimines.length > 0 && (
          <div className="flex flex-col gap-2.5">
            <div className="text-sm font-bold" style={{ color: "var(--ds-danger)" }}>
              Éliminés
            </div>
            {elimines.map((p, i) => (
              <div
                key={p.id}
                className="flex items-center gap-3 p-3"
                style={{
                  borderRadius: "var(--ds-radius-md)",
                  background: "color-mix(in srgb, var(--ds-danger) 10%, var(--ds-surface))",
                  border: "1px solid color-mix(in srgb, var(--ds-danger) 40%, transparent)",
                }}
              >
                <span
                  className="w-6 text-xs"
                  style={{ color: "var(--ds-danger)", fontFamily: "var(--ds-font-mono)" }}
                >
                  #{i + 1 + enJeu.length}
                </span>
                <span className="text-sm flex-1" style={{ color: "var(--ds-danger)" }}>
                  {p.nom}
                </span>
              </div>
            ))}
          </div>
        )}

        {noms.length > 0 && (
          <div className="flex flex-col gap-2.5">
            <div className="text-sm font-bold" style={{ color: "var(--ds-text)" }}>
              Fil de la partie
            </div>
            {organisateur && (
              <FormulaireAction noms={noms} tournoiId={params.id} onAjoute={() => setRafraichir((n) => n + 1)} />
            )}
            {actions.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--ds-text-muted)" }}>
                Aucune action signalée pour l&apos;instant.
              </p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {actions.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center gap-2 py-2 text-sm"
                    style={{ borderBottom: "1px solid var(--ds-border)" }}
                  >
                    <span className="flex-1">
                      <span style={{ color: "var(--ds-accent-300)", fontWeight: 600 }}>{a.acteur}</span>{" "}
                      {a.libelle}{" "}
                      <span style={{ color: "var(--ds-accent-300)", fontWeight: 600 }}>{a.cible}</span>
                    </span>
                    <span className="text-xs shrink-0" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                      {tempsEcoule(a.horodatage)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
