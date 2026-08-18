# Prompt Claude Design — Tournois à superviser + Équipes rejointes

## Contexte

Deux ajouts récents fonctionnent mais réutilisent tels quels des patterns de
liste déjà existants ailleurs dans l'app — ils n'ont pas eu de traitement
visuel dédié. Les deux sont dans des écrans existants, pas de nouvelle
navigation à prévoir.

## 1. "Tournois à superviser" (sur `/organisateur/adjoints`)

Un adjoint accepté par un organisateur voit maintenant, sur l'écran
Adjoints, une section listant les tournois en cours de la personne qu'il
supervise (nom du tournoi, nom de l'organisateur, jeu, statut en direct),
cliquable vers l'écran de gestion. Implémentation actuelle : liste de
cartes identiques aux autres listes de l'app (icône, titre, sous-titre).

**À concevoir** : un traitement qui distingue clairement "les tournois que
je supervise pour quelqu'un d'autre" du reste de l'écran (qui parle de MES
adjoints à moi) — aujourd'hui les deux sections se ressemblent trop et
peuvent prêter à confusion sur qui supervise qui. Si un adjoint supervise
plusieurs organisateurs différents, prévoir un regroupement par
organisateur plutôt qu'une liste plate. Mettre en avant le statut "en
direct" (le cas qui compte le plus, un adjoint intervient surtout pendant
un tournoi live).

## 2. "Équipes rejointes" (sur `/mes-equipes`, onglet "Mes équipes")

Une fois qu'un joueur accepte une invitation à rejoindre l'équipe pré-créée
de quelqu'un d'autre, l'équipe apparaît maintenant dans une section
"Équipes rejointes", séparée de "mes équipes" (celles dont il est chef).
Implémentation actuelle : cartes non cliquables (pas d'actions, contraire
au chef qui a un bouton "Gérer"), avec le nom du chef en petit texte.

**À concevoir** : une distinction visuelle nette chef vs membre simple dès
le premier coup d'œil (pas juste l'absence du bouton "Gérer" — quelque
chose de plus explicite, ex. un badge de rôle). Réfléchir à ce qu'un membre
simple peut vouloir faire depuis cette carte (voir la liste des membres ?
quitter l'équipe ? — cette dernière action n'existe pas encore côté code,
à vérifier avant de la dessiner).

## Rappel : deux interfaces toujours en attente d'un vrai design

Ces deux prompts existent déjà dans le repo mais rien n'a encore été
dessiné/implémenté dessus :
- `PROMPT-cloture-tournoi.md` — écran de clôture du tournoi (mise en garde,
  état de progression, demande d'annulation).
- `PROMPT-gestion-equipe-chat.md` — écran de gestion d'équipe pré-créée
  avec chat d'équipe intégré (nouveauté, aucune interface existante).

## Contraintes communes

Réutiliser les tokens du design system (`--ds-*`), fonctionner dans les 4
thèmes (Nocturne, Organic, Voltage, Wax), mobile-first (366-375px),
français direct.
