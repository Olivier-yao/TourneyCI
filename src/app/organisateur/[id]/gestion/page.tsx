"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Trophy } from "lucide-react";
import { AppBar } from "@/components/ds/AppBar";
import { Field } from "@/components/ds/Input";
import { Button } from "@/components/ds/Button";
import { tournoiParId } from "@/lib/mockTournaments";
import { matchsDuTournoi } from "@/lib/mockBracket";
import { participantsBR } from "@/lib/mockBattleRoyale";
import { attribuerPoints } from "@/lib/mockProfil";
import { estOrganisateur } from "@/lib/mockAuth";
import { GestionMatches } from "./GestionMatches";

function SectionPoints({ jeuId, jeuLabel, villeParDefaut }: { jeuId: string; jeuLabel: string; villeParDefaut: string }) {
  const [nom, setNom] = useState("");
  const [points, setPoints] = useState("");
  const [ville, setVille] = useState(villeParDefaut);
  const [historique, setHistorique] = useState<{ nom: string; points: number }[]>([]);

  function attribuer() {
    const n = Number(points);
    if (!nom.trim() || !Number.isFinite(n) || n === 0) return;
    attribuerPoints(jeuId, nom.trim(), n, ville.trim() || villeParDefaut);
    setHistorique((h) => [{ nom: nom.trim(), points: n }, ...h]);
    setNom("");
    setPoints("");
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm" style={{ color: "var(--ds-text-muted)" }}>
        Ajoute des points au classement {jeuLabel} pour un participant (qualification, palier atteint,
        victoire finale...).
      </p>
      <div className="flex flex-col gap-2.5">
        <Field label="Participant" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Kader B." />
        <div className="grid grid-cols-2 gap-2.5">
          <Field
            label="Points"
            value={points}
            onChange={(e) => setPoints(e.target.value.replace(/[^0-9-]/g, ""))}
            placeholder="100"
          />
          <Field label="Ville" value={ville} onChange={(e) => setVille(e.target.value)} placeholder={villeParDefaut} />
        </div>
        <Button variante="secondary" onClick={attribuer} disabled={!nom.trim() || !points}>
          Attribuer les points
        </Button>
      </div>
      {historique.length > 0 && (
        <div className="flex flex-col gap-1.5 mt-1">
          {historique.map((h, i) => (
            <div key={i} className="flex items-center justify-between text-xs" style={{ color: "var(--ds-muted)" }}>
              <span>{h.nom}</span>
              <span style={{ fontFamily: "var(--ds-font-mono)", color: "var(--ds-accent-300)" }}>+{h.points} pts</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function GestionTournoiPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [autorise, setAutorise] = useState(false);
  const [, setRafraichir] = useState(0);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAutorise(estOrganisateur());
  }, []);

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
    <div className="min-h-screen flex flex-col px-5 py-4 gap-6" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
      <AppBar retour titre="Gestion en direct" onRetour={() => router.push(`/tournois/${params.id}`)} />

      <div>
        <div className="text-[11px]" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
          {tournoi.titre}
        </div>
        <div
          className="text-lg"
          style={{ fontFamily: "var(--ds-font-heading)", fontWeight: "var(--ds-heading-weight)" as React.CSSProperties["fontWeight"] }}
        >
          {tournoi.jeuLabel} · {tournoi.placesInscrites} inscrits
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="text-base font-medium flex items-center gap-2">
          <Trophy size={17} strokeWidth={2} style={{ color: "var(--ds-accent-300)" }} />
          {tournoi.type === "battle_royale" ? "Éliminations" : "Qualifications"}
        </div>

        {tournoi.type === "battle_royale" ? (
          <div className="flex flex-col gap-2">
            <p className="text-sm" style={{ color: "var(--ds-text-muted)" }}>
              {participantsBR(params.id).length > 0
                ? "Marque les joueurs éliminés au fur et à mesure de la manche."
                : "Aucun participant chargé pour ce battle royale pour l'instant."}
            </p>
            <Link
              href={`/tournois/${params.id}/battle-royale`}
              className="flex items-center gap-1.5 text-sm font-medium"
              style={{ color: "var(--ds-accent-300)" }}
            >
              <ArrowLeft size={14} className="rotate-180" />
              Ouvrir la gestion des éliminations
            </Link>
          </div>
        ) : (
          <GestionMatches
            tournoiId={params.id}
            matches={matchsDuTournoi(params.id)}
            onEnregistre={() => setRafraichir((n) => n + 1)}
          />
        )}
      </div>

      <div className="flex flex-col gap-3 pb-6">
        <div className="text-base font-medium">Attribution de points au classement</div>
        <SectionPoints jeuId={tournoi.jeuId} jeuLabel={tournoi.jeuLabel} villeParDefaut={tournoi.ville} />
      </div>
    </div>
  );
}
