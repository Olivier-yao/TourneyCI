"use client";

import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { RenduTexteLegal } from "@/components/ds/RenduTexteLegal";

const CONTENU = `# Politique de confidentialité — Tourney

*Dernière mise à jour : 23 août 2026.*

Tourney est une application de gestion de tournois gaming (inscriptions,
bracket, scores en direct, classement) destinée à la communauté PLAY UP
CÔTE D'IVOIRE. Cette page explique quelles données nous collectons, pourquoi,
et comment elles sont protégées.

## 1. Qui est responsable de ces données

Tourney est édité par un développeur indépendant basé en Côte d'Ivoire. Pour
toute question ou demande relative à tes données, tu peux nous contacter
depuis le service client accessible dans ton profil, dans l'application.

## 2. Données que nous collectons

- Identifiants de connexion : adresse e-mail, nom et photo de profil transmis
par Google lors de la connexion via Google, ou e-mail/mot de passe si tu
utilises la connexion classique.
- Profil joueur : pseudo, ville, photo de profil.
- Profil organisateur (si tu crées des tournois) : nom d'organisateur, bio,
réseaux sociaux, photo et bannière.
- Données de tournoi : inscriptions, présence, équipe, résultats de matchs,
avis laissés sur un organisateur.
- Portefeuille : solde et mouvements (recharges, retraits, gains, commissions,
remboursements).
- Vérification d'identité (KYC) : lorsque cette vérification est requise,
photo recto/verso d'une pièce d'identité et selfie. Ces documents sont
stockés dans un espace de stockage privé et ne sont accessibles qu'à
l'équipe d'administration, dans le seul but de valider ton identité.
- Communications : messages échangés dans les salons de discussion (tournoi,
équipe, litige), signalements et litiges que tu déposes.
- Données techniques : cookie de session nécessaire pour rester connecté.

Nous ne collectons pas plus de données que ce qui est nécessaire au
fonctionnement de l'application.

## 3. Pourquoi nous utilisons ces données

- Faire fonctionner le service : inscriptions, brackets, classement,
portefeuille.
- Sécurité et lutte contre la fraude : vérification d'identité, modération
des signalements et litiges.
- Communication entre joueurs, équipes et organisateurs à l'intérieur de
l'application.
- Support : répondre à tes demandes via le service client.

Nous n'utilisons pas tes données à des fins de publicité ciblée et nous ne
les vendons pas à des tiers.

## 4. Avec qui ces données sont partagées

- Supabase, notre hébergeur de base de données et de fichiers, qui stocke les
données pour notre compte.
- Google, uniquement dans le cadre de la connexion via Google (authentification).
- À terme, un opérateur de paiement Mobile Money, pour le traitement des
recharges et retraits — cette intégration n'est pas encore active.

Aucune autre société n'a accès à tes données personnelles.

## 5. Combien de temps nous les conservons

Tes données sont conservées tant que ton compte existe. Les documents de
vérification d'identité (KYC) sont conservés uniquement le temps nécessaire à
la vérification, puis à la durée requise par nos obligations légales. Tu peux
demander la suppression de ton compte et de tes données à tout moment via le
service client.

## 6. Tes droits

Conformément à la réglementation applicable en Côte d'Ivoire sur la
protection des données à caractère personnel, tu disposes d'un droit d'accès,
de rectification et de suppression de tes données. Pour exercer ces droits,
contacte le service client depuis ton profil dans l'application.

## 7. Sécurité

Les mots de passe et sessions sont protégés par des mécanismes de chiffrement
standards. Les documents de vérification d'identité sont stockés dans un
espace privé, non accessible publiquement, réservé à l'équipe
d'administration. Si tu repères une faille de sécurité, merci de nous la
signaler sans délai via le service client.

## 8. Contact

Pour toute question relative à cette politique de confidentialité, contacte
notre service client directement depuis ton profil dans l'application.

---

*Cette politique peut évoluer avec les fonctionnalités de l'application. La
date de dernière mise à jour figure en haut de cette page.*
`;

export default function PolitiqueConfidentialitePage() {
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
            Politique de confidentialité
          </h1>
        </div>

        <div
          className="p-4"
          style={{ borderRadius: "var(--ds-radius-md)", background: "var(--ds-surface)", border: "1px solid var(--ds-border)" }}
        >
          <RenduTexteLegal texte={CONTENU} />
        </div>

        <div className="text-center text-xs pb-6" style={{ color: "var(--ds-muted)" }}>
          Voir aussi les{" "}
          <Link href="/conditions-utilisation" className="underline">
            conditions d&apos;utilisation
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
