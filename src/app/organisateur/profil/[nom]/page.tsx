"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Heart, HeartCrack, Trophy } from "lucide-react";
import { formatXof } from "@/lib/formatXof";
import { tousLesTournois } from "@/lib/mockTournaments";
import { statistiquesReputation, nomOrganisateurActuel } from "@/lib/mockOrganisateur";
import { compterAvis, monAvisPourOrganisateur, laisserAvisOrganisateur, type TypeAvis } from "@/lib/mockAvis";
import { useExigerConnexion } from "@/hooks/useExigerConnexion";

export default function ProfilOrganisateurPage() {
  const connecte = useExigerConnexion();
  const params = useParams<{ nom: string }>();
  const router = useRouter();
  const nom = decodeURIComponent(params.nom);

  const [stats, setStats] = useState({ coeurs: 0, coeursBrises: 0 });
  const [monAvis, setMonAvis] = useState<TypeAvis | null>(null);
  const [cestMoi, setCestMoi] = useState(false);

  const tournois = useMemo(() => tousLesTournois().filter((t) => t.organisateur === nom), [nom]);

  function rafraichir() {
    setStats(statistiquesReputation(nom));
    setMonAvis(monAvisPourOrganisateur(nom)?.type ?? null);
    setCestMoi(nomOrganisateurActuel() === nom);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    rafraichir();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nom]);

  if (!connecte) return null;

  function voter(type: TypeAvis) {
    laisserAvisOrganisateur(nom, type);
    rafraichir();
  }

  return (
    <div className="min-h-screen flex flex-col px-5 py-4 gap-5" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center justify-center w-9 h-9 cursor-pointer"
          style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-border)", color: "var(--ds-muted)" }}
        >
          <ArrowLeft size={17} strokeWidth={2} />
        </button>
        <div className="text-xl" style={{ fontFamily: "var(--ds-font-heading)", fontWeight: "var(--ds-heading-weight)" as React.CSSProperties["fontWeight"] }}>
          {nom}
        </div>
      </div>

      <div className="flex items-center gap-4 p-3.5" style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: "1px solid var(--ds-border)" }}>
        <span className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: "var(--ds-accent-300)" }}>
          <Heart size={16} strokeWidth={2} fill="currentColor" />
          {stats.coeurs}
        </span>
        <span className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: "var(--ds-danger)" }}>
          <HeartCrack size={16} strokeWidth={2} />
          {stats.coeursBrises}
        </span>
        <span className="text-xs" style={{ color: "var(--ds-muted)" }}>Réputation globale</span>
      </div>

      {!cestMoi && (
        <div className="flex flex-col gap-2">
          {monAvis ? (
            <p className="text-xs" style={{ color: "var(--ds-muted)" }}>
              Tu as déjà laissé {monAvis === "coeur" ? "un cœur" : "un cœur brisé"} à cet organisateur.
            </p>
          ) : (
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => voter("coeur")}
                className="flex-1 flex flex-col items-center gap-1 py-2.5 cursor-pointer"
                style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-border)" }}
              >
                <Heart size={17} strokeWidth={2} style={{ color: "var(--ds-accent-300)" }} />
                <span className="text-xs" style={{ color: "var(--ds-muted)" }}>Cœur</span>
              </button>
              <button
                type="button"
                onClick={() => voter("coeur_brise")}
                className="flex-1 flex flex-col items-center gap-1 py-2.5 cursor-pointer"
                style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-border)" }}
              >
                <HeartCrack size={17} strokeWidth={2} style={{ color: "var(--ds-danger)" }} />
                <span className="text-xs" style={{ color: "var(--ds-muted)" }}>Cœur brisé</span>
              </button>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <div className="text-sm font-medium flex items-center gap-2">
          <Trophy size={15} strokeWidth={2} style={{ color: "var(--ds-accent-300)" }} />
          Tournois organisés
        </div>
        {tournois.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--ds-text-muted)" }}>Aucun tournoi pour l&apos;instant.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {tournois.map((t) => {
              const avisT = compterAvis(t.id);
              return (
                <Link key={t.id} href={`/tournois/${t.id}`}>
                  <div className="flex items-center gap-3 p-3" style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: "1px solid var(--ds-border)" }}>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{t.titre}</div>
                      <div className="text-xs" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                        {t.jeuLabel} · {t.placesInscrites}/{t.placesTotal} · {formatXof(t.cashPrizeXof)}
                      </div>
                    </div>
                    {(avisT.coeurs > 0 || avisT.coeursBrises > 0) && (
                      <div className="flex items-center gap-2 text-xs shrink-0" style={{ fontFamily: "var(--ds-font-mono)" }}>
                        <span className="flex items-center gap-1" style={{ color: "var(--ds-accent-300)" }}><Heart size={11} strokeWidth={2} />{avisT.coeurs}</span>
                        <span className="flex items-center gap-1" style={{ color: "var(--ds-danger)" }}><HeartCrack size={11} strokeWidth={2} />{avisT.coeursBrises}</span>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
