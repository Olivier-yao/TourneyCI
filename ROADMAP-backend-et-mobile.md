# Feuille de route — Backend puis App mobile

> **Avancement** : Prisma est installé et un premier schéma est écrit
> (`prisma/schema.prisma`) couvrant auth, profils joueur/organisateur,
> tournois, inscriptions, équipes pré-créées + invitations, adjoints,
> demandes d'annulation. Il est validé (`npx prisma validate`) et le client
> est généré. La base réelle est **Supabase** (projet existant, 34 tables +
> RLS déjà en place) — `DATABASE_URL` pointe vers le Transaction Pooler
> (seule connexion joignable en IPv4 depuis cet environnement) et
> l'adaptateur Prisma est `@prisma/adapter-pg`. Ce qui reste bloqué : lancer
> `npx prisma db pull` pour introspecter les 34 tables réelles et remplacer
> le schéma ci-dessus (dessiné à la main, donc probablement pas 1:1 avec le
> vrai schéma Supabase) — la commande se lance sans erreur mais reste
> bloquée sans jamais aboutir depuis ce bac à sable, sans doute un blocage
> réseau supplémentaire côté pooler. À relancer depuis ta machine ou depuis
> Vercel (où l'egress réseau est probablement moins restreint), ou
> partage-moi un export du schéma Supabase (SQL ou capture de l'éditeur de
> tables) pour que je le reconcilie manuellement.
>
> Côté auth applicative (frontend) : le flux numéro de téléphone/SMS/Twilio a
> été retiré du produit — `/verify` ne propose plus que Google (bouton
> direct) ou e-mail + mot de passe (`src/lib/mockAuth.ts`, encore un mock
> localStorage tant que Supabase Auth n'est pas câblé, mais le champ
> identifiant est déjà un e-mail partout, prêt pour le vrai câblage).

## 1. État actuel (constat factuel)

TourneyCI est aujourd'hui **100 % frontend** : Next.js 16 + React 19, aucune
dépendance backend (`package.json` ne contient ni base de données, ni ORM,
ni lib d'auth serveur), aucune route API (`src/app/api` n'existe pas),
`.env.example` le dit explicitement : *"Aucune variable d'environnement
requise : l'app est entièrement mock-first (localStorage), sans backend"*.

Toute la logique métier vit dans **32 modules `src/lib/mock*.ts`**, chacun
simulant un domaine (auth, tournois, inscriptions, chat, wallet, litiges,
adjoints, équipes, etc.) en lisant/écrivant dans le `localStorage` de
l'appareil. C'est du **mono-appareil** : rien n'est partagé entre deux
téléphones, pas de vrais comptes.

Point architectural positif : chaque écran React appelle des fonctions
exportées par ces modules (`tournoiParId()`, `enregistrerInscription()`,
`peutSuperviser()`...) plutôt que de manipuler `localStorage` directement.
Le jour où ces fonctions parlent à une vraie API au lieu du localStorage,
**les composants n'ont presque rien à changer** — c'est le principal atout
pour la migration à venir.

## 1.5 Ce dont j'ai besoin de toi pour continuer

1. **Débloquer l'introspection Supabase** : soit tu relances toi-même
   `npm run prisma:pull --workspace` (ou directement `npx prisma db pull`
   depuis ta machine), soit tu me colles un export du schéma (SQL depuis
   l'éditeur Supabase, ou juste la liste des 34 tables avec leurs colonnes)
   pour que je reconcilie `prisma/schema.prisma` à la main sans dépendre de
   la connexion réseau de cet environnement.
2. **Confirmer le choix de stack API** : je pars sur des Route Handlers
   Next.js (`src/app/api/**/route.ts`) plutôt qu'un service Express séparé,
   pour rester dans le même déploiement Vercel que le frontend actuel —
   dis-moi si tu préfères découpler dès maintenant.
3. **Activer Supabase Auth** : dans le dashboard Supabase, onglet
   **Authentication → Providers**, active Google (client ID/secret Google
   Cloud à créer si pas déjà fait) et Email/mot de passe, désactive le
   reste (pas de téléphone/SMS). Le frontend est déjà prêt côté UI
   (`/verify` ne propose plus que Google ou e-mail + mot de passe) — il ne
   reste qu'à remplacer `src/lib/mockAuth.ts` par le SDK `@supabase/ssr` une
   fois les clés du projet (`NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`) confirmées dans `.env`.
4. Rien d'autre n'est requis pour que je continue à modéliser les domaines
   suivants (chat, wallet, notifications...) en parallèle.

## 2. Reste à faire : backend

### 2.1 Fondations
- **Choisir la stack.** Vu que le reste du code est Next.js, l'option la
  plus simple est des Route Handlers Next.js (`src/app/api/**/route.ts`) +
  Prisma + PostgreSQL, sans service séparé. Alternative : un backend Express
  dédié (comme dans le monorepo ExcelHub Africa) si tu préfères découpler
  front et back dès maintenant.
- **Base de données** : modéliser en tables réelles chaque type actuellement
  mocké — utilisateurs, profils organisateur, tournois, inscriptions,
  équipes (pré-créées et éphémères BR), matchs/manches, messages de chat,
  notifications, transactions wallet, demandes (adjoint, annulation,
  certification), litiges, avis (cœur/cœur brisé), abonnements/follows.
- **Auth réelle** — remplace `mockAuth.ts` par Supabase Auth (Google OAuth +
  email/mot de passe, plus de téléphone/SMS/Twilio, déjà retiré côté UI) :
  sessions gérées côté serveur, plus de "connecté" simulé par un flag
  localStorage.
- **Stockage fichiers** — les photos/bannières sont aujourd'hui des
  data URLs en localStorage ; il faut un object storage (S3, Cloudflare R2,
  Supabase Storage) + redimensionnement serveur.

### 2.2 Le point le plus critique : sécurité côté serveur
Le bug de sécurité corrigé cette session (`estOrganisateur()` — bascule
globale — utilisé à la place de `peutSuperviser()` — relation au tournoi
précis) n'était grave que parce que **tous les contrôles d'accès du mock
tournent côté client**, contournables en modifiant le JS/localStorage du
navigateur. C'est acceptable pour un mock, **inacceptable dès qu'il y a un
vrai backend** : chaque contrôle (`peutSuperviser`, `estProprietaire`,
propriétaire d'une équipe, etc.) doit être **revérifié côté serveur** sur
chaque endpoint, jamais fait confiance au client. Idem pour le PIN admin
(`mockAdminSecure.ts`), aujourd'hui codé en dur côté client.

### 2.3 Paiement réel
Le "wallet" et les gains sont simulés (`mockWallet.ts`, séquestre, etc.).
Un vrai lancement demande une intégration Mobile Money (Orange Money, MTN
Mobile Money, Wave, Moov...) via leurs API, avec webhooks pour confirmer les
paiements et déclencher les versements — un chantier à part entière avec
ses propres exigences de conformité.

### 2.4 Temps réel
Chat et classements sont actuellement en polling (`setInterval` 15s). Un
vrai produit voudra du temps réel (WebSockets, Supabase Realtime, Pusher,
ou Server-Sent Events) pour le chat, le classement en direct BR, et les
notifications.

### 2.5 Autres domaines mockés à remplacer
- Vérification d'identité et détection de fraude (`mockAnalyseAutomatique.ts`,
  `mockValidationAuto.ts`) — aujourd'hui auto-validées, il faudra soit un
  vrai service de vérification (KYC), soit un processus de modération
  humaine réel.
- Notifications push natives (FCM/APNs) plutôt qu'un flux in-app seul.
- Modération/support (`mockPlaintes.ts`, service client) avec une vraie
  file de traitement.

## 3. Reste à faire : après le backend

- **Migration écran par écran** : remplacer les appels `mock*.ts` par des
  appels API, module par module, en gardant les mêmes signatures de
  fonction quand c'est possible pour limiter les changements dans les
  composants React.
- **Tests d'intégration multi-appareils** : tout ce qui n'était testable
  qu'en mono-appareil (adjoints, invitations d'équipe, chat) doit être
  revérifié avec deux vrais comptes sur deux appareils.
- **Conformité légale** : CGU, politique de confidentialité publiée
  (obligatoire pour les stores), cadre réglementaire local pour les
  paiements et la collecte de données.
- **Observabilité** : logs, monitoring, alerting — indispensable dès qu'il
  y a de l'argent réel qui circule (paiements, séquestre, litiges).
- **Support client réel**, pas juste un lien statique.

## 4. App mobile (Play Store / App Store)

Le code actuel est 100 % web (React/Next.js), donc les options sont :

| Option | Réutilisation du code | Effort | Publiable sur les stores |
|---|---|---|---|
| PWA seule | 100 % | Faible | Android via TWA seulement ; pas Apple |
| **Capacitor (Ionic)** | ~100 % | Faible-moyen | Oui, les deux stores |
| React Native / Expo | ~0 % (réécriture UI) | Élevé | Oui, les deux stores |
| Flutter | 0 % (autre langage) | Très élevé | Oui, les deux stores |

**Recommandation : Capacitor.** Il enveloppe le build web existant dans un
conteneur natif (WebView) pour Android et iOS, donne accès aux API natives
via plugins (push, caméra, partage...), et surtout ne demande **aucune
réécriture** de l'interface déjà construite — chaque nouvel écran continue
d'être développé comme une page web classique, testé dans le navigateur
comme aujourd'hui, et fonctionne directement dans l'app.

### Étapes concrètes de publication
1. Intégrer Capacitor au projet Next.js (build statique ou hybride).
2. Ajuster le layout pour les zones sûres (encoches, barres système) — déjà
   largement mobile-first donc peu de travail attendu.
3. Comptes développeur : Google Play (25 $ une fois) + Apple Developer
   Program (99 $/an).
4. Icônes, splash screens natifs, fiche store (captures d'écran, description
   en français).
5. Politique de confidentialité publique (obligatoire, d'autant plus qu'il
   y a paiements et données personnelles).
6. Notifications push natives (FCM Android / APNs iOS) — dépend du backend
   pour déclencher les envois.
7. Test interne puis soumission — le délai de review Apple est en général
   plus long que celui de Google.

L'app mobile n'est donc pas un chantier à part : c'est une **dernière
étape d'empaquetage** une fois le backend en place, pas une réécriture.
