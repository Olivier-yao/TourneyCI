"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Search, CheckCircle2 } from "lucide-react";
import { Avatar } from "@/components/ds/Avatar";
import { EmptyState } from "@/components/ds/EmptyState";
import { tournoiParId } from "@/lib/mockTournaments";

function tagDe(nom: string): string {
  return `#${nom.replace(/\s+/g, "").slice(0, 6).toUpperCase()}`;
}

function checkinFait(nom: string): boolean {
  let h = 0;
  for (let i = 0; i < nom.length; i++) h = (h * 31 + nom.charCodeAt(i)) >>> 0;
  return h % 3 !== 0;
}

export default function InscritsPage() {
  const params = useParams<{ id: string }>();
  const tournoi = tournoiParId(params.id);
  const [requete, setRequete] = useState("");

  const inscrits = useMemo(() => {
    const noms = tournoi?.inscrits ?? [];
    return noms
      .map((nom) => ({ nom, tag: tagDe(nom), checkin: checkinFait(nom) }))
      .filter((p) => !requete || p.nom.toLowerCase().includes(requete.toLowerCase()) || p.tag.toLowerCase().includes(requete.toLowerCase()));
  }, [tournoi, requete]);

  if (!tournoi) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-6 text-center" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
        <p>Tournoi introuvable.</p>
        <Link href="/tournois" style={{ color: "var(--ds-accent-300)" }}>Retour aux tournois</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
      <div className="sticky top-0 z-10 px-5 pt-[22px] pb-3 flex items-center gap-3" style={{ background: "var(--ds-bg)", borderBottom: "1px solid var(--ds-border)" }}>
        <Link href={`/tournois/${params.id}`} style={{ color: "var(--ds-muted)" }}>
          <ArrowLeft size={19} strokeWidth={2} />
        </Link>
        <div>
          <div className="text-[11px]" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>{tournoi.titre}</div>
          <div className="text-lg" style={{ fontFamily: "var(--ds-font-heading)", fontWeight: "var(--ds-heading-weight)" as React.CSSProperties["fontWeight"] }}>
            Inscrits · {tournoi.placesInscrites}
          </div>
        </div>
      </div>

      <div className="px-5 pt-4 flex flex-col gap-3 pb-8">
        <div
          className="flex items-center gap-2.5 h-11 px-3.5"
          style={{ borderRadius: "var(--ds-radius-input)", background: "var(--ds-surface-2)", border: "1px solid var(--ds-border)" }}
        >
          <Search size={15} style={{ color: "var(--ds-muted)" }} />
          <input
            value={requete}
            onChange={(e) => setRequete(e.target.value)}
            placeholder="Chercher un joueur ou un TAG"
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: "var(--ds-text)" }}
          />
        </div>

        {inscrits.length === 0 ? (
          <EmptyState titre="Aucun inscrit" description="Personne ne correspond à cette recherche." />
        ) : (
          <div className="flex flex-col gap-2">
            {inscrits.map((p) => (
              <div
                key={p.nom}
                className="flex items-center gap-3 p-3"
                style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: "1px solid var(--ds-border)" }}
              >
                <Avatar initiales={p.nom.slice(0, 2).toUpperCase()} taille={38} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{p.nom}</div>
                  <div className="text-xs" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>{p.tag}</div>
                </div>
                {p.checkin ? (
                  <span className="flex items-center gap-1 text-xs font-semibold px-2 py-1" style={{ borderRadius: "var(--ds-radius-pill)", background: "var(--ds-accent-900)", color: "var(--ds-accent-300)" }}>
                    <CheckCircle2 size={12} strokeWidth={2} />
                    Check-in
                  </span>
                ) : (
                  <span className="text-xs px-2 py-1" style={{ borderRadius: "var(--ds-radius-pill)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}>
                    En attente
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
