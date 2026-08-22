"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ds/Button";
import { estOrganisateurCertifie, reglementCertifieAccepte, marquerReglementCertifieAccepte } from "@/lib/mockOrganisateur";
import { VALIDATION_AUTOMATIQUE_ACTIVE } from "@/lib/mockValidationAuto";

/** Marge de tolérance (px) pour considérer que l'utilisateur a atteint le bas
 * du texte, sans exiger un défilement pixel-perfect. */
const SEUIL_BAS_PX = 24;

/**
 * Règlement spécifique aux organisateurs certifiés (point 159), distinct du
 * règlement intérieur général (point 147) — affiché une fois la demande de
 * statut certifié validée (point 146/158), avant de pouvoir créer un
 * tournoi payant. Défilement complet obligatoire avant validation.
 */
export default function ReglementCertifiePage() {
  const router = useRouter();
  const [pret, setPret] = useState(false);
  const [aLuJusquauBout, setALuJusquauBout] = useState(false);
  const conteneurRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function verifier() {
      if (!estOrganisateurCertifie()) {
        router.replace("/organisateur");
        return;
      }
      if (await reglementCertifieAccepte()) {
        router.replace("/organisateur");
        return;
      }
      setPret(true);
    }
    verifier();
  }, [router]);

  function surDefilement() {
    const el = conteneurRef.current;
    if (!el) return;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < SEUIL_BAS_PX) {
      setALuJusquauBout(true);
    }
  }

  async function continuer() {
    if (!aLuJusquauBout) return;
    await marquerReglementCertifieAccepte();
    // Point 190 : replace, pas push — voir bienvenue-profil pour le détail.
    router.replace("/organisateur/nouveau");
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
            <ShieldCheck size={20} strokeWidth={2} />
          </div>
          <h1 className="text-xl" style={{ fontFamily: "var(--ds-font-heading)", fontWeight: "var(--ds-heading-weight)" as React.CSSProperties["fontWeight"] }}>
            Règlement organisateur certifié
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
            Le statut d&apos;organisateur certifié te donne accès aux tournois payants et à la commission qui va
            avec. Cette responsabilité supplémentaire s&apos;accompagne de règles précises, distinctes du règlement
            intérieur général de Tourney.
          </p>

          <h2 className="text-sm font-semibold" style={{ color: "var(--ds-text)" }}>1. Gestion des fonds collectés</h2>
          <p>
            Les frais d&apos;inscription que tu collectes constituent la cagnotte du tournoi, pas ton revenu
            personnel — seule ta commission (calculée automatiquement) t&apos;appartient. Le cash prize doit être
            intégralement reversé aux finalistes selon la répartition annoncée avant le tournoi. Toute tentative de
            détourner tout ou partie de la cagnotte est traitée comme une fraude et entraîne un bannissement
            immédiat, sans remboursement de commission déjà perçue.
          </p>

          <h2 className="text-sm font-semibold" style={{ color: "var(--ds-text)" }}>2. Exactitude des informations annoncées</h2>
          <p>
            Le format, les horaires, le règlement du tournoi et le montant du cash prize doivent rester conformes à
            ce qui a été annoncé au moment de l&apos;inscription. Modifier ces éléments après le début des
            inscriptions, sans en informer clairement les participants, expose ton compte à une suspension.
          </p>

          <h2 className="text-sm font-semibold" style={{ color: "var(--ds-text)" }}>3. Neutralité et gestion des litiges</h2>
          <p>
            En tant qu&apos;organisateur, tu es l&apos;arbitre de tes propres tournois : les décisions sur les scores
            contestés et les litiges signalés doivent être prises avec impartialité, sur la base des preuves
            fournies, jamais en faveur d&apos;un participant que tu connais personnellement. Un litige non traité
            sous 48h peut être remonté à l&apos;administration pour arbitrage.
          </p>

          <h2 className="text-sm font-semibold" style={{ color: "var(--ds-text)" }}>4. Comportements interdits</h2>
          <p>
            Sont notamment interdits : créer de faux comptes pour gonfler artificiellement le nombre d&apos;inscrits,
            favoriser un participant en échange d&apos;un avantage personnel, divulguer les informations privées
            d&apos;un participant, et organiser un tournoi que tu n&apos;as pas l&apos;intention réelle de mener à
            son terme. Ces comportements entraînent un bannissement et un signalement de ta pièce d&apos;identité en
            liste noire, empêchant toute nouvelle certification.
          </p>

          <h2 className="text-sm font-semibold" style={{ color: "var(--ds-text)" }}>5. Réputation et suspension</h2>
          <p>
            Ton statut certifié n&apos;est pas acquis définitivement : une accumulation de retours négatifs
            (cœurs brisés) de la part des participants suspend temporairement ta capacité à créer des tournois
            payants, le temps d&apos;une vérification. Une triche confirmée entraîne un bannissement définitif.
          </p>

          <h2 className="text-sm font-semibold" style={{ color: "var(--ds-text)" }}>6. Communication avec les participants</h2>
          <p>
            Les informations de connexion (room, mot de passe, lien de stream) doivent être envoyées via les outils
            prévus dans l&apos;application, dans un délai raisonnable avant le début du tournoi. Un manque de
            communication répété nuit à ta réputation d&apos;organisateur et peut faire l&apos;objet de plaintes.
          </p>

          <h2 className="text-sm font-semibold" style={{ color: "var(--ds-text)" }}>7. État actuel de la vérification</h2>
          <p>
            {VALIDATION_AUTOMATIQUE_ACTIVE
              ? "Tant que l'application fonctionne sans backend réel, les demandes de statut certifié sont automatiquement validées sans contrôle effectif de l'administration — c'est une facilité de test, pas une garantie de vérification réelle. Une fois le vrai backend de vérification en place, ce contournement sera retiré : les vérifications deviendront réelles, avec un délai d'attente de 24h avant validation."
              : "Les demandes de statut certifié sont désormais vérifiées manuellement par l'administration, avec un délai de traitement pouvant aller jusqu'à 24h."}
          </p>

          <p className="italic" style={{ color: "var(--ds-muted)" }}>
            En acceptant ce règlement, tu confirmes avoir compris ces règles et t&apos;engages à les respecter pour
            chaque tournoi payant que tu organises.
          </p>
        </div>

        <Button variante="primary" bloc onClick={continuer} disabled={!aLuJusquauBout}>
          {aLuJusquauBout ? "J'ai lu et j'accepte" : "Fais défiler jusqu'en bas"}
        </Button>
      </div>
    </div>
  );
}
