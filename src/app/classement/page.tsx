"use client";

import { AppBar } from "@/components/ds/AppBar";
import { TabBar } from "@/components/ds/TabBar";
import { Classement } from "@/components/ds/Classement";
import { SAISON, SAISON_FIN_LABEL } from "@/lib/mockProfil";
import { useExigerConnexion } from "@/hooks/useExigerConnexion";

/** Titre "Ladder" (point 136) : vocabulaire esport plutôt que le terme
 * générique "Classement" — le libellé de l'onglet dans TabBar suit pareil.
 * Le repère de saison est passé en actions de l'AppBar pour partager sa
 * ligne (et donc son alignement vertical) avec le titre. */
export default function ClassementPage() {
  const connecte = useExigerConnexion();
  if (!connecte) return null;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}
    >
      <div className="px-5 pt-5">
        <AppBar
          titre="Ladder"
          actions={
            <div className="text-xs text-right" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
              <div>{SAISON}</div>
              <div>{SAISON_FIN_LABEL}</div>
            </div>
          }
        />
      </div>
      <div className="px-5 pt-2 pb-24 flex-1">
        <Classement />
      </div>
      <TabBar />
    </div>
  );
}
