"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Monitor, Radio, Check, Wifi } from "lucide-react";
import { AppBar } from "@/components/ds/AppBar";
import { Button, PRESS } from "@/components/ds/Button";
import { tournoiParId, modifierTournoi } from "@/lib/mockTournaments";
import { estOrganisateur } from "@/lib/mockAuth";

/** Le bouton "Paramètres" de la gestion en direct est désormais exclusivement
 * dédié au stream (point 130) : appairage avec une application compagnon PC
 * (mock — la vraie intégration est un chantier à part, cf. note CLAUDE.md
 * "point 110"), puis lancement du live une fois connecté. Le reste des
 * réglages du tournoi (titre, règlement...) vit maintenant sur l'écran
 * "Infos du tournoi". */
export default function StreamTournoiPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [autorise, setAutorise] = useState(false);
  const tournoi = tournoiParId(params.id);
  const [streamActif, setStreamActif] = useState(tournoi?.streamActif ?? false);
  const [pcConnecte, setPcConnecte] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAutorise(estOrganisateur());
  }, []);

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

  function lancerStream() {
    setStreamActif(true);
    modifierTournoi(params.id, { streamActif: true });
  }

  function arreterStream() {
    setStreamActif(false);
    modifierTournoi(params.id, { streamActif: false });
  }

  return (
    <div className="min-h-screen flex flex-col px-5 py-4 gap-5 pb-10" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
      <AppBar retour titre="Stream du tournoi" onRetour={() => router.push(`/organisateur/${params.id}/gestion`)} />

      <div className="text-[10px] uppercase tracking-wide" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
        Application compagnon PC
      </div>

      {!pcConnecte ? (
        <div
          className="flex flex-col gap-3 p-3.5"
          style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: "1px solid var(--ds-border)" }}
        >
          <div className="flex items-center gap-2.5">
            <Monitor size={17} strokeWidth={2} style={{ color: "var(--ds-muted)" }} className="shrink-0" />
            <p className="text-xs leading-relaxed" style={{ color: "var(--ds-muted)" }}>
              Connecte l&apos;application compagnon installée sur ton PC pour pouvoir lancer le stream de la partie depuis là-bas.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPcConnecte(true)}
            className={`h-10 flex items-center justify-center gap-2 text-sm font-medium ${PRESS}`}
            style={{ borderRadius: "var(--ds-radius-sm)", background: "var(--ds-accent-900)", color: "var(--ds-accent-300)" }}
          >
            <Wifi size={15} strokeWidth={2} />
            Connecter l&apos;application PC
          </button>
        </div>
      ) : (
        <div
          className="flex items-center gap-2.5 p-3"
          style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-accent-900)", color: "var(--ds-accent-300)" }}
        >
          <Check size={16} strokeWidth={2} className="shrink-0" />
          <span className="text-sm">Application PC connectée</span>
        </div>
      )}

      <div className="h-px" style={{ background: "linear-gradient(to right, transparent, var(--ds-border) 48px, var(--ds-border) calc(100% - 48px), transparent)" }} />

      <div className="text-[10px] uppercase tracking-wide" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
        Diffusion
      </div>

      <div className="flex items-center gap-2.5 p-3" style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface-2)", border: "1px solid var(--ds-border)" }}>
        <Radio size={15} strokeWidth={2} style={{ color: streamActif ? "var(--ds-accent-400)" : "var(--ds-muted)" }} className="shrink-0" />
        <div className="text-xs leading-relaxed" style={{ color: "color-mix(in srgb, var(--ds-text) 55%, transparent)" }}>
          {streamActif
            ? "Le live est actif — il apparaît dans l'app mobile pour les spectateurs de ce tournoi."
            : pcConnecte
              ? "PC connecté — tu peux lancer le stream depuis ton PC dès que tu es prêt."
              : "Connecte d'abord l'application PC pour pouvoir lancer le stream."}
        </div>
      </div>

      <Button variante="primary" onClick={streamActif ? arreterStream : lancerStream} disabled={!pcConnecte}>
        {streamActif ? "Arrêter le stream" : "Lancer le stream depuis mon PC"}
      </Button>
    </div>
  );
}
