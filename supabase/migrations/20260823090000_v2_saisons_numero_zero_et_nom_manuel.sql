-- Deux ajustements demandés par l'utilisateur au système de saisons
-- (migration précédente 20260823080000) :
--
-- 1. La numérotation doit commencer à "Saison 0", pas "Saison 3" (choisi à
--    l'origine par continuité avec l'ancien texte fixe — l'utilisateur
--    préfère repartir de zéro). Une seule ligne existe à ce jour, simple
--    renumérotation.
--
-- 2. Le nom de la prochaine saison ne doit plus être pioché automatiquement
--    dans une rotation fixe : l'admin doit pouvoir le saisir lui-même à
--    l'avance dans /tourney-control. Stocké sur la saison EN COURS
--    (nom_suivant) plutôt que dans une table séparée : la bascule
--    (src/lib/server/saisons.ts) lit nom_suivant de la dernière saison au
--    moment de créer la suivante, et retombe sur la rotation automatique
--    seulement si l'admin ne l'a pas renseigné à temps (garde-fou, pas le
--    chemin normal).

update saisons set numero = 0 where numero = 3;

alter table saisons add column nom_suivant text;
