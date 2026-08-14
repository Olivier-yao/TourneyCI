"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Trophy, CheckCircle2, XCircle } from "lucide-react";
import { AppBar } from "@/components/ds/AppBar";
import { Field } from "@/components/ds/Input";
import { Button } from "@/components/ds/Button";
import { tournoiParId, terminerTournoi, annulerTournoi } from "@/lib/mockTournaments";
import { matchsDuTournoi, classementFinalBracket } from "@/lib/mockBracket";
import { classementFinalBR } from "@/lib/mockBattleRoyale";
import { attribuerPoints } from "@/lib/mockProfil";
import { estOrganisateur } from "@/lib/mockAuth";
import { GestionMatches } from "./GestionMatches";
import { GestionManchesBR } from "./GestionManchesBR";

function SectionCloture({
  tournoiId,
  type,
  brSousType,
  termine,
  onTermine,
}: {
  tournoiId: string;
  type: "1v1" | "equipes" | "battle_royale";
  brSousType?: "solo" | "duo" | "squad";
  termine: boolean;
  onTermine: () => void;
}) {
  const [resultat, setResultat] = useState<{ pointsAttribues: number; gainCredite: number } | null>(null);

  const classement = type === "battle_royale" ? classementFinalBR(tournoiId, brSousType ?? "solo") : classementFinalBracket(tournoiId);
  const pret = classement.length > 0;

  function terminer() {
    if (!window.confirm("Clôturer le tournoi ? Les points seront attribués automatiquement selon le classement final et ne pourront plus être recalculés.")) {
      return;
    }
    const r = terminerTournoi(tournoiId);
    setResultat(r);
    onTermine();
  }

  function annuler() {
    if (!window.confirm("Annuler ce tournoi ? Ça compte contre ta réputation d'organisateur.")) return;
    annulerTournoi(tournoiId);
    onTermine();
  }

  if (termine || resultat) {
    return (
      <div
        className="flex items-center gap-2 p-3"
        style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-accent-900)", color: "var(--ds-accent-300)" }}
      >
        <CheckCircle2 size={17} strokeWidth={2} />
        <span className="text-sm">
          Tournoi clôturé — points attribués automatiquement{resultat && resultat.gainCredite > 0 ? `, ${resultat.gainCredite.toLocaleString("fr-FR")} F en attente de vérification (séquestre le temps de recueillir les avis)` : ""}.
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      <p className="text-sm" style={{ color: "var(--ds-text-muted)" }}>
        {pret
          ? "Le classement final est prêt : la clôture attribue les points de façon automatique et équilibrée selon la place de chacun, et crédite le cash prize aux gagnants."
          : type === "battle_royale"
            ? "Élimine les participants jusqu'au dernier survivant pour pouvoir clôturer."
            : "Termine la finale du bracket pour pouvoir clôturer le tournoi."}
      </p>
      <div className="flex gap-2">
        <Button variante="primary" onClick={terminer} disabled={!pret}>
          Terminer le tournoi
        </Button>
        <button
          type="button"
          onClick={annuler}
          className="flex items-center gap-1.5 px-3 text-sm cursor-pointer"
          style={{ color: "var(--ds-danger)" }}
        >
          <XCircle size={15} strokeWidth={2} />
          Annuler le tournoi
        </button>
      </div>
    </div>
  );
}

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

      <Link
        href={`/tournois/${params.id}/inscrits`}
        className="flex items-center gap-2 p-3"
        style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: "1px solid var(--ds-border)" }}
      >
        <CheckCircle2 size={16} strokeWidth={2} style={{ color: "var(--ds-accent-300)" }} />
        <span className="text-sm font-medium" style={{ color: "var(--ds-accent-300)" }}>Check-in des inscrits</span>
      </Link>

      <div className="flex flex-col gap-3">
        <div className="text-base font-medium flex items-center gap-2">
          <Trophy size={17} strokeWidth={2} style={{ color: "var(--ds-accent-300)" }} />
          {tournoi.type === "battle_royale" ? "Éliminations" : "Qualifications"}
        </div>

        {tournoi.type === "battle_royale" ? (
          <GestionManchesBR
            tournoiId={params.id}
            sousType={tournoi.brSousType ?? "solo"}
            onEnregistre={() => setRafraichir((n) => n + 1)}
          />
        ) : (
          <GestionMatches
            tournoiId={params.id}
            matches={matchsDuTournoi(params.id)}
            onEnregistre={() => setRafraichir((n) => n + 1)}
          />
        )}
      </div>

      <div className="flex flex-col gap-3">
        <div className="text-base font-medium flex items-center gap-2">
          <CheckCircle2 size={17} strokeWidth={2} style={{ color: "var(--ds-accent-300)" }} />
          Clôture du tournoi
        </div>
        <SectionCloture
          tournoiId={params.id}
          type={tournoi.type}
          brSousType={tournoi.brSousType}
          termine={Boolean(tournoi.termine)}
          onTermine={() => setRafraichir((n) => n + 1)}
        />
      </div>

      <div className="flex flex-col gap-3 pb-6">
        <div className="text-base font-medium">Ajustement manuel des points (optionnel)</div>
        <SectionPoints jeuId={tournoi.jeuId} jeuLabel={tournoi.jeuLabel} villeParDefaut={tournoi.ville} />
      </div>
    </div>
  );
}
