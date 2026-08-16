"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ScrollText } from "lucide-react";
import { Button } from "@/components/ds/Button";
import { estConnecte, profilInitialComplet, reglementAccepte, marquerReglementAccepte } from "@/lib/mockAuth";

const REGLEMENT = `# Règlement intérieur — Tourney

En créant un compte et en utilisant l'application Tourney, vous reconnaissez
avoir lu et accepté les termes suivants.

## 1. Objet de l'application

Tourney est une plateforme permettant à des organisateurs de créer et gérer
des tournois gaming, et à des joueurs de s'y inscrire et d'y participer.
Tourney met à disposition les outils techniques nécessaires à l'organisation
de ces tournois (inscriptions, paiement, gestion de bracket, classement,
communication entre participants), mais n'organise pas elle-même les tournois
proposés sur la plateforme.

## 2. Responsabilité relative aux tournois

Les tournois publiés sur Tourney sont créés et gérés par des organisateurs
tiers, indépendants de l'éditeur de l'application. En conséquence :

- L'éditeur de Tourney n'est pas responsable de l'organisation, du
déroulement, de l'équité ou de l'issue d'un tournoi.
- Il appartient à chaque utilisateur de faire preuve de discernement avant de
s'inscrire à un tournoi, notamment en tenant compte de la réputation de
l'organisateur (avis, retours de la communauté, historique de tournois déjà
organisés).
- Chaque participant est seul responsable des décisions qu'il prend en
s'inscrivant à un tournoi, y compris les paiements effectués dans ce cadre.

En cas de litige entre un participant et un organisateur (résultat contesté,
comportement inapproprié, tournoi non conforme à ce qui était annoncé),
Tourney met à disposition des outils de signalement et de médiation (système
de litige, système de retour par cœur/cœur brisé, appel des résultats) destinés
à faciliter la résolution de ces situations. L'utilisation de ces outils ne
constitue toutefois pas une garantie de résultat, et l'éditeur de Tourney ne
peut être tenu responsable des conséquences d'un tournoi qui se serait mal
déroulé du fait d'un organisateur ou d'un participant.

## 3. Sécurité de l'application

Si vous constatez un problème lié à la sécurité de l'application elle-même
(faille technique, accès non autorisé à des données, comportement suspect
touchant au fonctionnement de la plateforme), nous vous invitons à contacter
sans délai le service client de Tourney, accessible depuis votre profil. Ce
type de signalement est pris au sérieux et traité en priorité par notre
équipe.

## 4. Usage responsable

Chaque utilisateur s'engage à :
- Fournir des informations exactes lors de son inscription et de sa
participation aux tournois
- Respecter les autres membres de la communauté, qu'ils soient joueurs,
spectateurs ou organisateurs
- Ne pas tenter de frauder, tricher, ou manipuler les résultats d'un tournoi
- Signaler tout comportement contraire à ce règlement via les outils prévus à
cet effet dans l'application

Tout manquement à ces engagements peut entraîner une suspension ou une
suppression du compte concerné, selon la gravité constatée.

## 5. Contact

Pour toute question relative à ce règlement, ou pour signaler un problème de
sécurité concernant l'application, vous pouvez contacter notre service client
directement depuis votre profil dans l'application.

---

*En cochant la case d'acceptation, vous confirmez avoir pris connaissance de
ce règlement intérieur et vous vous engagez à le respecter.*
`;

/** Rendu minimal du texte du règlement (point 147) : pas de dépendance
 * markdown pour un usage à un seul écran — juste les balises réellement
 * présentes dans reglement-interieur-tourney.md (titres, listes, italique, hr). */
function RenduReglement({ texte }: { texte: string }) {
  const blocs = texte.trim().split(/\n\s*\n/);
  const elements: ReactNode[] = [];

  blocs.forEach((bloc, i) => {
    const lignes = bloc.split("\n").map((l) => l.trim());
    if (lignes[0].startsWith("# ")) {
      elements.push(
        <h1 key={i} className="text-xl mb-1" style={{ fontFamily: "var(--ds-font-heading)", fontWeight: "var(--ds-heading-weight)" as React.CSSProperties["fontWeight"] }}>
          {lignes[0].slice(2)}
        </h1>,
      );
      return;
    }
    if (lignes[0].startsWith("## ")) {
      elements.push(
        <h2 key={i} className="text-base font-semibold mt-3" style={{ color: "var(--ds-text)" }}>
          {lignes[0].slice(3)}
        </h2>,
      );
      return;
    }
    if (lignes[0] === "---") {
      elements.push(<div key={i} className="h-px my-2" style={{ background: "var(--ds-border)" }} />);
      return;
    }
    const debutListe = lignes.findIndex((l) => l.startsWith("- "));
    if (debutListe !== -1) {
      const intro = lignes.slice(0, debutListe).filter(Boolean).join(" ");
      const items: string[] = [];
      lignes.slice(debutListe).filter(Boolean).forEach((l) => {
        if (l.startsWith("- ")) items.push(l.slice(2));
        else items[items.length - 1] += ` ${l}`;
      });
      if (intro) elements.push(<p key={`${i}-intro`}>{intro}</p>);
      elements.push(
        <ul key={i} className="list-disc pl-5 flex flex-col gap-1">
          {items.map((item, j) => (
            <li key={j}>{item}</li>
          ))}
        </ul>,
      );
      return;
    }
    const texteBloc = lignes.join(" ");
    if (texteBloc.startsWith("*") && texteBloc.endsWith("*")) {
      elements.push(
        <p key={i} className="italic" style={{ color: "var(--ds-muted)" }}>
          {texteBloc.slice(1, -1)}
        </p>,
      );
      return;
    }
    elements.push(<p key={i}>{texteBloc}</p>);
  });

  return <div className="flex flex-col gap-2.5 text-sm leading-relaxed">{elements}</div>;
}

/** Écran obligatoire d'acceptation du règlement intérieur (point 147), à la
 * création de compte, après l'étape profil (point 142) et avant l'accueil —
 * pas de bouton retour ni de possibilité de passer sans cocher. */
export default function ReglementInterieurPage() {
  const router = useRouter();
  const [pret, setPret] = useState(false);
  const [accepte, setAccepte] = useState(false);

  useEffect(() => {
    if (!estConnecte()) {
      router.replace("/verify");
      return;
    }
    if (!profilInitialComplet()) {
      router.replace("/bienvenue-profil");
      return;
    }
    if (reglementAccepte()) {
      router.replace("/accueil");
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPret(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function continuer() {
    if (!accepte) return;
    marquerReglementAccepte();
    // Point 190 : replace, pas push — voir bienvenue-profil pour le détail.
    router.replace("/accueil");
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
            <ScrollText size={20} strokeWidth={2} />
          </div>
          <h1 className="text-xl" style={{ fontFamily: "var(--ds-font-heading)", fontWeight: "var(--ds-heading-weight)" as React.CSSProperties["fontWeight"] }}>
            Règlement intérieur
          </h1>
        </div>

        <div
          className="flex-1 overflow-y-auto p-4"
          style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: "1px solid var(--ds-border)", maxHeight: "50vh" }}
        >
          <RenduReglement texte={REGLEMENT} />
        </div>

        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={accepte}
            onChange={(e) => setAccepte(e.target.checked)}
            className="mt-0.5"
          />
          <span className="text-sm">J&apos;ai lu et j&apos;accepte le règlement intérieur</span>
        </label>

        <Button variante="primary" bloc onClick={continuer} disabled={!accepte}>
          Continuer
        </Button>
      </div>
    </div>
  );
}
