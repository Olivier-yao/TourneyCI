"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { tournoiParId } from "@/lib/mockTournaments";
import { FluxPaiement } from "./FluxPaiement";

function PaiementInterne() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const tournoi = tournoiParId(params.id);
  const equipe = searchParams.get("equipe") ?? undefined;
  const tag = searchParams.get("tag") ?? undefined;
  const montantParam = searchParams.get("montant");
  const montant = montantParam !== null ? Number(montantParam) : undefined;
  const equipeId = searchParams.get("equipeId") ?? undefined;

  if (!tournoi) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-3 px-6 text-center"
        style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}
      >
        <p>Tournoi introuvable.</p>
        <Link href="/tournois" style={{ color: "var(--ds-accent-300)" }}>
          Retour aux tournois
        </Link>
      </div>
    );
  }

  return <FluxPaiement tournoi={tournoi} equipe={equipe} tag={tag} montant={montant} equipeId={equipeId} />;
}

export default function PaiementPage() {
  return (
    <Suspense fallback={null}>
      <PaiementInterne />
    </Suspense>
  );
}
