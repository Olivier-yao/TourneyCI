"use client";

import Link from "next/link";
import { FileText } from "lucide-react";
import { RenduTexteLegal } from "@/components/ds/RenduTexteLegal";

const CONTENU = `# Conditions d'utilisation — Tourney

*Dernière mise à jour : 23 août 2026.*

Ces conditions d'utilisation régissent l'usage de l'application Tourney. En
créant un compte, tu acceptes les termes ci-dessous. Pour les règles propres
au déroulement des tournois, voir le [règlement intérieur](/reglement-interieur).

## 1. Description du service

Tourney est une plateforme permettant à des organisateurs de créer et gérer
des tournois gaming, et à des joueurs de s'y inscrire et d'y participer :
inscriptions, paiement, génération de bracket, saisie des scores, classement
et communication entre participants.

## 2. Création de compte

- Tu dois fournir des informations exactes lors de la création de ton compte
(pseudo, ville, moyen de connexion).
- Tu es responsable de la confidentialité de tes identifiants de connexion et
de toute activité effectuée depuis ton compte.
- Un compte est personnel et ne peut pas être partagé entre plusieurs
personnes.
- Certaines actions (inscription à un tournoi payant, retrait d'argent)
peuvent nécessiter une vérification d'identité (KYC).

## 3. Portefeuille et paiements

- Le portefeuille Tourney permet de créditer un solde pour s'inscrire à des
tournois payants, et de recevoir les gains ou commissions issus des
tournois.
- Les fonctionnalités de recharge et de retrait via Mobile Money sont en
cours de déploiement ; tant qu'elles ne sont pas actives, aucune transaction
financière réelle n'est effectuée par ce biais.
- Toute tentative de fraude sur le portefeuille (falsification de preuve de
paiement, manipulation de solde) entraîne la suspension immédiate du compte.

## 4. Règles de conduite

En utilisant Tourney, tu t'engages à :

- Ne pas tricher, frauder, ou manipuler le résultat d'un match ou d'un
tournoi.
- Ne pas harceler, insulter ou menacer d'autres utilisateurs, que ce soit
dans les salons de discussion ou en dehors.
- Ne pas usurper l'identité d'une autre personne ou d'une autre organisation.
- Ne pas utiliser l'application à des fins illégales.

Tout manquement à ces règles peut entraîner un avertissement, une suspension
temporaire ou la suppression définitive du compte, selon la gravité
constatée.

## 5. Rôle de Tourney vis-à-vis des tournois

Les tournois publiés sur Tourney sont créés et gérés par des organisateurs
tiers, indépendants de l'éditeur de l'application. L'éditeur de Tourney
fournit les outils techniques (inscriptions, bracket, paiement, litiges) mais
n'organise pas lui-même les tournois et n'est pas responsable de leur
déroulement. Le détail de cette répartition des responsabilités figure dans
le [règlement intérieur](/reglement-interieur).

## 6. Résiliation

Tu peux supprimer ton compte à tout moment en en faisant la demande via le
service client. Nous pouvons suspendre ou supprimer un compte en cas de
non-respect de ces conditions ou du règlement intérieur.

## 7. Modifications

Ces conditions peuvent évoluer avec les fonctionnalités de l'application. La
date de dernière mise à jour figure en haut de cette page. En continuant à
utiliser Tourney après une modification, tu acceptes les nouvelles
conditions.

## 8. Contact

Pour toute question relative à ces conditions d'utilisation, contacte notre
service client directement depuis ton profil dans l'application.

---

*Voir aussi notre [politique de confidentialité](/politique-de-confidentialite)
pour le détail du traitement de tes données personnelles.*
`;

export default function ConditionsUtilisationPage() {
  return (
    <div className="min-h-screen flex flex-col px-6 py-4" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
      <div className="flex flex-col gap-4 max-w-sm mx-auto w-full flex-1">
        <div className="flex flex-col items-center gap-2 text-center pt-4">
          <div
            className="flex items-center justify-center w-12 h-12"
            style={{ borderRadius: "var(--ds-radius-pill)", background: "var(--ds-accent-900)", color: "var(--ds-accent-300)" }}
          >
            <FileText size={20} strokeWidth={2} />
          </div>
          <h1 className="text-xl" style={{ fontFamily: "var(--ds-font-heading)", fontWeight: "var(--ds-heading-weight)" as React.CSSProperties["fontWeight"] }}>
            Conditions d&apos;utilisation
          </h1>
        </div>

        <div
          className="p-4"
          style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: "1px solid var(--ds-border)" }}
        >
          <RenduTexteLegal texte={CONTENU} />
        </div>

        <div className="text-center text-xs pb-6" style={{ color: "var(--ds-muted)" }}>
          Voir aussi la{" "}
          <Link href="/politique-de-confidentialite" className="underline">
            politique de confidentialité
          </Link>{" "}
          et le{" "}
          <Link href="/reglement-interieur" className="underline">
            règlement intérieur
          </Link>
          .
        </div>
      </div>
    </div>
  );
}
