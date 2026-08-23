"use client";

import { useEffect, useState } from "react";
import { AppBar } from "@/components/ds/AppBar";
import { TabBar } from "@/components/ds/TabBar";
import { Classement } from "@/components/ds/Classement";
import { saisonActuelleClient, type SaisonClassement } from "@/lib/mockProfil";
import { useExigerConnexion } from "@/hooks/useExigerConnexion";

function finDansLabel(finLe: number): string {
  const joursRestants = Math.ceil((finLe - Date.now()) / (24 * 60 * 60 * 1000));
  if (joursRestants <= 0) return "se termine aujourd'hui";
  if (joursRestants === 1) return "se termine demain";
  return `se termine dans ${joursRestants} jours`;
}

/** Titre "Ladder" (point 136) : vocabulaire esport plutôt que le terme
 * générique "Classement" — le libellé de l'onglet dans TabBar suit pareil.
 * Le repère de saison est passé en actions de l'AppBar pour partager sa
 * ligne (et donc son alignement vertical) avec le titre — désormais une
 * vraie saison (cf. src/lib/server/saisons.ts), plus un texte fixe. */
export default function ClassementPage() {
  const connecte = useExigerConnexion();
  const [saison, setSaison] = useState<SaisonClassement | undefined>(undefined);

  useEffect(() => {
    saisonActuelleClient().then(setSaison);
  }, []);

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
            saison && (
              <div className="text-xs text-right" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                <div>Saison {saison.numero} : {saison.nom}</div>
                <div>{finDansLabel(saison.finLe)}</div>
              </div>
            )
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
