-- Les policies RLS existantes sur messages_chat ne distinguaient pas les
-- salons : "tribune" (accessible publiquement, meme sans compte - cf.
-- GET /api/tournois/[id]/chat-spectateurs, aucune auth requise) etait
-- traitee comme "general"/"inscrits" (prive, inscrit+organisateur
-- seulement). Sans consequence tant que tout passait par Prisma (qui
-- contourne le RLS), mais bloquant pour Supabase Realtime, qui applique le
-- RLS via le JWT de l'abonne : un spectateur non-inscrit ne recevrait
-- jamais les nouveaux messages de tribune en direct. Les policies
-- manquaient aussi le cas adjoint (adjoints_organisateur), deja pris en
-- compte cote route (estAdjointAccepteDe) mais jamais reflete ici.

drop policy "envoi par un inscrit ou l'organisateur" on messages_chat;
drop policy "lecture par inscrit ou organisateur" on messages_chat;

create policy "lecture tribune publique" on messages_chat for select
  using (salon = 'tribune');

create policy "lecture general et inscrits par inscrit ou organisateur" on messages_chat for select
  using (
    salon in ('general', 'inscrits')
    and (
      tournoi_id in (select id from tournois where organisateur_id = auth.uid())
      or tournoi_id in (select tournoi_id from inscriptions where profile_id = auth.uid())
      or exists (
        select 1 from adjoints_organisateur a
        join tournois t on t.organisateur_id = a.proprietaire_id
        where t.id = messages_chat.tournoi_id and a.adjoint_id = auth.uid() and a.statut = 'accepte'
      )
    )
  );

create policy "ecriture tribune par tout utilisateur connecte" on messages_chat for insert
  with check (salon = 'tribune' and auteur_id = auth.uid());

create policy "ecriture general et inscrits par inscrit ou organisateur" on messages_chat for insert
  with check (
    salon in ('general', 'inscrits')
    and auteur_id = auth.uid()
    and (
      tournoi_id in (select id from tournois where organisateur_id = auth.uid())
      or tournoi_id in (select tournoi_id from inscriptions where profile_id = auth.uid())
      or exists (
        select 1 from adjoints_organisateur a
        join tournois t on t.organisateur_id = a.proprietaire_id
        where t.id = messages_chat.tournoi_id and a.adjoint_id = auth.uid() and a.statut = 'accepte'
      )
    )
  );
