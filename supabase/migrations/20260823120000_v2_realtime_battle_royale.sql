-- Complète le rafraîchissement temps réel côté Battle Royale (déjà en place
-- pour matches/match_evenements/tournois, cf. 20260823100000) — la Régie
-- (organisateur/[id]/gestion) affiche les résultats de manche en direct
-- mais rien ne déclenchait de rafraîchissement jusqu'ici pour ce format.
-- Lecture publique déjà en place (cf. 20260817093306_v2_rls.sql).
alter publication supabase_realtime add table manches_br;
alter publication supabase_realtime add table manche_br_en_cours;
