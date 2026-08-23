-- Horodatage de fin de match, jusqu'ici absent (aucune colonne timestamp sur
-- `matches`) — nécessaire pour la clôture automatique du tournoi (2 minutes
-- après que le dernier match du bracket soit décidé), qui doit savoir DEPUIS
-- QUAND la finale est terminée, pas seulement QU'elle l'est.
alter table matches add column if not exists termine_le timestamptz;
