"use client";

import { useState } from "react";
import Link from "next/link";
import { Minus, Plus, Info } from "lucide-react";
import { unitesBR, manchesBR, ajouterMancheBR, type SousTypeBR } from "@/lib/mockBattleRoyale";
import { notifierParticipants } from "@/lib/mockNotifications";
import { Modal } from "@/components/ds/Modal";
import { PRESS } from "@/components/ds/Button";

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
  const [confirmationOuverte, setConfirmationOuverte] = useState(false);

  function stepper(id: string, delta: number) {
    setEliminations((e) => ({ ...e, [id]: Math.max(0, (e[id] ?? 0) + delta) }));
  }

  const resultatsPrets = participants
    .map((p) => ({
      participantId: p.id,
      placement: Number(placements[p.id]) || 0,
      eliminations: eliminations[p.id] ?? 0,
    }))
    .filter((r) => r.placement > 0 || r.eliminations > 0);

  function cloturer() {
    if (resultatsPrets.length === 0) return;
    ajouterMancheBR(tournoiId, resultatsPrets);
    notifierParticipants(tournoiId, tournoiTitre, `Manche ${numeroSuivant} enregistrée — classement mis à jour`);
    setPlacements({});
    setEliminations({});
    setConfirmationOuverte(false);
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
          onClick={() => setConfirmationOuverte(true)}
          disabled={resultatsPrets.length === 0}
          className="h-9 text-sm font-medium cursor-pointer disabled:opacity-40"
          style={{ borderRadius: "var(--ds-radius-sm)", background: "var(--ds-accent-900)", color: "var(--ds-accent-300)" }}
        >
          Clôturer la manche
        </button>
      </div>
      <Link
        href={`/tournois/${tournoiId}/battle-royale`}
        className="text-sm font-medium"
        style={{ color: "var(--ds-accent-300)" }}
      >
        Voir le classement en direct →
      </Link>

      <Modal ouvert={confirmationOuverte} titre={`Clôturer la manche ${numeroSuivant}`} onFermer={() => setConfirmationOuverte(false)}>
        <div className="flex flex-col gap-2.5 not-italic" style={{ whiteSpace: "normal" }}>
          <p className="text-sm" style={{ color: "var(--ds-text-muted)" }}>
            {resultatsPrets.length} résultat{resultatsPrets.length > 1 ? "s" : ""} vont être enregistrés. Le classement de la manche
            {" "}{numeroSuivant} sera figé et communiqué aux participants — vérifie les placements et éliminations avant de continuer.
          </p>
          <div className="flex items-start gap-2 p-3" style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: "1px solid var(--ds-border)" }}>
            <Info size={15} strokeWidth={2} style={{ color: "var(--ds-muted)" }} className="shrink-0 mt-0.5" />
            <p className="text-xs" style={{ color: "var(--ds-muted)" }}>
              En cas d&apos;erreur ou d&apos;incident nécessitant l&apos;annulation du tournoi, cette clôture de manche ne l&apos;empêche
              pas : utilise la demande d&apos;annulation motivée depuis la section Clôture du tournoi, elle sera examinée par
              l&apos;administration.
            </p>
          </div>
        </div>
        <div className="flex gap-2 pt-3">
          <button
            type="button"
            onClick={() => setConfirmationOuverte(false)}
            className={`flex-1 h-10 text-sm font-medium ${PRESS}`}
            style={{ borderRadius: "var(--ds-radius-sm)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={cloturer}
            className={`flex-1 h-10 text-sm font-medium ${PRESS}`}
            style={{ borderRadius: "var(--ds-radius-sm)", background: "var(--ds-btn-primary-bg)", color: "var(--ds-btn-primary-text)" }}
          >
            Confirmer la clôture
          </button>
        </div>
      </Modal>
    </div>
  );
}
