"use client";

import { useState } from "react";
import Link from "next/link";
import { Minus, Plus } from "lucide-react";
import { unitesBR, manchesBR, ajouterMancheBR, type SousTypeBR } from "@/lib/mockBattleRoyale";
import { notifierParticipants } from "@/lib/mockNotifications";

export function GestionManchesBR({
  tournoiId,
  tournoiTitre,
  sousType,
  onEnregistre,
}: {
  tournoiId: string;
  tournoiTitre: string;
  sousType: SousTypeBR;
  onEnregistre: () => void;
}) {
  const participants = unitesBR(tournoiId, sousType);
  const manches = manchesBR(tournoiId);
  const numeroSuivant = manches.length + 1;
  const [placements, setPlacements] = useState<Record<string, string>>({});
  const [eliminations, setEliminations] = useState<Record<string, number>>({});

  function stepper(id: string, delta: number) {
    setEliminations((e) => ({ ...e, [id]: Math.max(0, (e[id] ?? 0) + delta) }));
  }

  function valider() {
    const resultats = participants
      .map((p) => ({
        participantId: p.id,
        placement: Number(placements[p.id]) || 0,
        eliminations: eliminations[p.id] ?? 0,
      }))
      .filter((r) => r.placement > 0 || r.eliminations > 0);
    if (resultats.length === 0) return;
    ajouterMancheBR(tournoiId, resultats);
    notifierParticipants(tournoiId, tournoiTitre, `Manche ${numeroSuivant} enregistrée — classement mis à jour`);
    setPlacements({});
    setEliminations({});
    onEnregistre();
  }

  if (participants.length === 0) {
    return (
      <p className="text-sm" style={{ color: "var(--ds-text-muted)" }}>
        Aucun participant chargé pour ce battle royale pour l&apos;instant.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm" style={{ color: "var(--ds-text-muted)" }}>
        Marque les joueurs éliminés et le placement final au fur et à mesure de la manche.
      </p>
      <div
        className="flex flex-col gap-2.5 p-3"
        style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: "1px solid var(--ds-border)" }}
      >
        <div className="text-sm font-bold" style={{ color: "var(--ds-accent-300)" }}>
          Manche {numeroSuivant}
        </div>
        <div className="flex flex-col gap-1.5 max-h-72 overflow-y-auto">
          {participants.map((p) => (
            <div key={p.id} className="flex items-center gap-2">
              <span className="text-sm flex-1 truncate">{p.nom}</span>
              <input
                type="number"
                min={0}
                placeholder="Place"
                value={placements[p.id] ?? ""}
                onChange={(e) => setPlacements((v) => ({ ...v, [p.id]: e.target.value }))}
                className="text-sm text-center"
                style={{
                  width: 56,
                  height: 32,
                  borderRadius: "var(--ds-radius-sm)",
                  background: "var(--ds-bg)",
                  border: "1px solid var(--ds-border)",
                  color: "var(--ds-text)",
                }}
              />
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => stepper(p.id, -1)}
                  className="flex items-center justify-center w-7 h-7 cursor-pointer"
                  style={{ borderRadius: "var(--ds-radius-sm)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}
                >
                  <Minus size={12} strokeWidth={2} />
                </button>
                <span className="w-5 text-center text-xs" style={{ fontFamily: "var(--ds-font-mono)" }}>
                  {eliminations[p.id] ?? 0}
                </span>
                <button
                  type="button"
                  onClick={() => stepper(p.id, 1)}
                  className="flex items-center justify-center w-7 h-7 cursor-pointer"
                  style={{ borderRadius: "var(--ds-radius-sm)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}
                >
                  <Plus size={12} strokeWidth={2} />
                </button>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={valider}
          className="h-9 text-sm font-medium cursor-pointer"
          style={{ borderRadius: "var(--ds-radius-sm)", background: "var(--ds-accent-900)", color: "var(--ds-accent-300)" }}
        >
          Valider la manche
        </button>
      </div>
      <Link
        href={`/tournois/${tournoiId}/battle-royale`}
        className="text-sm font-medium"
        style={{ color: "var(--ds-accent-300)" }}
      >
        Voir le classement en direct →
      </Link>
    </div>
  );
}
