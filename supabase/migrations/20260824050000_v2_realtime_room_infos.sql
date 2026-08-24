-- Les infos de room (lien/mot de passe envoyés par l'organisateur) ne
-- s'actualisaient jamais en direct chez les inscrits, faute d'être dans la
-- publication temps réel — rien de sensible dans cette table (contrairement
-- à inscriptions, qui porte le montant payé, volontairement laissée hors
-- publication).
alter publication supabase_realtime add table room_infos;
