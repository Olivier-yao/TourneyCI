"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Lock, Shuffle } from "lucide-react";
import { tournoiParId, bracketVerrouillee, inscriptionsFermees } from "@/lib/mockTournaments";
import { matchsDuTournoi, genererBracket } from "@/lib/mockBracket";
import { nomOrganisateurActuel } from "@/lib/mockOrganisateur";
import { peutSuperviser } from "@/lib/mockAdjointsOrganisateur";
import { notifierParticipants } from "@/lib/mockNotifications";
import { BracketV2 } from "./BracketV2";

/** Tirage au sort de l'ordre des participants — aucune saisie manuelle de
 * l'organisateur : le bracket se construit uniquement à partir des inscrits
 * réels du tournoi. */
function melanger<T>(liste: T[]): T[] {
  const copie = [...liste];
  for (let i = copie.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copie[i], copie[j]] = [copie[j], copie[i]];
  }
  return copie;
}

export default function BracketPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const tournoi = tournoiParId(params.id);
  const [, setRafraichir] = useState(0);

  const matches = matchsDuTournoi(params.id);
  const fermees = tournoi ? inscriptionsFermees(tournoi) : false;
  const assezDeMonde = (tournoi?.inscrits.length ?? 0) >= 2;

  useEffect(() => {
    if (!tournoi || matches.length > 0 || !fermees || !assezDeMonde) return;
    genererBracket(tournoi.id, melanger(tournoi.inscrits));
    notifierParticipants(tournoi.id, tournoi.titre, "le bracket est disponible !");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRafraichir((n) => n + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournoi?.id, matches.length, fermees, assezDeMonde]);

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

  const estMonTournoi = peutSuperviser(tournoi.organisateur, nomOrganisateurActuel());
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
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center justify-center w-9 h-9"
          style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}
        >
          <ArrowLeft size={17} strokeWidth={2} />
        </button>
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
          <div
            className="flex flex-col items-center gap-2 text-center p-6"
            style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: "1px solid var(--ds-border)" }}
          >
            <Shuffle size={22} style={{ color: "var(--ds-muted)" }} />
            {fermees ? (
              <p className="text-sm" style={{ color: "var(--ds-text-muted)" }}>
                Pas assez d&apos;inscrits pour générer un arbre (minimum 2, {tournoi.inscrits.length}{" "}
                pour l&apos;instant).
              </p>
            ) : (
              <>
                <p className="text-sm" style={{ color: "var(--ds-text-muted)" }}>
                  Le bracket sera généré automatiquement et de façon aléatoire dès la clôture
                  des inscriptions.
                </p>
                <p className="text-xs" style={{ color: "var(--ds-muted)" }}>
                  {tournoi.inscrits.length} inscrit{tournoi.inscrits.length > 1 ? "s" : ""} pour l&apos;instant
                </p>
              </>
            )}
          </div>
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
