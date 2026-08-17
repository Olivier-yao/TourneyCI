"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Monitor, Radio, Check, Wifi, MoreVertical, Eye, Lock } from "lucide-react";
import { AppBar } from "@/components/ds/AppBar";
import { PRESS } from "@/components/ds/Button";
import { tournoiParId, modifierTournoi, type Tournoi } from "@/lib/mockTournaments";
import { nomOrganisateurActuel } from "@/lib/mockOrganisateur";
import { peutSuperviser } from "@/lib/mockAdjointsOrganisateur";

/** Nombre de spectateurs simulé, déterministe (pas de vrai suivi d'audience
 * dans ce mock) — stable entre le rendu serveur et client. */
function spectateurs(tournoiId: string): number {
  let h = 0;
  for (let i = 0; i < tournoiId.length; i++) h = (h * 31 + tournoiId.charCodeAt(i)) >>> 0;
  return 120 + (h % 400);
}

function formatDuree(secondes: number): string {
  const m = Math.floor(secondes / 60);
  const s = secondes % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Le bouton "Paramètres" de la gestion en direct est désormais exclusivement
 * dédié au stream (point 130) : appairage avec une application compagnon PC
 * (mock — la vraie intégration est un chantier à part, cf. note CLAUDE.md
 * "point 110"), puis lancement du live une fois connecté. Le reste des
 * réglages du tournoi (titre, règlement...) vit maintenant sur l'écran
 * "Infos du tournoi". */
export default function StreamTournoiPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [pret, setPret] = useState(false);
  const [tournoi, setTournoi] = useState<Tournoi | undefined>(undefined);
  const [autorise, setAutorise] = useState(false);
  const [streamActif, setStreamActif] = useState(false);
  const [pcConnecte, setPcConnecte] = useState(false);
  const [dureeSec, setDureeSec] = useState(0);

  useEffect(() => {
    const t = tournoiParId(params.id);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTournoi(t);
    setAutorise(Boolean(t) && peutSuperviser(t!.organisateur, nomOrganisateurActuel()));
    setStreamActif(t?.streamActif ?? false);
    setPret(true);
  }, [params.id]);

  useEffect(() => {
    if (!streamActif) return;
    const id = setInterval(() => setDureeSec((d) => d + 1), 1000);
    return () => clearInterval(id);
  }, [streamActif]);

  if (!pret) return null;

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

  function connecterPc() {
    setPcConnecte(true);
  }

  function deconnecterPc() {
    setPcConnecte(false);
    if (streamActif) {
      setStreamActif(false);
      setDureeSec(0);
      modifierTournoi(params.id, { streamActif: false });
    }
  }

  function lancerStream() {
    setStreamActif(true);
    setDureeSec(0);
    modifierTournoi(params.id, { streamActif: true });
  }

  function arreterStream() {
    setStreamActif(false);
    setDureeSec(0);
    modifierTournoi(params.id, { streamActif: false });
  }

  return (
    <div className="min-h-screen flex flex-col px-5 py-4 gap-5 pb-10" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
      <AppBar retour titre="Stream du tournoi" onRetour={() => router.back()} />

      <div className="text-[10px] uppercase tracking-wide" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
        Application compagnon PC
      </div>

      {!pcConnecte ? (
        <div
          className="flex flex-col gap-3 p-3.5"
          style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", boxShadow: "var(--ds-shadow-sm, none)" }}
        >
          <div className="flex items-start gap-2.5">
            <Monitor size={19} strokeWidth={2} style={{ color: "var(--ds-muted)" }} className="shrink-0 mt-0.5" />
            <p className="text-xs leading-relaxed" style={{ color: "color-mix(in srgb, var(--ds-text) 58%, transparent)" }}>
              La capture se fait depuis ton PC. Installe l&apos;application compagnon, connecte-la à ton compte organisateur, puis reviens ici pour lancer la diffusion.
            </p>
          </div>
          <button
            type="button"
            onClick={connecterPc}
            className={`h-[42px] flex items-center justify-center gap-2 text-sm font-medium ${PRESS}`}
            style={{ borderRadius: "var(--ds-radius-md)", border: "1px solid var(--ds-accent)", color: "var(--ds-accent-300)" }}
          >
            <Wifi size={15} strokeWidth={2} />
            Connecter l&apos;application PC
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={deconnecterPc}
          className={`flex items-center gap-2.5 p-3.5 text-left ${PRESS}`}
          style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", boxShadow: "0 0 0 1px var(--ds-accent)" }}
        >
          <span
            className="flex items-center justify-center w-[30px] h-[30px] shrink-0"
            style={{ borderRadius: "var(--ds-radius-pill)", background: "var(--ds-accent-800)" }}
          >
            <Check size={15} strokeWidth={2} style={{ color: "var(--ds-accent-300)" }} />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-[13px] font-medium">Application PC connectée</span>
            <span className="block mt-0.5 text-[9px]" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
              TOURNEY DESKTOP 1.4 · {tournoi.jeuId.slice(0, 3).toUpperCase()}-ORG-01
            </span>
          </span>
          <MoreVertical size={15} style={{ color: "var(--ds-muted)" }} className="shrink-0" />
        </button>
      )}

      <div className="h-px" style={{ background: "linear-gradient(to right, transparent, var(--ds-border) 48px, var(--ds-border) calc(100% - 48px), transparent)" }} />

      <div className="text-[10px] uppercase tracking-wide" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
        Diffusion
      </div>

      <div className="flex flex-col gap-3">
        <div
          className="p-3.5"
          style={{ borderRadius: "var(--ds-radius-md)", background: streamActif ? "var(--ds-accent-900)" : "var(--ds-surface-2)", boxShadow: streamActif ? "0 0 0 1px var(--ds-accent)" : pcConnecte ? "0 0 0 1px var(--ds-border)" : "var(--ds-shadow-sm, none)" }}
        >
          <div className="flex items-center gap-2.5">
            {streamActif && <span className="w-2 h-2 rounded-full shrink-0 animate-pulse" style={{ background: "var(--ds-accent-400)" }} />}
            <Radio size={17} strokeWidth={2} style={{ color: streamActif ? "var(--ds-accent-300)" : "var(--ds-muted)" }} className="shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-medium" style={{ color: streamActif ? "var(--ds-accent-300)" : "var(--ds-text)" }}>
                {streamActif ? "Diffusion en cours" : pcConnecte ? "Prêt à diffuser" : "Aucune source connectée"}
              </div>
              <div className="mt-0.5 text-[9px]" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
                {streamActif
                  ? `DEPUIS ${formatDuree(dureeSec)} · ${tournoi.jeuLabel.toUpperCase()}`
                  : pcConnecte
                    ? "PC CONNECTÉ, STREAM PAS ENCORE LANCÉ"
                    : "CONNECTE TON PC POUR ACTIVER LA DIFFUSION"}
              </div>
            </div>
          </div>
          {streamActif && (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {[
                { v: spectateurs(params.id).toLocaleString("fr-FR"), l: "spectateurs" },
                { v: "1080p", l: "qualité" },
                { v: formatDuree(dureeSec), l: "à l'antenne" },
              ].map((s) => (
                <div key={s.l} className="p-2.5" style={{ borderRadius: "var(--ds-radius-sm)", background: "var(--ds-surface-2)" }}>
                  <div className="text-[13px]" style={{ fontFamily: "var(--ds-font-mono)" }}>{s.v}</div>
                  <div className="mt-0.5 text-[10px]" style={{ color: "var(--ds-muted)" }}>{s.l}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={streamActif ? arreterStream : lancerStream}
          disabled={!pcConnecte}
          className={`h-[46px] text-sm font-medium disabled:opacity-45 ${PRESS}`}
          style={{
            borderRadius: "var(--ds-radius-md)",
            border: `1px solid ${pcConnecte ? "var(--ds-accent)" : "var(--ds-border)"}`,
            color: pcConnecte ? "var(--ds-accent-300)" : "var(--ds-muted)",
            cursor: pcConnecte ? "pointer" : "not-allowed",
          }}
        >
          {streamActif ? "Arrêter le stream" : "Lancer le stream depuis mon PC"}
        </button>

        {!pcConnecte && (
          <div className="flex items-center gap-2 text-[9px]" style={{ color: "var(--ds-muted)", fontFamily: "var(--ds-font-mono)" }}>
            <Lock size={12} strokeWidth={2} />
            CONNECTE D&apos;ABORD L&apos;APPLICATION PC
          </div>
        )}
      </div>

      <div className="mt-auto flex items-center gap-2.5 p-3" style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)" }}>
        <Eye size={15} strokeWidth={2} style={{ color: "var(--ds-muted)" }} className="shrink-0" />
        <div className="flex-1 text-xs leading-relaxed" style={{ color: "color-mix(in srgb, var(--ds-text) 52%, transparent)" }}>
          {streamActif
            ? "Le cadre de stream est visible sur la fiche du tournoi et depuis l'accueil."
            : "Une fois lancé, un cadre de stream remplace la bannière sur la fiche du tournoi."}
        </div>
      </div>
    </div>
  );
}
