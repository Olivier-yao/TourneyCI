# Prompt Claude Design — Écran de Clôture du tournoi

## Contexte produit

Suite à un retour utilisateur, la clôture du tournoi a été sortie de la page
"Gestion en direct" pour devenir un écran dédié, accessible via le bouton
"Clôture" du menu de gestion (`/organisateur/[id]/cloture`). L'implémentation
fonctionnelle existe déjà (voir `src/app/organisateur/[id]/cloture/page.tsx`)
mais réutilise des blocs génériques du design system sans traitement visuel
propre — c'est ce qu'il faut concevoir.

Règles métier à respecter (ne pas les changer, seulement les habiller) :

- La clôture est **automatique et définitive**, jamais un bouton manuel —
  elle se déclenche dès que le classement final est calculable (dernier
  match du bracket joué, ou nombre de manches Battle Royale atteint).
- Avant clôture : affichage d'un état "en cours" avec la progression vers
  la clôture (ex. "2/3 manches jouées" pour un Battle Royale, ou "en attente
  de la finale" pour un bracket).
- Une fois clôturé : confirmation que les points ont été attribués, et que
  le gain (s'il y en a) part en séquestre le temps de recueillir les avis
  (cœur/cœur brisé) des participants.
- Le seul geste que l'organisateur (propriétaire uniquement, pas les
  adjoints) peut poser ici est la **demande d'annulation**, avec un motif
  obligatoire — elle part à l'administration pour inspection.

## Ce qu'il faut concevoir

### 1. Mise en garde d'entrée
Un bandeau d'avertissement en haut d'écran, avant tout le reste, qui pose
clairement : la clôture est automatique, définitive, et ce qu'elle déclenche
(points + versement des gains). Actuellement un simple encart avec icône
triangle — à transformer en élément visuellement distinct (pas juste un
bloc parmi d'autres), pour que l'organisateur comprenne l'enjeu avant
d'aller plus loin sur cet écran.

### 2. État "en cours"
Une représentation visuelle de la progression vers la clôture plutôt qu'une
simple phrase :
- Bracket : à quelle étape en est-on (quarts, demies, finale) ?
- Battle Royale : jauge ou compteur "manches jouées / manches prévues".

### 3. État "clôturé"
Un état de confirmation satisfaisant (pas juste une bannière verte) :
points attribués, montant en séquestre le cas échéant, avec un lien vers le
classement final ou la fiche du tournoi.

### 4. Demande d'annulation
Le bouton et la modale de motif existent déjà fonctionnellement — leur
donner un traitement qui souligne le poids de l'action (ça compte contre la
réputation de l'organisateur) sans pour autant décourager un signalement
légitime. Distinguer visuellement l'état "en attente d'examen" une fois la
demande envoyée.

## Contraintes de cohérence avec l'existant

- Réutiliser les tokens du design system (`--ds-*`), fonctionner dans les 4
  thèmes (Nocturne, Organic, Voltage, Wax).
- Rester cohérent avec le reste du menu de gestion (Check-in, Manches/Scores,
  Paramètres, Aperçu) dans le ton et la densité d'information.
- Mobile-first, écran de référence 366-375px de large.
- Français, ton direct.
