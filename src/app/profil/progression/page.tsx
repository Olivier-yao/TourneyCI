"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle } from "lucide-react";
import { AppBar } from "@/components/ds/AppBar";
import { BadgePalier } from "@/components/ds/Palier";
import { lireProfil, mesPointsCumules, palierActuel, palierSuivant, PALIERS } from "@/lib/mockProfil";
import { useExigerConnexion } from "@/hooks/useExigerConnexion";

export default function ProgressionPage() {
  const connecte = useExigerConnexion();
  const router = useRouter();
  const [matchsJoues, setMatchsJoues] = useState(0);
  const [points, setPoints] = useState(0);
  const [rangNational, setRangNational] = useState(0);

  useEffect(() => {
    const profil = lireProfil();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMatchsJoues(profil.matchsJoues);
    setPoints(mesPointsCumules());
    setRangNational(profil.rangNational);
  }, []);

  if (!connecte) return null;

  const actuel = palierActuel(matchsJoues, points);
  const suivant = palierSuivant(actuel.id);
  const progression = suivant
    ? Math.min(100, Math.round((Math.min(points, suivant.pointsRequis) / suivant.pointsRequis) * 100))
    : 100;

  return (
    <div className="min-h-screen flex flex-col px-5 py-4 gap-5" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
      <AppBar retour titre="Ma progression" onRetour={() => router.push("/profil")} />

      <div
        className="p-[18px] flex flex-col gap-3.5"
        style={{
          borderRadius: "var(--ds-radius-lg)",
          background: "radial-gradient(120% 130% at 22% 0%, var(--ds-accent-900), var(--ds-surface))",
          boxShadow: "0 0 0 1px var(--ds-accent-700)",
        }}
      >
        <div className="flex items-center gap-3.5">
          <BadgePalier palier={actuel} taille="lg" />
          <div>
            <div className="text-[10px] uppercase tracking-wide" style={{ color: "var(--ds-accent-400)", fontFamily: "var(--ds-font-mono)" }}>
              Palier actuel · {actuel.id + 1} sur {PALIERS.length}
            </div>
            <div className="mt-0.5 text-2xl" style={{ fontFamily: "var(--ds-font-heading)", fontWeight: "var(--ds-heading-weight)" as React.CSSProperties["fontWeight"] }}>
              {actuel.nom}
            </div>
            <div className="text-[10px]" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
              #{rangNational} NATIONAL · {points.toLocaleString("fr-FR")} PTS
            </div>
          </div>
        </div>

        {suivant && (
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span style={{ color: "var(--ds-muted)" }}>Vers {suivant.nom}</span>
              <span style={{ color: "var(--ds-accent-300)", fontFamily: "var(--ds-font-mono)" }}>
                {Math.min(points, suivant.pointsRequis).toLocaleString("fr-FR")} / {suivant.pointsRequis.toLocaleString("fr-FR")}
              </span>
            </div>
            <div className="h-[3px] rounded-full overflow-hidden" style={{ background: "var(--ds-surface-2)" }}>
              <div
                className="h-[3px] rounded-full"
                style={{ width: `${progression}%`, background: "linear-gradient(90deg, var(--ds-accent-700), var(--ds-accent-400))" }}
              />
            </div>
          </div>
        )}

        {suivant && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2.5 text-xs">
              {matchsJoues >= suivant.matchsRequis ? (
                <CheckCircle2 size={15} strokeWidth={2} style={{ color: "var(--ds-accent-400)" }} />
              ) : (
                <Circle size={15} strokeWidth={2} style={{ color: "var(--ds-muted)" }} />
              )}
              <span className="flex-1" style={{ color: matchsJoues >= suivant.matchsRequis ? "var(--ds-text)" : "var(--ds-muted)" }}>
                {suivant.matchsRequis} matchs joués
              </span>
              <span style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                {matchsJoues} / {suivant.matchsRequis}
              </span>
            </div>
            <div className="flex items-center gap-2.5 text-xs">
              {points >= suivant.pointsRequis ? (
                <CheckCircle2 size={15} strokeWidth={2} style={{ color: "var(--ds-accent-400)" }} />
              ) : (
                <Circle size={15} strokeWidth={2} style={{ color: "var(--ds-muted)" }} />
              )}
              <span className="flex-1" style={{ color: points >= suivant.pointsRequis ? "var(--ds-text)" : "var(--ds-muted)" }}>
                {suivant.pointsRequis.toLocaleString("fr-FR")} points cumulés
              </span>
              <span style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                {points >= suivant.pointsRequis ? "atteint" : `${(suivant.pointsRequis - points).toLocaleString("fr-FR")} restants`}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <div className="text-[10px] uppercase tracking-wide mb-1" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
          Les six paliers
        </div>
        {PALIERS.map((p) => {
          const cur = p.id === actuel.id;
          const atteint = p.id <= actuel.id;
          return (
            <div
              key={p.id}
              className="flex items-center gap-3 py-2.5 px-2.5 -mx-2.5"
              style={{
                borderRadius: "var(--ds-radius-md)",
                background: cur ? "var(--ds-surface)" : "transparent",
                boxShadow: cur ? "0 0 0 1px var(--ds-accent)" : undefined,
              }}
            >
              <BadgePalier palier={p} taille="md" />
              <div className="flex-1">
                <div className="text-sm font-medium" style={{ color: atteint ? "var(--ds-text)" : "var(--ds-muted)" }}>
                  {p.nom}
                </div>
                <div className="text-[10px]" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                  {p.matchsRequis} matchs · {p.pointsRequis.toLocaleString("fr-FR")} pts
                </div>
              </div>
              <div className="text-[9px]" style={{ color: cur ? "var(--ds-accent-300)" : atteint ? "var(--ds-muted)" : "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                {cur ? "ACTUEL" : atteint ? "ATTEINT" : "À VENIR"}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] pb-6" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
        RECALCULÉ APRÈS CHAQUE TOURNOI TERMINÉ
      </p>
    </div>
  );
}
