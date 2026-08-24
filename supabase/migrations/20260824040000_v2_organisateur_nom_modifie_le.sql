-- Date du dernier renommage du nom d'organisateur, jusqu'ici suivie
-- uniquement en localStorage (contournable en vidant le stockage du
-- navigateur) — nécessaire pour faire respecter la limite "1 renommage par
-- mois" côté serveur, même précédent que photo_modifiee_le.
alter table organisateur_profils add column if not exists nom_organisateur_modifie_le timestamptz;
