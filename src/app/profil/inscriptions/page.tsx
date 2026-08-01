"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppBar } from "@/components/ds/AppBar";
import { CarteTournoi } from "@/components/ds/CarteTournoi";
import { mesInscriptions } from "@/lib/mockInscriptions";
import { tournoiParId, estTermine, type Tournoi } from "@/lib/mockTournaments";

export default function MesInscriptionsPage() {
  const router = useRouter();
  const [tournois, setTournois] = useState<Tournoi[]>([]);

  useEffect(() => {
    const aVenir = mesInscriptions()
      .map((i) => tournoiParId(i.tournoiId))
      .filter((t): t is Tournoi => t !== undefined && !estTermine(t.id) && !t.annule);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTournois(aVenir);
  }, []);

  return (
    <div className="min-h-screen flex flex-col px-5 py-4 gap-4" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
      <AppBar retour titre="Mes inscriptions" onRetour={() => router.push("/profil")} />

      <div className="flex-1 flex flex-col gap-3">
        {tournois.map((t) => (
          <CarteTournoi key={t.id} tournoi={t} />
        ))}
        {tournois.length === 0 && (
          <p className="text-sm" style={{ color: "var(--ds-text-muted)" }}>
            Tu n&apos;es inscrit à aucun tournoi à venir pour l&apos;instant.
          </p>
        )}
      </div>
    </div>
  );
}
