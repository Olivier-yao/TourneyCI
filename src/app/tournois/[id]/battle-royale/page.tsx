"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Settings2, Search } from "lucide-react";
import { nomOrganisateurActuel } from "@/lib/mockOrganisateur";
import { tournoiParId } from "@/lib/mockTournaments";
import { manchesBR, classementCumuleBR } from "@/lib/mockBattleRoyale";

const RAFRAICHISSEMENT_MS = 15_000;

export default function BattleRoyalePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const tournoi = tournoiParId(params.id);
  const [rafraichir, setRafraichir] = useState(0);
  const [organisateur, setOrganisateur] = useState(false);
  const [manches, setManches] = useState<ReturnType<typeof manchesBR>>([]);
  const [classement, setClassement] = useState<ReturnType<typeof classementCumuleBR>>([]);
  const [recherche, setRecherche] = useState("");

  useEffect(() => {
    const id = setInterval(() => setRafraichir((n) => n + 1), RAFRAICHISSEMENT_MS);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    // État lu depuis le localStorage : neutre au premier rendu serveur,
    // synchronisé côté client une fois monté (évite un mismatch d'hydratation).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrganisateur(tournoi?.organisateur === nomOrganisateurActuel());
    setManches(manchesBR(params.id));
    setClassement(classementCumuleBR(params.id, tournoi?.brSousType ?? "solo"));
  }, [params.id, rafraichir, tournoi?.brSousType, tournoi?.organisateur]);

  if (!tournoi) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
        Tournoi introuvable.
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col px-5 py-5" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="text-[11px]" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
            {tournoi.titre} · {manches.length} manche{manches.length > 1 ? "s" : ""}
          </div>
          <div
            className="text-xl"
            style={{ fontFamily: "var(--ds-font-heading)", fontWeight: "var(--ds-heading-weight)" as React.CSSProperties["fontWeight"] }}
          >
            Classement en direct
          </div>
        </div>
        <button
          type="button"
          onClick={() => router.push(`/tournois/${params.id}`)}
          className="flex items-center justify-center w-9 h-9 cursor-pointer"
          style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}
        >
          <ArrowLeft size={17} strokeWidth={2} />
        </button>
      </div>

      <div className="flex-1 flex flex-col gap-4">
        {organisateur && (
          <Link
            href={`/organisateur/${params.id}/gestion`}
            className="flex items-center gap-2 p-3"
            style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-accent-900)", color: "var(--ds-accent-300)" }}
          >
            <Settings2 size={16} strokeWidth={2} />
            <span className="text-sm font-medium">Saisir la manche {manches.length + 1} depuis la gestion du tournoi</span>
          </Link>
        )}

        {classement.length > 0 && (
          <div
            className="flex items-center gap-2.5 h-11 px-3.5"
            style={{ borderRadius: "var(--ds-radius-input)", background: "var(--ds-surface-2)", border: "1px solid var(--ds-border)" }}
          >
            <Search size={15} style={{ color: "var(--ds-muted)" }} />
            <input
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Chercher une équipe ou un joueur"
              className="flex-1 bg-transparent outline-none text-sm"
              style={{ color: "var(--ds-text)" }}
            />
          </div>
        )}

        {classement.every((l) => l.points === 0) ? (
          <p className="text-sm" style={{ color: "var(--ds-text-muted)" }}>
            Aucune manche jouée pour l&apos;instant.
          </p>
        ) : classement.filter((l) => l.nom.toLowerCase().includes(recherche.toLowerCase())).length === 0 ? (
          <p className="text-sm" style={{ color: "var(--ds-text-muted)" }}>
            Aucun résultat pour &quot;{recherche}&quot;.
          </p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {classement
              .map((l, i) => ({ ...l, rang: i + 1 }))
              .filter((l) => l.nom.toLowerCase().includes(recherche.toLowerCase()))
              .map((l) => (
              <div
                key={l.participantId}
                className="flex items-center gap-3 p-3"
                style={{
                  borderRadius: "var(--ds-radius-md)",
                  background: l.qualifie ? "color-mix(in srgb, var(--ds-accent) 8%, var(--ds-surface))" : "var(--ds-surface)",
                  border: `1px solid ${l.qualifie ? "var(--ds-accent-600)" : "var(--ds-border)"}`,
                }}
              >
                <span className="w-6 text-xs text-center" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                  #{l.rang}
                </span>
                <span className="text-sm flex-1 truncate">{l.nom}</span>
                <span className="text-xs" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                  {l.manchesJouees} manche{l.manchesJouees > 1 ? "s" : ""}
                </span>
                <span className="text-sm font-semibold w-10 text-right" style={{ color: "var(--ds-accent-300)", fontFamily: "var(--ds-font-mono)" }}>
                  {l.points} pt
                </span>
                {l.qualifie && (
                  <span
                    className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1"
                    style={{ borderRadius: "var(--ds-radius-pill)", background: "var(--ds-accent-900)", color: "var(--ds-accent-300)" }}
                  >
                    <CheckCircle2 size={11} strokeWidth={2} />
                    Qualifié
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {manches.length > 0 && (
          <div className="flex flex-col gap-2 mt-2">
            <div className="text-[11px] uppercase tracking-wide" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
              Barème par manche : 1er 10 pts · 2e 6 · 3e 5 · 4e 4 · 5e 3 · 6e 2 · 7e-8e 1 · + 1 pt / élimination
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
