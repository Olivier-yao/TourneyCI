-- Active la réplication Realtime (Postgres Changes) sur les deux tables de
-- chat — jusqu'ici aucune table de ce projet n'était dans la publication
-- supabase_realtime, tout reposait sur du polling à intervalle fixe côté
-- client (8-15s). Realtime respecte le RLS déjà en place (via le JWT de
-- l'abonné), d'où la correction des policies de messages_chat dans la
-- migration précédente (20260823050000) avant celle-ci.

alter publication supabase_realtime add table messages_chat;
alter publication supabase_realtime add table messages_chat_equipe;
