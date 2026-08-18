# Feuille de route — Backend puis App mobile

> **Avancement** : le vrai schéma Supabase est introspecté —
> `prisma/schema.prisma` reflète maintenant les **62 modèles réels** (34
> tables applicatives dans `public` + tables internes de Supabase Auth dans
> `auth`, ex. `auth.users`), plus les modèles internes que Supabase gère
> lui-même (RLS, contraintes). Client Prisma régénéré (`npx prisma
> generate`), tout compile (`npx tsc --noEmit`). Rien dans `src/lib/mock*.ts`
> n'utilise encore ce client — c'est la base pour la prochaine étape : écrire
> les premières routes API et migrer les modules mock un par un.
>
> **Ce qui a débloqué l'introspection** (pour référence si ça se reproduit
> sur un autre projet Supabase) : le pooler "Transaction" (port 6543,
> `DATABASE_URL`) ne supporte pas les *prepared statements* — `npx prisma db
> pull`/`migrate` s'y connectent mais restent bloqués indéfiniment, sans
> jamais retourner d'erreur. Il faut utiliser le pooler "Session" (port
> 5432, `DIRECT_URL` dans `.env`) pour ces commandes CLI uniquement, en
> écrasant temporairement `DATABASE_URL` :
> `DATABASE_URL="$DIRECT_URL" npx prisma db pull`. Il a aussi fallu ajouter
> `schemas = ["public", "auth"]` au bloc `datasource` du schéma, car
> `public.profiles` référence `auth.users` par clé étrangère (Supabase
> gère l'auth dans son propre schéma, pas dans `public`).
>
> **Auth réelle branchée** : `/verify` appelle désormais le vrai SDK
> Supabase Auth (`@supabase/ssr`) — Google OAuth et e-mail/mot de passe
> testés de bout en bout dans le navigateur (création de compte réelle,
> confirmation par e-mail, redirection OAuth Google jusqu'à l'écran de
> consentement). Plus de numéro de téléphone/SMS/Twilio, plus de mot de
> passe stocké côté client. `src/lib/mockAuth.ts` garde son rôle pour les
> préférences locales à l'appareil (onboarding vu, rôle préféré, transition
> d'entrée) — ce sont des flags UI, pas de l'auth, pas de raison de les
> migrer. Fichiers ajoutés : `src/lib/supabase/{client,server}.ts`,
> `src/middleware.ts` (rafraîchit la session à chaque requête),
> `src/app/auth/callback/route.ts` (échange le code OAuth contre une
> session). Reste non couvert : session server-side dans les Server
> Components/Route Handlers (le client `server.ts` existe mais rien ne
> l'utilise encore, puisqu'il n'y a pas encore de route API) et les
> contrôles d'accès métier (`peutSuperviser`, propriétaire d'équipe...) qui
> tournent toujours côté client — cf. 2.2 ci-dessous, inchangé tant qu'il
> n'y a pas d'API à sécuriser.

## 1. État actuel (constat factuel)

TourneyCI est **presque entièrement frontend** : Next.js 16 + React 19.
L'auth est désormais réelle (Supabase Auth, cf. encadré tout en haut) et
Prisma + le schéma Supabase sont en place, mais aucune route API n'existe
encore (`src/app/api` n'existe pas) — l'auth exceptée, tout le reste passe
encore par le localStorage.

Toute la logique métier (hors auth) vit dans **~30 modules
`src/lib/mock*.ts`**, chacun simulant un domaine (tournois, inscriptions,
chat, wallet, litiges, adjoints, équipes, etc.) en lisant/écrivant dans le
`localStorage` de l'appareil. C'est du **mono-appareil** pour ces
domaines-là : rien n'est partagé entre deux téléphones tant qu'ils n'ont
pas leur propre route API.

Point architectural positif : chaque écran React appelle des fonctions
exportées par ces modules (`tournoiParId()`, `enregistrerInscription()`,
`peutSuperviser()`...) plutôt que de manipuler `localStorage` directement.
Le jour où ces fonctions parlent à une vraie API au lieu du localStorage,
**les composants n'ont presque rien à changer** — c'est le principal atout
pour la migration à venir.

## 1.5 Ce dont j'ai besoin de toi pour continuer

1. **Confirmer le choix de stack API** : je pars sur des Route Handlers
   Next.js (`src/app/api/**/route.ts`) plutôt qu'un service Express séparé,
   pour rester dans le même déploiement Vercel que le frontend actuel —
   dis-moi si tu préfères découpler dès maintenant.
2. Rien d'autre n'est requis pour que je continue à modéliser les domaines
   suivants (chat, wallet, notifications...) ou à commencer les premières
   routes API en parallèle.

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
- ~~**Auth réelle**~~ — fait : Supabase Auth (Google OAuth + email/mot de
  passe) branché via `@supabase/ssr`, testé de bout en bout. Reste
  seulement à utiliser le client serveur (`src/lib/supabase/server.ts`,
  déjà écrit mais pas encore appelé) une fois les premières routes API
  créées, pour vérifier la session côté serveur sur chaque endpoint.
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
