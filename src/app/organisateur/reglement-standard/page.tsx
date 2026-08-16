"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Megaphone } from "lucide-react";
import { Button } from "@/components/ds/Button";
import { onboardingOrganisateurComplet, reglementStandardAccepte, marquerReglementStandardAccepte } from "@/lib/mockOrganisateur";

/** Marge de tolérance (px) pour considérer que l'utilisateur a atteint le bas
 * du texte, sans exiger un défilement pixel-perfect. */
const SEUIL_BAS_PX = 24;

/**
 * Règlement général affiché au clic sur "Devenir organisateur" (point 178),
 * avant le choix du nom public — présente ce qu'implique le statut
 * d'organisateur standard (non certifié) : tournois gratuits uniquement, avec
 * ou sans cash prize auto-financé (points 117, 167). Distinct du règlement,
 * plus poussé, réservé aux organisateurs certifiés (point 159, réservé aux
 * tournois payants) — les deux restent séparés et adaptés à leur audience.
 */
export default function ReglementStandardPage() {
  const router = useRouter();
  const [pret, setPret] = useState(false);
  const [aLuJusquauBout, setALuJusquauBout] = useState(false);
  const conteneurRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (onboardingOrganisateurComplet() || reglementStandardAccepte()) {
      router.replace("/organisateur");
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPret(true);
  }, [router]);

  function surDefilement() {
    const el = conteneurRef.current;
    if (!el) return;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < SEUIL_BAS_PX) {
      setALuJusquauBout(true);
    }
  }

  function continuer() {
    if (!aLuJusquauBout) return;
    marquerReglementStandardAccepte();
    // Point 190 : replace, pas push — voir bienvenue-profil pour le détail.
    router.replace("/organisateur");
  }

  if (!pret) return null;

  return (
    <div className="min-h-screen flex flex-col px-6 py-4" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
      <div className="flex flex-col gap-4 max-w-sm mx-auto w-full flex-1">
        <div className="flex flex-col items-center gap-2 text-center pt-4">
          <div
            className="flex items-center justify-center w-12 h-12"
            style={{ borderRadius: "var(--ds-radius-pill)", background: "var(--ds-accent-900)", color: "var(--ds-accent-300)" }}
          >
            <Megaphone size={20} strokeWidth={2} />
          </div>
          <h1 className="text-xl" style={{ fontFamily: "var(--ds-font-heading)", fontWeight: "var(--ds-heading-weight)" as React.CSSProperties["fontWeight"] }}>
            Règlement organisateur
          </h1>
          <p className="text-xs" style={{ color: "var(--ds-muted)" }}>
            Fais défiler jusqu&apos;en bas pour pouvoir accepter.
          </p>
        </div>

        <div
          ref={conteneurRef}
          onScroll={surDefilement}
          className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 text-sm leading-relaxed"
          style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: "1px solid var(--ds-border)", maxHeight: "55vh", color: "var(--ds-text-muted)" }}
        >
          <p>
            Avant de choisir ton nom public, voici ce qu&apos;il faut savoir pour organiser des tournois sur Tourney
            en tant qu&apos;organisateur standard — le statut de base, accessible immédiatement.
          </p>

          <h2 className="text-sm font-semibold" style={{ color: "var(--ds-text)" }}>1. Ce que permet le statut standard</h2>
          <p>
            Un organisateur standard peut créer et gérer des tournois <strong>gratuits</strong> à l&apos;inscription,
            avec ou sans cash prize (dans ce cas financé depuis ton propre solde TourneyCard, pas par des frais
            collectés auprès des participants). Les tournois payants à l&apos;inscription et la commission qui va
            avec restent réservés aux organisateurs certifiés — vérification d&apos;identité puis demande validée par
            l&apos;administration.
          </p>

          <h2 className="text-sm font-semibold" style={{ color: "var(--ds-text)" }}>2. Exactitude des informations annoncées</h2>
          <p>
            Le format, les horaires, le règlement et le lieu (ou le lien, pour un tournoi virtuel) doivent rester
            conformes à ce qui a été annoncé au moment de l&apos;inscription. Modifier ces éléments après le début
            des inscriptions sans en informer clairement les participants nuit à ta réputation d&apos;organisateur.
          </p>

          <h2 className="text-sm font-semibold" style={{ color: "var(--ds-text)" }}>3. Neutralité et gestion des litiges</h2>
          <p>
            Tu es l&apos;arbitre de tes propres tournois : les décisions sur les scores contestés et les litiges
            signalés doivent être prises avec impartialité, sur la base des preuves fournies, jamais en faveur
            d&apos;un participant que tu connais personnellement.
          </p>

          <h2 className="text-sm font-semibold" style={{ color: "var(--ds-text)" }}>4. Comportements interdits</h2>
          <p>
            Sont notamment interdits : créer de faux comptes pour gonfler artificiellement le nombre d&apos;inscrits,
            favoriser un participant en échange d&apos;un avantage personnel, divulguer les informations privées
            d&apos;un participant, et annoncer un cash prize que tu n&apos;as pas l&apos;intention réelle de verser.
          </p>

          <h2 className="text-sm font-semibold" style={{ color: "var(--ds-text)" }}>5. Réputation</h2>
          <p>
            Les participants laissent un avis (cœur ou cœur brisé) à la fin de chaque tournoi — ta réputation
            d&apos;organisateur en dépend directement, qu&apos;il soit gratuit ou non, et reste visible sur ton
            profil public.
          </p>

          <h2 className="text-sm font-semibold" style={{ color: "var(--ds-text)" }}>6. Communication avec les participants</h2>
          <p>
            Les informations de connexion (room, mot de passe, lien de stream) doivent être envoyées via les outils
            prévus dans l&apos;application, dans un délai raisonnable avant le début du tournoi.
          </p>

          <h2 className="text-sm font-semibold" style={{ color: "var(--ds-text)" }}>7. Envie d&apos;aller plus loin ?</h2>
          <p>
            Faire vérifier ton identité puis envoyer une demande de statut certifié débloque les tournois payants et
            ta commission — un règlement spécifique, plus détaillé, t&apos;est présenté à ce moment-là.
          </p>

          <p className="italic" style={{ color: "var(--ds-muted)" }}>
            En acceptant ce règlement, tu confirmes avoir compris ces règles et t&apos;engages à les respecter pour
            chaque tournoi que tu organises.
          </p>
        </div>

        <Button variante="primary" bloc onClick={continuer} disabled={!aLuJusquauBout}>
          {aLuJusquauBout ? "J'ai lu et j'accepte" : "Fais défiler jusqu'en bas"}
        </Button>
      </div>
    </div>
  );
}
