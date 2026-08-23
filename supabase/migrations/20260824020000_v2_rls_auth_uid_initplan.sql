-- Corrige auth_rls_initplan (avis performance Supabase, 60 occurrences) :
-- auth.uid()/auth.jwt() appelés directement dans une policy RLS sont
-- réévalués par Postgres à CHAQUE LIGNE plutôt qu'une fois par requête.
-- Les envelopper dans (select ...) transforme l'appel en "initplan",
-- évalué une seule fois — Postgres met le résultat en cache scalaire au
-- lieu de rappeler la fonction pour chaque ligne examinée.
--
-- Concerne surtout les abonnements Realtime (chat, bracket, tournois,
-- ajoutés cette session) : Prisma contourne le RLS pour l'essentiel du
-- trafic applicatif, mais Realtime applique le RLS via le JWT de l'abonné.
--
-- ALTER POLICY change uniquement l'expression, jamais la sémantique :
-- chaque ligne ci-dessous est la même condition, juste réécrite pour que
-- auth.uid()/auth.jwt() ne soit appelé qu'une fois.

alter policy "creation par soi-meme" on appels
  with check (auteur_id = (select auth.uid()));
alter policy "lecture propriétaire ou admin" on appels
  using ((auteur_id = (select auth.uid())) or (((select auth.jwt()) ->> 'is_admin'::text))::boolean);
alter policy "traitement admin seulement" on appels
  using (((select auth.jwt()) ->> 'is_admin'::text)::boolean);

alter policy "creation par soi-meme" on avis_organisateur
  with check (auteur_id = (select auth.uid()));

alter policy "creation par soi-meme" on avis_tournoi
  with check (auteur_id = (select auth.uid()));

alter policy "creation par soi-meme" on demandes_annulation
  with check (organisateur_id = (select auth.uid()));
alter policy "lecture propriétaire ou admin" on demandes_annulation
  using ((organisateur_id = (select auth.uid())) or (((select auth.jwt()) ->> 'is_admin'::text))::boolean);
alter policy "traitement admin seulement" on demandes_annulation
  using (((select auth.jwt()) ->> 'is_admin'::text)::boolean);

alter policy "demande par soi-meme" on demandes_equipe_br
  with check (demandeur_id = (select auth.uid()));
alter policy "lecture par le chef ou le demandeur" on demandes_equipe_br
  using ((demandeur_id = (select auth.uid())) or (equipe_id in (select equipes_br.id from equipes_br where equipes_br.chef_id = (select auth.uid()))));

alter policy "creation par soi-meme" on demandes_organisateur
  with check (profile_id = (select auth.uid()));
alter policy "lecture propriétaire ou admin" on demandes_organisateur
  using ((profile_id = (select auth.uid())) or (((select auth.jwt()) ->> 'is_admin'::text))::boolean);
alter policy "traitement admin seulement" on demandes_organisateur
  using (((select auth.jwt()) ->> 'is_admin'::text)::boolean);

alter policy "creation par le chef" on equipes_br
  with check (chef_id = (select auth.uid()));
alter policy "modification par le chef" on equipes_br
  using (chef_id = (select auth.uid()));

alter policy "gestion par le chef" on equipes_br_membres
  using (equipe_id in (select equipes_br.id from equipes_br where equipes_br.chef_id = (select auth.uid())));

alter policy "gestion par le chef" on equipes_profil
  using (chef_id = (select auth.uid()));

alter policy "gestion par le chef de l'equipe" on equipes_profil_membres
  using (equipe_id in (select equipes_profil.id from equipes_profil where equipes_profil.chef_id = (select auth.uid())));

alter policy "gestion par soi-meme" on favoris
  using (profile_id = (select auth.uid()));

alter policy "inscription par soi-meme" on inscriptions
  with check (profile_id = (select auth.uid()));
alter policy "lecture par le concerné ou l'organisateur" on inscriptions
  using ((profile_id = (select auth.uid())) or (tournoi_id in (select tournois.id from tournois where tournois.organisateur_id = (select auth.uid()))));
alter policy "modification par soi-meme ou l'organisateur" on inscriptions
  using ((profile_id = (select auth.uid())) or (tournoi_id in (select tournois.id from tournois where tournois.organisateur_id = (select auth.uid()))));

alter policy "invitation par le chef" on invitations_equipe_profil
  with check (equipe_id in (select equipes_profil.id from equipes_profil where equipes_profil.chef_id = (select auth.uid())));
alter policy "lecture par le chef ou le destinataire" on invitations_equipe_profil
  using ((destinataire_id = (select auth.uid())) or (equipe_id in (select equipes_profil.id from equipes_profil where equipes_profil.chef_id = (select auth.uid()))));
alter policy "reponse par le destinataire" on invitations_equipe_profil
  using (destinataire_id = (select auth.uid()));

alter policy "creation par soi-meme" on litiges
  with check (auteur_id = (select auth.uid()));
alter policy "lecture par l'auteur ou l'organisateur du tournoi" on litiges
  using (
    (auteur_id = (select auth.uid()))
    or (match_id in (
      select m.id from matches m join tournois t on t.id = m.tournoi_id
      where t.organisateur_id = (select auth.uid())
         or exists (select 1 from adjoints_organisateur a where a.proprietaire_id = t.organisateur_id and a.adjoint_id = (select auth.uid()) and a.statut = 'accepte'::statut_adjoint)
    ))
  );
alter policy "traitement par l'organisateur du tournoi" on litiges
  using (match_id in (
    select m.id from matches m join tournois t on t.id = m.tournoi_id
    where t.organisateur_id = (select auth.uid())
       or exists (select 1 from adjoints_organisateur a where a.proprietaire_id = t.organisateur_id and a.adjoint_id = (select auth.uid()) and a.statut = 'accepte'::statut_adjoint)
  ));

alter policy "gestion par l'organisateur du tournoi" on manche_br_en_cours
  using (tournoi_id in (select tournois.id from tournois where tournois.organisateur_id = (select auth.uid())));

alter policy "gestion par l'organisateur du tournoi" on manches_br
  using (tournoi_id in (select tournois.id from tournois where tournois.organisateur_id = (select auth.uid())));

alter policy "gestion par l'organisateur du tournoi" on manches_br_resultats
  using (manche_id in (select manches_br.id from manches_br where manches_br.tournoi_id in (select tournois.id from tournois where tournois.organisateur_id = (select auth.uid()))));

alter policy "gestion par l'organisateur du tournoi" on match_evenements
  using (match_id in (select matches.id from matches where matches.tournoi_id in (select tournois.id from tournois where tournois.organisateur_id = (select auth.uid()))));

alter policy "gestion par l'organisateur du tournoi" on matches
  using (tournoi_id in (select tournois.id from tournois where tournois.organisateur_id = (select auth.uid())));

alter policy "ecriture general et inscrits par inscrit ou organisateur" on messages_chat
  with check (
    salon = any (array['general'::salon_chat, 'inscrits'::salon_chat])
    and auteur_id = (select auth.uid())
    and (
      tournoi_id in (select tournois.id from tournois where tournois.organisateur_id = (select auth.uid()))
      or tournoi_id in (select inscriptions.tournoi_id from inscriptions where inscriptions.profile_id = (select auth.uid()))
      or exists (select 1 from adjoints_organisateur a join tournois t on t.organisateur_id = a.proprietaire_id where t.id = messages_chat.tournoi_id and a.adjoint_id = (select auth.uid()) and a.statut = 'accepte'::statut_adjoint)
    )
  );
alter policy "ecriture tribune par tout utilisateur connecte" on messages_chat
  with check (salon = 'tribune'::salon_chat and auteur_id = (select auth.uid()));
alter policy "lecture general et inscrits par inscrit ou organisateur" on messages_chat
  using (
    salon = any (array['general'::salon_chat, 'inscrits'::salon_chat])
    and (
      tournoi_id in (select tournois.id from tournois where tournois.organisateur_id = (select auth.uid()))
      or tournoi_id in (select inscriptions.tournoi_id from inscriptions where inscriptions.profile_id = (select auth.uid()))
      or exists (select 1 from adjoints_organisateur a join tournois t on t.organisateur_id = a.proprietaire_id where t.id = messages_chat.tournoi_id and a.adjoint_id = (select auth.uid()) and a.statut = 'accepte'::statut_adjoint)
    )
  );

alter policy "ecriture par les membres de l'equipe" on messages_chat_equipe
  with check (auteur_id = (select auth.uid()) and equipe_id in (select equipes_profil_membres.equipe_id from equipes_profil_membres where equipes_profil_membres.profile_id = (select auth.uid())));
alter policy "lecture par les membres de l'equipe" on messages_chat_equipe
  using (equipe_id in (select equipes_profil_membres.equipe_id from equipes_profil_membres where equipes_profil_membres.profile_id = (select auth.uid())));

alter policy "lecture par le propriétaire" on mouvements
  using (profile_id = (select auth.uid()));

alter policy "lecture par le destinataire" on notifications
  using (destinataire_id = (select auth.uid()));
alter policy "modification par le destinataire" on notifications
  using (destinataire_id = (select auth.uid()));

alter policy "gestion par soi-meme" on notifs_tournoi_suivis
  using (profile_id = (select auth.uid()));

alter policy "creation par soi-meme" on organisateur_profils
  with check (profile_id = (select auth.uid()));
alter policy "modification par soi-meme" on organisateur_profils
  using (profile_id = (select auth.uid()));

alter policy "gestion par le proprietaire" on organisateur_reseaux_sociaux
  using (profile_id = (select auth.uid()));

alter policy "creation par soi-meme" on profiles
  with check (id = (select auth.uid()));
alter policy "modification par soi-meme" on profiles
  using (id = (select auth.uid()));

alter policy "proposition par soi-meme" on propositions_equipe
  with check (proposeur_id = (select auth.uid()));
alter policy "lecture par le chef ou le proposeur" on propositions_equipe
  using ((proposeur_id = (select auth.uid())) or (equipe_id in (select equipes_profil.id from equipes_profil where equipes_profil.chef_id = (select auth.uid()))));

alter policy "gestion par l'organisateur du tournoi" on repartition_cash_prize
  using (tournoi_id in (select tournois.id from tournois where tournois.organisateur_id = (select auth.uid())));

alter policy "retrait par soi-meme" on retraits_equipe_br
  with check (membre_id = (select auth.uid()));
alter policy "lecture par le chef ou le membre" on retraits_equipe_br
  using ((membre_id = (select auth.uid())) or (equipe_id in (select equipes_br.id from equipes_br where equipes_br.chef_id = (select auth.uid()))));

alter policy "gestion par l'organisateur du tournoi" on room_infos
  with check (tournoi_id in (select tournois.id from tournois where tournois.organisateur_id = (select auth.uid())));
alter policy "lecture par inscrit ou organisateur" on room_infos
  using ((tournoi_id in (select tournois.id from tournois where tournois.organisateur_id = (select auth.uid()))) or (tournoi_id in (select inscriptions.tournoi_id from inscriptions where inscriptions.profile_id = (select auth.uid()))));
alter policy "modification par l'organisateur du tournoi" on room_infos
  using (tournoi_id in (select tournois.id from tournois where tournois.organisateur_id = (select auth.uid())));

alter policy "creation par soi-meme" on soutiens_organisateur
  with check (auteur_id = (select auth.uid()));

alter policy "gestion par soi-meme" on suivis_organisateur
  using (follower_id = (select auth.uid()));

alter policy "gestion par l'organisateur du tournoi" on tournoi_equipes_predefinies
  using (tournoi_id in (select tournois.id from tournois where tournois.organisateur_id = (select auth.uid())));

alter policy "creation par l'organisateur" on tournois
  with check (organisateur_id = (select auth.uid()));
alter policy "modification par l'organisateur" on tournois
  using (organisateur_id = (select auth.uid()));
