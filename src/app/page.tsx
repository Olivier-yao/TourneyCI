import type { Metadata } from "next";
import Link from "next/link";
import { GitBranch, Radio, Trophy, Users } from "lucide-react";
import { Marque } from "@/components/ds/Splash";
import { RedirectionSiConnecte } from "./RedirectionSiConnecte";

export const metadata: Metadata = {
  description:
    "Tourney organise des tournois gaming en Côte d'Ivoire : inscriptions, brackets générés automatiquement, scores en direct et classement — pour la communauté PLAY UP CÔTE D'IVOIRE.",
};

const ATOUTS = [
  { icone: Users, texte: "Inscris-toi à un tournoi gaming en quelques secondes" },
  { icone: GitBranch, texte: "Le bracket se génère tout seul dès la clôture des inscriptions" },
  { icone: Radio, texte: "Scores et progression du tournoi en direct, sans recharger" },
  { icone: Trophy, texte: "Classement national et progression de joueur, saison après saison" },
];

/** Page d'accueil publique — le premier rendu de "/", visible sans connexion
 * et sans JS (Server Component). L'ancien LanceurApp redirigeait TOUT visiteur
 * (y compris anonyme) directement vers l'inscription/connexion sans jamais
 * rien afficher : Google a refusé de valider l'écran de consentement OAuth
 * pour deux raisons précises — page d'accueil accessible uniquement via une
 * page de connexion, et n'expliquant pas l'objectif de l'app. Un visiteur
 * déjà connecté est redirigé silencieusement vers l'app (RedirectionSiConnecte),
 * cette page ne s'affiche donc en pratique que pour un nouveau visiteur. */
export default function Home() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
      <RedirectionSiConnecte />

      <div className="flex-1 flex flex-col items-center justify-center gap-8 px-6 py-16 max-w-sm mx-auto w-full text-center">
        <Marque />

        <div className="flex flex-col gap-2.5">
          <h1
            className="text-xl leading-snug"
            style={{ fontFamily: "var(--ds-font-heading)", fontWeight: "var(--ds-heading-weight)" as React.CSSProperties["fontWeight"] }}
          >
            Le tournoi gaming commence ici
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: "var(--ds-text-muted)" }}>
            Tourney organise les tournois de la communauté <strong style={{ color: "var(--ds-text)" }}>PLAY UP CÔTE D&apos;IVOIRE</strong> :
            inscriptions, brackets, scores en direct et classement, le tout depuis ton téléphone.
          </p>
        </div>

        <div className="flex flex-col gap-3 w-full">
          {ATOUTS.map(({ icone: Icone, texte }) => (
            <div key={texte} className="flex items-center gap-3 p-3 text-left" style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", boxShadow: "var(--ds-shadow-sm)" }}>
              <Icone size={16} strokeWidth={2} style={{ color: "var(--ds-accent-300)" }} className="shrink-0" />
              <span className="text-[13px] leading-snug">{texte}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 w-full">
          <Link
            href="/onboarding"
            className="h-[46px] flex items-center justify-center text-[15px] font-medium"
            style={{ borderRadius: "var(--ds-radius-btn)", background: "var(--ds-btn-primary-bg)", color: "var(--ds-btn-primary-text)", fontFamily: "var(--ds-font-body)" }}
          >
            Commencer
          </Link>
          <Link href="/verify" className="text-sm" style={{ color: "var(--ds-accent-300)" }}>
            Déjà inscrit ? Se connecter
          </Link>
        </div>
      </div>
    </div>
  );
}
