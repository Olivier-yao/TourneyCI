"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Trophy } from "lucide-react";
import { AppBar } from "@/components/ds/AppBar";
import { tournoiParId } from "@/lib/mockTournaments";
import { matchsDuTournoi } from "@/lib/mockBracket";
import { nomOrganisateurActuel } from "@/lib/mockOrganisateur";
import { GestionMatches } from "../gestion/GestionMatches";
import { GestionManchesBR } from "../gestion/GestionManchesBR";

/** Écran dédié à la qualification/saisie des scores (point 129), à l'écart de
 * l'écran principal de gestion en direct — même traitement que Paramètres et
 * Infos de room. */
export default function QualificationTournoiPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [autorise, setAutorise] = useState(false);
  const [, setRafraichir] = useState(0);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAutorise(tournoiParId(params.id)?.organisateur === nomOrganisateurActuel());
  }, [params.id]);

  const tournoi = tournoiParId(params.id);

  if (!tournoi) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-6 text-center" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
        <p>Tournoi introuvable.</p>
        <Link href="/tournois" style={{ color: "var(--ds-accent-300)" }}>Retour aux tournois</Link>
      </div>
    );
  }

  if (!autorise) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-6 text-center" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
        <p>Cette page est réservée aux organisateurs.</p>
        <Link href={`/tournois/${params.id}`} style={{ color: "var(--ds-accent-300)" }}>Retour au tournoi</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col px-5 py-4 gap-5 pb-10" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
      <AppBar retour titre={tournoi.type === "battle_royale" ? "Éliminations" : "Qualifications"} onRetour={() => router.back()} />

      <div className="text-base font-medium flex items-center gap-2">
        <Trophy size={17} strokeWidth={2} style={{ color: "var(--ds-accent-300)" }} />
        {tournoi.type === "battle_royale" ? "Éliminations" : "Qualifications"}
      </div>

      {tournoi.type === "battle_royale" ? (
        <GestionManchesBR
          tournoiId={params.id}
          tournoiTitre={tournoi.titre}
          sousType={tournoi.brSousType ?? "solo"}
          onEnregistre={() => setRafraichir((n) => n + 1)}
        />
      ) : (
        <GestionMatches
          tournoiId={params.id}
          tournoiTitre={tournoi.titre}
          matches={matchsDuTournoi(params.id)}
          onEnregistre={() => setRafraichir((n) => n + 1)}
        />
      )}
    </div>
  );
}
