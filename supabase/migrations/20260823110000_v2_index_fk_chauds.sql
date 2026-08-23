-- Index manquants sur les clés étrangères des chemins les plus chauds
-- (confirmé par l'advisor de performance Supabase : 46 FK sans index sur ce
-- schéma au total — celles-ci sont les plus consultées d'après l'usage réel
-- du code : solde/historique portefeuille, classement, "mes inscriptions",
-- "mes tournois", litiges, avis, favoris, notifications liées à un tournoi).
-- Postgres n'indexe jamais automatiquement une colonne de clé étrangère
-- (seule la colonne référencée, côté PK, l'est) — sans ces index, chacune de
-- ces requêtes fait un scan complet de la table à mesure qu'elle grossit.
-- Tables actuellement trop petites pour que l'effet soit mesurable en
-- millisecondes (quelques dizaines de lignes) : ajoutés en prévention, avant
-- que ça ne devienne le vrai goulot d'étranglement.
create index if not exists mouvements_profile_id_idx on mouvements (profile_id);
create index if not exists mouvements_tournoi_id_idx on mouvements (tournoi_id);
create index if not exists points_classement_saison_id_idx on points_classement (saison_id);
create index if not exists inscriptions_profile_id_idx on inscriptions (profile_id);
create index if not exists tournois_organisateur_id_idx on tournois (organisateur_id);
create index if not exists litiges_match_id_idx on litiges (match_id);
create index if not exists avis_tournoi_auteur_id_idx on avis_tournoi (auteur_id);
create index if not exists avis_organisateur_organisateur_id_idx on avis_organisateur (organisateur_id);
create index if not exists favoris_tournoi_id_idx on favoris (tournoi_id);
create index if not exists notifications_tournoi_id_idx on notifications (tournoi_id);
create index if not exists appels_auteur_id_idx on appels (auteur_id);
create index if not exists notifs_tournoi_suivis_tournoi_id_idx on notifs_tournoi_suivis (tournoi_id);
