-- Étend Supabase Realtime aux tables du bracket/tournoi (déjà en lecture
-- publique via RLS, cf. 20260817093306_v2_rls.sql) — jusqu'ici seul le chat
-- déclenchait un rafraîchissement en direct (20260823060000), les écrans
-- bracket/match/fiche tournoi ne se mettaient à jour qu'au rechargement.
alter publication supabase_realtime add table matches;
alter publication supabase_realtime add table match_evenements;
alter publication supabase_realtime add table tournois;
