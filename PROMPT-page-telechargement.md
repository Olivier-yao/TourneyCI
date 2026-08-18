# Prompt Claude Design — Page de téléchargement/installation de l'app

## Contexte produit (pour que le design colle à la réalité)

TourneyCI est aujourd'hui une **web app** (Next.js), pas encore publiée sur
le Google Play Store ni l'App Store — l'empaquetage natif (Capacitor) est
prévu **après** le backend réel, pas fait aujourd'hui. En attendant cette
publication, l'app est installable comme **PWA** ("Ajouter à l'écran
d'accueil") depuis le navigateur, sur Android comme sur iOS.

Cette page doit donc fonctionner **dès maintenant** avec l'installation PWA,
tout en prévoyant visuellement l'arrivée future des vraies fiches Play
Store / App Store (les badges peuvent déjà être dessinés, avec un état
"Bientôt disponible" tant que l'app n'y est pas encore).

C'est une page **publique**, non authentifiée — c'est le premier contact
avec la marque pour quelqu'un qui reçoit un lien partagé (réseaux sociaux,
Discord, bouche-à-oreille). Contrairement aux écrans de l'app, elle doit
être pensée pour du web classique, **desktop et mobile**, pas seulement un
cadre 360px.

Rappel produit pour le ton et le contenu : plateforme esport pour l'Afrique
de l'Ouest (Abidjan, Bouaké, Yamoussoukro pour l'instant), tournois FIFA/EA
FC, Free Fire, Call of Duty Mobile, Tekken 8, cash prize versé en FCFA via
Mobile Money (Orange Money, MTN, Moov, Wave), organisateurs vérifiés,
classement national. Version bêta actuelle.

## Identité visuelle à respecter strictement

- **Logo** : badge carré à coins arrondis, fond violet foncé uni, contenant
  un losange (carré tourné 45°) plein violet clair avec légère lueur, suivi
  du mot-symbole **"Tourney"** ("Tourn" en blanc cassé, "ey" en violet
  clair). Ne pas dessiner de variante différente.
- **Mascotte** : personnage construit dans le même langage géométrique que
  le logo — corps en carré arrondi, "visage" en losange lumineux (écho
  direct du logo), silhouette simple façon icône, pose de compétiteur
  (poing levé ou manette de jeu stylisée). Même famille visuelle que le
  logo, pas un style différent (pas d'animal réaliste, pas de cartoon
  Disney/manga).
- **Thème** : cette page publique tourne uniquement sur le thème par défaut
  **Nocturne** (fond violet-nuit `--ds-bg` #161826, accent violet clair
  `--ds-accent-300` #b5abfc, surfaces `--ds-surface`/`--ds-surface-2`) —
  pas besoin de la décliner dans les 4 thèmes, l'utilisateur n'a pas encore
  de compte à ce stade donc pas de préférence de thème à respecter.

## Ce qu'il faut concevoir

### 1. Hero
- Mascotte + logo bien visibles, gros titre accrocheur en français (ex.
  "Le tournoi commence ici" — reprend la baseline déjà utilisée sur l'écran
  de lancement de l'app), sous-titre en une phrase expliquant la promesse
  (tournois, cash prize FCFA, organisateurs vérifiés)
- CTA principal immédiat : bouton "Télécharger l'app" qui scrolle vers la
  section téléchargement

### 2. Aperçu de l'app
- Bande de mockups/captures d'écran (3-4 écrans clés : accueil avec
  tournois en direct, bracket, classement/podium, profil organisateur) dans
  des cadres de téléphone stylisés, légèrement inclinés/superposés pour
  donner du dynamisme

### 3. Points forts (3-4 cartes courtes)
- Ex. "Cash prize versé sous 24h", "Organisateurs vérifiés", "Mobile
  Money accepté (Orange, MTN, Moov, Wave)", "Classement national par ville"
- Icônes simples cohérentes avec le reste du design system (déjà utilisé
  dans l'app), pas de nouvelles icônes exotiques

### 4. Section téléchargement (le cœur de la page)
- **Deux badges store** (Google Play / App Store) côte à côte, dessinés
  dans un état "Bientôt disponible" (légèrement estompés, avec une petite
  pastille "bientôt") — prévoir aussi leur état final actif pour plus tard
- **Installation immédiate (PWA)**, mise en avant comme option principale
  tant que les stores ne sont pas prêts :
  - Un **QR code** à scanner (pour installer directement depuis un
    ordinateur en pointant son téléphone dessus)
  - Deux blocs d'instructions courtes et illustrées, un par plateforme :
    - **Android (Chrome)** : "Ouvre le menu ⋮ → Installer l'application"
    - **iOS (Safari)** : "Appuie sur Partager 􀈂 → Sur l'écran d'accueil"
  - Détection simple : si la page est ouverte depuis un téléphone, elle
    peut afficher directement le bloc correspondant à la plateforme
    détectée en premier (Android ou iOS), l'autre restant visible en
    dessous

### 5. Footer
- Liens CGU / politique de confidentialité / service client, réseaux
  sociaux si pertinent, mention "Version bêta"

## Contraintes de cohérence avec l'existant

- Réutiliser les tokens `--ds-*` déjà définis (couleurs, rayons, ombres,
  polices) du thème Nocturne, aucune couleur en dur
- Ton 100% français, direct, pas de jargon technique
- Responsive réel : layout desktop large (hero en deux colonnes, mockups
  côte à côte) ET layout mobile empilé (colonne unique) — donner les deux
  versions, pas seulement un cadre 360px comme les écrans internes de l'app

## Ce qui n'est PAS demandé ici

- Pas de vrais liens de stores fonctionnels (l'app n'y est pas encore) —
  juste l'état visuel "bientôt disponible"
- Pas de formulaire d'inscription/newsletter sur cette page — uniquement le
  téléchargement
- Pas besoin de décliner dans les 4 thèmes du produit (page pré-connexion,
  thème Nocturne uniquement)
