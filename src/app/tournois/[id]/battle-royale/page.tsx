"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Skull } from "lucide-react";
import { estOrganisateur } from "@/lib/mockAuth";
import { tournoiParId } from "@/lib/mockTournaments";
import { participantsBR, type ParticipantBR } from "@/lib/mockBattleRoyale";

export default function BattleRoyalePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const tournoi = tournoiParId(params.id);
  const [participants, setParticipants] = useState<ParticipantBR[]>(() =>
    participantsBR(params.id),
  );
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

  const enJeu = participants.filter((p) => p.statut === "en_jeu");
  const elimines = [...participants]
    .filter((p) => p.statut === "elimine")
    .sort((a, b) => (b.ordreElimination ?? 0) - (a.ordreElimination ?? 0));

  function eliminer(id: string) {
    if (!window.confirm("Marquer ce joueur comme éliminé ?")) return;
    const ordreMax = Math.max(0, ...participants.map((p) => p.ordreElimination ?? 0));
    setParticipants((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, statut: "elimine", ordreElimination: ordreMax + 1 } : p,
      ),
    );
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
      </div>
    </div>
  );
}
