"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Minus, Plus, ListPlus } from "lucide-react";
import { estOrganisateur } from "@/lib/mockAuth";
import { tournoiParId } from "@/lib/mockTournaments";
import {
  unitesBR,
  manchesBR,
  ajouterMancheBR,
  classementCumuleBR,
  type SousTypeBR,
} from "@/lib/mockBattleRoyale";

const RAFRAICHISSEMENT_MS = 15_000;

function SaisieManche({
  tournoiId,
  sousType,
  numeroSuivant,
  onValide,
}: {
  tournoiId: string;
  sousType: SousTypeBR;
  numeroSuivant: number;
  onValide: () => void;
}) {
  const participants = unitesBR(tournoiId, sousType);
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
    setPlacements({});
    setEliminations({});
    onValide();
  }

  return (
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
  );
}

export default function BattleRoyalePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const tournoi = tournoiParId(params.id);
  const [rafraichir, setRafraichir] = useState(0);
  const [saisieOuverte, setSaisieOuverte] = useState(false);
  const [organisateur, setOrganisateur] = useState(false);
  const [manches, setManches] = useState<ReturnType<typeof manchesBR>>([]);
  const [classement, setClassement] = useState<ReturnType<typeof classementCumuleBR>>([]);

  useEffect(() => {
    const id = setInterval(() => setRafraichir((n) => n + 1), RAFRAICHISSEMENT_MS);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    // État lu depuis le localStorage : neutre au premier rendu serveur,
    // synchronisé côté client une fois monté (évite un mismatch d'hydratation).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrganisateur(estOrganisateur());
    setManches(manchesBR(params.id));
    setClassement(classementCumuleBR(params.id, tournoi?.brSousType ?? "solo"));
  }, [params.id, saisieOuverte, rafraichir, tournoi?.brSousType]);

  if (!tournoi) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
        Tournoi introuvable.
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col px-5 py-5" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="text-[11px]" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
            {tournoi.titre} · {manches.length} manche{manches.length > 1 ? "s" : ""}
          </div>
          <div
            className="text-xl"
            style={{ fontFamily: "var(--ds-font-heading)", fontWeight: "var(--ds-heading-weight)" as React.CSSProperties["fontWeight"] }}
          >
            Classement en direct
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

      <div className="flex-1 flex flex-col gap-4">
        {organisateur && (
          <>
            {saisieOuverte ? (
              <SaisieManche
                tournoiId={params.id}
                sousType={tournoi.brSousType ?? "solo"}
                numeroSuivant={manches.length + 1}
                onValide={() => {
                  setSaisieOuverte(false);
                  setRafraichir((n) => n + 1);
                }}
              />
            ) : (
              <button
                type="button"
                onClick={() => setSaisieOuverte(true)}
                className="flex items-center justify-center gap-2 h-11 text-sm font-medium cursor-pointer"
                style={{ borderRadius: "var(--ds-radius-btn)", background: "var(--ds-accent-900)", color: "var(--ds-accent-300)" }}
              >
                <ListPlus size={16} strokeWidth={2} />
                Saisir la manche {manches.length + 1}
              </button>
            )}
          </>
        )}

        {classement.every((l) => l.points === 0) ? (
          <p className="text-sm" style={{ color: "var(--ds-text-muted)" }}>
            Aucune manche jouée pour l&apos;instant.
          </p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {classement.map((l, i) => (
              <div
                key={l.participantId}
                className="flex items-center gap-3 p-3"
                style={{
                  borderRadius: "var(--ds-radius-md)",
                  background: l.qualifie ? "color-mix(in srgb, var(--ds-accent) 8%, var(--ds-surface))" : "var(--ds-surface)",
                  border: `1px solid ${l.qualifie ? "var(--ds-accent-600)" : "var(--ds-border)"}`,
                }}
              >
                <span className="w-6 text-xs text-center" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                  #{i + 1}
                </span>
                <span className="text-sm flex-1 truncate">{l.nom}</span>
                <span className="text-xs" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                  {l.manchesJouees} manche{l.manchesJouees > 1 ? "s" : ""}
                </span>
                <span className="text-sm font-semibold w-10 text-right" style={{ color: "var(--ds-accent-300)", fontFamily: "var(--ds-font-mono)" }}>
                  {l.points} pt
                </span>
                {l.qualifie && (
                  <span
                    className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1"
                    style={{ borderRadius: "var(--ds-radius-pill)", background: "var(--ds-accent-900)", color: "var(--ds-accent-300)" }}
                  >
                    <CheckCircle2 size={11} strokeWidth={2} />
                    Qualifié
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {manches.length > 0 && (
          <div className="flex flex-col gap-2 mt-2">
            <div className="text-[11px] uppercase tracking-wide" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
              Barème par manche : 1er 10 pts · 2e 6 · 3e 5 · 4e 4 · 5e 3 · 6e 2 · 7e-8e 1 · + 1 pt / élimination
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
