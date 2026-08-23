@AGENTS.md

# Tourney — Contexte projet

App de gestion de tournoi gaming IRL (inscriptions, bracket, scores en direct)
pour des événements gaming en Côte d'Ivoire.

## Stack
- Next.js (App Router) + Tailwind CSS
- Supabase (Postgres)
- Hébergement Vercel
- Interface en français, mobile-first

## Modèle de données

Event {
  id, nom, jeu, date, lieu, max_participants, frais_inscription,
  statut [ouvert, cloture, en_cours, termine], created_at
}

Participant {
  id, event_id (FK), nom, pseudo_tiktok, whatsapp,
  statut_paiement [en_attente, paye], created_at
}

Match {
  id, event_id (FK), round, position,
  participant1_id (FK, nullable), participant2_id (FK, nullable),
  score1, score2, gagnant_id (FK, nullable),
  statut [a_venir, en_cours, termine]
}

Admin {
  id, code_acces
}

## Plan de développement (une étape par session, dans l'ordre)
1. Fondations (Next.js + Tailwind + Supabase + tables) — TERMINÉE
2. Création et affichage d'un événement — TERMINÉE
3. Inscription — TERMINÉE
4. Gestion admin des inscrits — TERMINÉE
5. Génération du bracket — TERMINÉE
6. Affichage du bracket — TERMINÉE
7. Saisie des scores — TERMINÉE
8. Live refresh (polling) — TERMINÉE, à confirmer
9. Polish

## Design system
Fond crème/beige (pas de dark mode), accent vert sapin (#0f3d3e), soft UI
(ombres douces, coins arrondis). Tokens dans src/app/globals.css (@theme :
couleurs cream-*/ink-*/forest-*, radius, ombres --shadow-*, classes
.layer-base/raised/inset/pressed, motifs .motif-points/.motif-damier).
Classes de formulaire partagées dans src/lib/ui.ts. Icônes dans
src/components/icons.tsx. Réutiliser ces tokens pour tout nouveau composant,
ne pas réintroduire de couleurs ad hoc.

Exception : la page /evenements/[id]/live (bracket public) a un thème
"esport" dédié — fond navy (--color-navy-*), accent cyan (--color-cyan-*),
cartes de match sombres, connecteurs SVG mesurés en JS dans
BracketEsport.tsx. Ces tokens navy/cyan sont réservés à cette page, ne pas
les utiliser ailleurs.

## Roadmap V2 — expérience gaming étendue

Chantier séparé du plan V1 ci-dessus, basé sur une exploration de design plus
ambitieuse (app complète Joueur/Organisateur, voir le canvas de design
"TourneyCI - Design interactif gaming" importé via DesignSync). Deux
directions visuelles à comparer : **Nocturne** (sombre, accent blurple) et
**Organic** (clair, terracotta). Système de tokens dédié dans
src/app/globals.css sous `:root[data-theme="nocturne"|"organic"]`
(préfixe `--ds-*`), séparé des tokens du site actuel (cream/forest/navy) —
ne pas mélanger les deux systèmes. Composants dans src/components/ds/.

1. Fondations design system + démo (`/design-system`) — TERMINÉE
2. Splash intégré au vrai flux + Onboarding (téléphone + Google, mockés) — TERMINÉE
3. Accueil + Détail tournoi (données mock) — TERMINÉE
4. Paiement Mobile Money (mock) + inscription — TERMINÉE
5. Bracket + Match live (Realtime simulé) — TERMINÉE
6. Profil + Classement — TERMINÉE, à confirmer
7. Espace Organisateur
8. Bascule sur Supabase réel (nouveau modèle de données, RLS, webhooks)

Les phases 2-8 ne sont pas commencées : à traiter une par une, confirmées
avant de passer à la suivante, comme pour le plan V1. Le site V1 actuel
(accueil, inscription, dashboard admin, bracket live) continue de
fonctionner en parallèle sans être affecté par ce chantier tant que la
bascule (phase 8) n'est pas décidée.

## Backlog (fonctionnalités futures, non implémentées)

- **Stream PC compagnon** (point 110) : un organisateur de tournoi à
  distance (non présentiel) pourra streamer en direct l'écran de son PC
  vers l'app, via une application compagnon PC connectée à l'app
  mobile/web Tourney. Les spectateurs verront alors la partie en cours
  dans le cadre de stream de la fiche tournoi (état "en direct", point
  109). Ne concerne pas les tournois présentiels, où les spectateurs
  suivent l'événement physiquement sur place. Ni l'application PC
  compagnon ni l'intégration du flux ne sont construites tant que cette
  étape n'est pas explicitement planifiée (cf. règle ci-dessous).

## Règle
Ne jamais anticiper une étape future, même si ça semble plus rapide.
Terminer et faire confirmer l'étape en cours avant de passer à la suivante.
