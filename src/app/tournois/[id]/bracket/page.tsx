"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Lock } from "lucide-react";
import { tournoiParId, bracketVerrouillee } from "@/lib/mockTournaments";
import { matchsDuTournoi } from "@/lib/mockBracket";
import { nomOrganisateurActuel } from "@/lib/mockOrganisateur";
import { BracketV2 } from "./BracketV2";
import { GenerationBracket } from "./GenerationBracket";

export default function BracketPage() {
  const params = useParams<{ id: string }>();
  const tournoi = tournoiParId(params.id);
  const [, setRafraichir] = useState(0);

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

  const matches = matchsDuTournoi(params.id);
  const estMonTournoi = tournoi.organisateur === nomOrganisateurActuel();
  const verrouillee = bracketVerrouillee(tournoi) && !estMonTournoi;

  return (
    <div
      className="min-h-screen px-5 py-5"
      style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <div
            className="text-[11px]"
            style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}
          >
            {tournoi.titre}
          </div>
          <div
            className="text-xl"
            style={{
              fontFamily: "var(--ds-font-heading)",
              fontWeight: "var(--ds-heading-weight)" as React.CSSProperties["fontWeight"],
            }}
          >
            Arbre
          </div>
        </div>
        <Link
          href={`/tournois/${params.id}`}
          className="flex items-center justify-center w-9 h-9"
          style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}
        >
          <ArrowLeft size={17} strokeWidth={2} />
        </Link>
      </div>

      {verrouillee ? (
        <div
          className="flex flex-col items-center gap-2 text-center p-6"
          style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: "1px solid var(--ds-border)" }}
        >
          <Lock size={22} style={{ color: "var(--ds-muted)" }} />
          <p className="text-sm" style={{ color: "var(--ds-text-muted)" }}>
            La bracket sera visible 10 minutes après la clôture des inscriptions.
          </p>
        </div>
      ) : matches.length === 0 ? (
        estMonTournoi ? (
          <GenerationBracket
            tournoiId={params.id}
            inscrits={tournoi.inscrits}
            onGenere={() => setRafraichir((n) => n + 1)}
          />
        ) : (
          <p className="text-sm" style={{ color: "var(--ds-text-muted)" }}>
            Le bracket n&apos;a pas encore été généré pour ce tournoi.
          </p>
        )
      ) : (
        <BracketV2 matches={matches} />
      )}
    </div>
  );
}
