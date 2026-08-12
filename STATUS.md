# Tourney — Pitch & état du projet

_Dernière mise à jour : 2026-08-01_

## Pitch

**Tourney** est une application de gestion de tournois esport pensée pour la Côte d'Ivoire et l'Afrique de l'Ouest. Elle connecte deux publics dans une seule app : les **joueurs**, qui découvrent des tournois près de chez eux (EA FC, Free Fire, CODM, Tekken, et bien d'autres), s'inscrivent en quelques secondes et sont payés directement en Mobile Money quand ils gagnent — et les **organisateurs**, qui créent et pilotent leurs compétitions (1v1, équipes, battle royale) sans avoir besoin d'un site web ou d'un tableur pour gérer inscriptions, bracket et prize pool.

Le cœur du produit : un **portefeuille intégré (TourneyCard)** qui fait le pont entre inscription et gain — un joueur peut recharger sa carte depuis Orange Money, MTN, Moov ou Wave, payer ses inscriptions instantanément, et récupérer ses gains automatiquement dès qu'un tournoi se termine, sans attendre un virement manuel de l'organisateur. Le classement nourrit une progression durable (points par jeu et par ville, saisons), et un système de certification d'identité protège la plateforme et ses utilisateurs avant tout retrait d'argent.

L'app est construite pour 4 ambiances visuelles au choix (Nocturne, Organic, Voltage, Wax), pensée mobile-first, et vise à terme une publication native sur Play Store et App Store.

---

## Ce qui est déjà fait

### Fondations & design
- Design system tokenisé (`--ds-*`) avec **4 thèmes** complets : Nocturne, Organic, Voltage, Wax — sélecteur permanent dans Profil > Réglages
- Transitions de page dont le style suit le thème actif
- Splash animé + onboarding (carrousel auto-défilant, 4 écrans)
- Authentification mock (téléphone + OTP, Google) avec **garde de connexion réelle** (déconnexion effective sur les 4 pages principales)

### Découverte & navigation
- Accueil : bascule Joueur/Organisateur, recherche (titre + code tournoi), notifications, filtre par jeu (15 jeux + "Autre" personnalisable)
- En-tête + bascule de rôle **collants** en haut, barre de navigation **fixe** en bas
- Page Tournois avec recherche et filtre dédiés

### Tournois
- Création complète : jeu, titre, format (1v1 / Équipes libres ou prédéfinies / Battle Royale), présentiel (avec lieu) ou virtuel, places, **date/heure via sélecteurs natifs**, gratuit/payant, **répartition du cash prize configurable** (vainqueur / top 3 / personnalisée), règlement, **upload de bannière**
- Chaque tournoi a un **code court** unique (ex. `AC12X4`), cherchable
- Détail tournoi : infos complètes, progression des places, partage (Web Share API), favoris, notifications par tournoi
- Inscription avec paiement : **Orange Money, MTN MoMo, Moov Money, Wave, TourneyCard** — persistance réelle, état "Déjà inscrit"
- Bracket : génération automatique ou manuelle par l'organisateur, **auto-remplissage des inscrits réels**, édition des scores avec propagation du vainqueur, case finale "Vainqueur"
- Battle Royale : gestion des éliminations (persistées), fil d'actions en direct (ex. "X a éliminé Y") avec boutons prédéfinis

### Argent
- **Solde & TourneyCard** : recharge (4 moyens mobile money), retrait (frais 1 % transparents, plancher/plafond), historique des mouvements, carte visuelle avec photo du joueur
- **Clôture automatique du tournoi** : distribution des points de classement équilibrée selon la place finale, crédit automatique du cash prize aux gagnants, crédit de la commission organisateur (5 %) si certifié
- **Vérification d'identité** (âge + document) obligatoire pour tout retrait et pour toucher la commission organisateur

### Profil & progression
- Photo de profil avec recadrage, pseudo/ville éditables
- Historique de tournois, mes inscriptions, favoris
- Classement par jeu et par ville (menus déroulants), vues agrégées, saison nommée
- Badge "Organisateur certifié" + classement des meilleurs organisateurs (participants totaux, note, tournois annulés)
- Bouton de déconnexion fonctionnel

### Organisateur
- Panneau de gestion en direct : édition des scores, clôture du tournoi, ajustement manuel des points
- Notifications automatiques aux inscrits/abonnés (bracket généré, tournoi clôturé)

### Qualité
- `tsc`, `eslint`, `next build` verts sur l'ensemble des routes
- Poussé sur GitHub (`Olivier-yao/TourneyCI`), déploiement Vercel en cours de configuration par l'utilisateur

---

## Ce qui n'est PAS encore fait

- **Aucun vrai backend** : tout est simulé en `localStorage` du navigateur — rien n'est partagé entre appareils ni entre utilisateurs réels. Un seul "compte" existe réellement (le tien), les autres joueurs/organisateurs visibles sont des données de démonstration statiques.
- Pas de vraie authentification (SMS OTP et Google OAuth sont simulés, aucun SMS n'est réellement envoyé)
- Pas de vrais paiements Mobile Money (aucune connexion à un agrégateur réel — CinetPay, PayDunya, etc.)
- Vérification d'identité **factice** : uploader n'importe quel fichier suffit à être "certifié" instantanément, aucune vérification humaine ou automatisée réelle
- Pas de système d'avis/notes réel pour les organisateurs (notes actuellement statiques)
- Pas de réinitialisation automatique des saisons (juste un label cosmétique "se termine dans 18 jours")
- Pas de vraies notifications push mobiles (juste une liste en localStorage)
- Pas de gestion de litiges structurée (bouton "Litige" présent sur le match en direct mais sans flux de résolution)
- Aucun test automatisé (unitaire ou end-to-end)
- Pas encore d'app mobile packagée (Capacitor/React Native) ni de publication Play Store / App Store
- Pas encore déployée en production (Vercel en cours de mise en place)

---

## Ce qui doit être fait (feuille de route, phase 8)

1. **Déploiement** — finaliser le déploiement Vercel pour un premier test utilisateur réel sur une vraie URL
2. **Retours utilisateur** — faire tester l'app telle quelle (mock) pour valider les parcours et remonter bugs/améliorations avant d'investir dans le backend
3. **Backend réel (Supabase)** — authentification (SMS OTP réel, Google OAuth réel), base de données (tournois, inscriptions, utilisateurs partagés entre appareils), stockage (photos, bannières, documents de vérification)
4. **Paiements réels** — intégration d'un agrégateur Mobile Money ivoirien pour dépôts/retraits réels, webhooks de confirmation
5. **Vérification d'identité réelle** — processus de modération (humaine ou via un prestataire KYC) au lieu de la validation instantanée actuelle
6. **Notifications push réelles** — service de notifications mobiles (Firebase Cloud Messaging ou équivalent)
7. **Empaquetage mobile** — Capacitor (réutilise le code web) ou React Native, tests sur devices réels
8. **Publication stores** — comptes développeur Play Store / App Store, conformité (politique de paiement, RGPD/protection des données), soumission

---

## Instruction pour reprendre le travail

> Reprends le projet **Tourney** (dossier local `C:\personnel\claude\TourneyCI`, repo GitHub `Olivier-yao/TourneyCI` — noms de dossier/repo inchangés, seul le nom du produit est devenu "Tourney", branche `master`). Lis `STATUS.md` à la racine du projet pour l'état complet (pitch, fait / pas fait / à faire). L'app est en **mock-first** : aucun vrai backend, tout est simulé via `localStorage` (voir les modules `src/lib/mock*.ts`). Avant de coder : lance `npx tsc --noEmit` et `npm run lint` pour repartir d'une base propre. Après toute modification : revérifie ces deux commandes, teste dans le navigateur (le Next.js dev tourne sur le port 3000, `.next/` doit être vidé avant un redémarrage si des 404 étranges apparaissent), commit et push sur GitHub uniquement si demandé explicitement. Demande à l'utilisateur quelle tâche de la section "Ce qui doit être fait" il souhaite attaquer en premier, sauf s'il a déjà précisé une demande spécifique.
