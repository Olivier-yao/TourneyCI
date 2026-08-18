# Prompt Claude Design — Gestion d'équipe + chat d'équipe

## Contexte produit (pour que le design colle aux vraies données)

TourneyCI a des **équipes pré-créées** gérées depuis le profil (indépendantes
d'un tournoi précis — `EquipeProfil` dans `mockEquipesProfil.ts`) :

- `nom`, `chef` (le créateur), `membres: string[]` (le chef en fait partie)
- Max **5 équipes** dont on peut être chef, max **4 membres** par équipe
- Renommage limité à **1 fois par mois**
- Invitation d'un membre par **TAG** (recherche de profil), pas d'ajout
  direct — l'invité doit accepter depuis son propre onglet "Invitations"
- Seul le **chef** peut : renommer, inviter, retirer un membre, supprimer
  l'équipe. Un membre non-chef peut juste proposer l'équipe à un tournoi
  (validation finale par le chef).

Aujourd'hui ces actions sont **toutes inline** dans la liste "Mes équipes"
(onglet "Précréées") — il n'existe **aucun écran dédié** par équipe, et
**aucun chat d'équipe**. C'est ce qui manque.

Le produit a un chat par tournoi (`mockChat.ts` : `{ id, auteur, texte,
horodatage, role }`, persisté par tournoi) — le chat d'équipe doit suivre le
même esprit (liste de messages + champ de saisie + horloge locale FR), mais
**scope différent : par équipe, pas par tournoi**, donc persistant et
consultable même hors compétition, entre les tournois auxquels l'équipe
participe ensemble.

## Ce qu'il faut concevoir

Un écran dédié **"Gestion de l'équipe"**, ouvert depuis une carte d'équipe
dans "Mes équipes" (remplace/complète le inline actuel), avec :

### 1. En-tête équipe
- Écusson/initiales de l'équipe, nom, badge "Chef : {pseudo}"
- Compteur membres (ex. "3/4")
- Si je suis le chef : accès direct à "Renommer" (avec le rappel de la
  limite mensuelle, et la date du prochain renommage possible si verrouillé)

### 2. Liste des membres
- Pseudo, écusson, badge "Chef" sur le premier
- Si je suis chef : bouton retirer par membre (avec confirmation), sauf sur
  moi-même
- Bouton "Inviter par TAG" (ouvre une recherche → aperçu du profil trouvé →
  confirmation d'envoi), désactivé si l'équipe est déjà à 4 membres

### 3. Chat d'équipe (nouveauté)
- Zone de discussion scoped à l'équipe, visible par tous les membres
  (chef et non-chefs), fil de messages avec pseudo + heure, champ de saisie
  en bas
- Distinct visuellement des chats de tournoi existants (pas de badge
  "Organisateur" ici — tout le monde est sur un pied d'égalité, seul le chef
  a un petit repère visuel discret, ex. une couronne à côté de son pseudo)
- Optionnel mais utile : un message système auto-généré aux moments clés
  (ex. "Fatou a rejoint l'équipe", "Le nom a été changé en « Les Lions »")
  pour donner du contexte au fil sans effort de saisie

### 4. Historique tournois (optionnel si la place le permet)
- Petite liste des tournois auxquels cette équipe s'est inscrite ensemble,
  pour donner une identité à l'équipe au-delà du chat

## Contraintes de cohérence avec l'existant

- Réutiliser le langage visuel déjà établi (écussons d'équipe type
  `EcussonEquipe`, badges pill avec `--ds-accent-800`/`--ds-accent-300`,
  boutons icône `w-10 h-10` dans une barre d'action)
- Le tout doit fonctionner dans les 4 thèmes du produit (Nocturne, Organic,
  Voltage, Wax) — pas de couleur en dur
- Textes 100% français, ton direct, pas de jargon technique
- Mobile-first (écran de référence 366px de large)

## Ce qui n'est PAS demandé ici

- Pas de vrai temps réel (le mock reste polling/localStorage comme le reste
  de l'app pour l'instant, le design doit juste prévoir l'espace pour un fil
  qui se met à jour)
- Pas de gestion des équipes éphémères créées à la volée pendant une
  inscription (`mockEquipesBR.ts`) — uniquement les équipes pré-créées du
  profil
