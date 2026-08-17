-- Catalogue : lecture publique, écriture service_role uniquement
alter table jeux enable row level security;
alter table pays enable row level security;
alter table villes enable row level security;
create policy "lecture publique" on jeux for select using (true);
create policy "lecture publique" on pays for select using (true);
create policy "lecture publique" on villes for select using (true);

-- Identité
alter table profiles enable row level security;
create policy "lecture publique" on profiles for select using (true);
create policy "creation par soi-meme" on profiles for insert with check (id = auth.uid());
create policy "modification par soi-meme" on profiles for update using (id = auth.uid());

alter table kyc_verifications enable row level security;
alter table liste_noire_documents enable row level security;
-- aucune policy client : accessible uniquement via service_role (edge functions/admin)

-- Organisateurs
alter table organisateur_profils enable row level security;
create policy "lecture publique" on organisateur_profils for select using (true);
create policy "creation par soi-meme" on organisateur_profils for insert with check (profile_id = auth.uid());
create policy "modification par soi-meme" on organisateur_profils for update using (profile_id = auth.uid());

alter table demandes_organisateur enable row level security;
create policy "lecture propriétaire ou admin" on demandes_organisateur for select
  using (profile_id = auth.uid() or (auth.jwt() ->> 'is_admin')::boolean);
create policy "creation par soi-meme" on demandes_organisateur for insert with check (profile_id = auth.uid());
create policy "traitement admin seulement" on demandes_organisateur for update
  using ((auth.jwt() ->> 'is_admin')::boolean);

-- Tournois
alter table tournois enable row level security;
alter table repartition_cash_prize enable row level security;
alter table tournoi_equipes_predefinies enable row level security;
create policy "lecture publique" on tournois for select using (true);
create policy "creation par l'organisateur" on tournois for insert with check (organisateur_id = auth.uid());
create policy "modification par l'organisateur" on tournois for update using (organisateur_id = auth.uid());
create policy "lecture publique" on repartition_cash_prize for select using (true);
create policy "gestion par l'organisateur du tournoi" on repartition_cash_prize for all
  using (tournoi_id in (select id from tournois where organisateur_id = auth.uid()));
create policy "lecture publique" on tournoi_equipes_predefinies for select using (true);
create policy "gestion par l'organisateur du tournoi" on tournoi_equipes_predefinies for all
  using (tournoi_id in (select id from tournois where organisateur_id = auth.uid()));

-- Inscriptions & équipes
alter table equipes_br enable row level security;
alter table inscriptions enable row level security;
alter table equipes_br_membres enable row level security;
alter table demandes_equipe_br enable row level security;
alter table retraits_equipe_br enable row level security;
create policy "lecture publique" on equipes_br for select using (true);
create policy "creation par le chef" on equipes_br for insert with check (chef_id = auth.uid());
create policy "modification par le chef" on equipes_br for update using (chef_id = auth.uid());
create policy "lecture par le concerné ou l'organisateur" on inscriptions for select
  using (profile_id = auth.uid() or tournoi_id in (select id from tournois where organisateur_id = auth.uid()));
create policy "inscription par soi-meme" on inscriptions for insert with check (profile_id = auth.uid());
create policy "modification par soi-meme ou l'organisateur" on inscriptions for update
  using (profile_id = auth.uid() or tournoi_id in (select id from tournois where organisateur_id = auth.uid()));
create policy "lecture publique" on equipes_br_membres for select using (true);
create policy "gestion par le chef" on equipes_br_membres for all
  using (equipe_id in (select id from equipes_br where chef_id = auth.uid()));
create policy "lecture par le chef ou le demandeur" on demandes_equipe_br for select
  using (demandeur_id = auth.uid() or equipe_id in (select id from equipes_br where chef_id = auth.uid()));
create policy "demande par soi-meme" on demandes_equipe_br for insert with check (demandeur_id = auth.uid());
create policy "lecture par le chef ou le membre" on retraits_equipe_br for select
  using (membre_id = auth.uid() or equipe_id in (select id from equipes_br where chef_id = auth.uid()));
create policy "retrait par soi-meme" on retraits_equipe_br for insert with check (membre_id = auth.uid());

alter table equipes_profil enable row level security;
alter table equipes_profil_membres enable row level security;
alter table invitations_equipe_profil enable row level security;
alter table propositions_equipe enable row level security;
create policy "lecture publique" on equipes_profil for select using (true);
create policy "gestion par le chef" on equipes_profil for all using (chef_id = auth.uid());
create policy "lecture publique" on equipes_profil_membres for select using (true);
create policy "gestion par le chef de l'equipe" on equipes_profil_membres for all
  using (equipe_id in (select id from equipes_profil where chef_id = auth.uid()));
create policy "lecture par le chef ou le destinataire" on invitations_equipe_profil for select
  using (destinataire_id = auth.uid() or equipe_id in (select id from equipes_profil where chef_id = auth.uid()));
create policy "invitation par le chef" on invitations_equipe_profil for insert
  with check (equipe_id in (select id from equipes_profil where chef_id = auth.uid()));
create policy "reponse par le destinataire" on invitations_equipe_profil for update
  using (destinataire_id = auth.uid());
create policy "lecture par le chef ou le proposeur" on propositions_equipe for select
  using (proposeur_id = auth.uid() or equipe_id in (select id from equipes_profil where chef_id = auth.uid()));
create policy "proposition par soi-meme" on propositions_equipe for insert with check (proposeur_id = auth.uid());

-- Compétition en direct
alter table matches enable row level security;
alter table match_evenements enable row level security;
alter table manches_br enable row level security;
alter table manches_br_resultats enable row level security;
alter table manche_br_en_cours enable row level security;
create policy "lecture publique" on matches for select using (true);
create policy "gestion par l'organisateur du tournoi" on matches for all
  using (tournoi_id in (select id from tournois where organisateur_id = auth.uid()));
create policy "lecture publique" on match_evenements for select using (true);
create policy "gestion par l'organisateur du tournoi" on match_evenements for all
  using (match_id in (select id from matches where tournoi_id in (select id from tournois where organisateur_id = auth.uid())));
create policy "lecture publique" on manches_br for select using (true);
create policy "gestion par l'organisateur du tournoi" on manches_br for all
  using (tournoi_id in (select id from tournois where organisateur_id = auth.uid()));
create policy "lecture publique" on manches_br_resultats for select using (true);
create policy "gestion par l'organisateur du tournoi" on manches_br_resultats for all
  using (manche_id in (select id from manches_br where tournoi_id in (select id from tournois where organisateur_id = auth.uid())));
create policy "lecture publique" on manche_br_en_cours for select using (true);
create policy "gestion par l'organisateur du tournoi" on manche_br_en_cours for all
  using (tournoi_id in (select id from tournois where organisateur_id = auth.uid()));

-- Room infos (sensible : lien + mot de passe) et chat : réservés aux inscrits + organisateur
alter table room_infos enable row level security;
alter table messages_chat enable row level security;
create policy "lecture par inscrit ou organisateur" on room_infos for select
  using (
    tournoi_id in (select id from tournois where organisateur_id = auth.uid())
    or tournoi_id in (select tournoi_id from inscriptions where profile_id = auth.uid())
  );
create policy "gestion par l'organisateur du tournoi" on room_infos for insert with check (
  tournoi_id in (select id from tournois where organisateur_id = auth.uid())
);
create policy "modification par l'organisateur du tournoi" on room_infos for update using (
  tournoi_id in (select id from tournois where organisateur_id = auth.uid())
);
create policy "lecture par inscrit ou organisateur" on messages_chat for select
  using (
    tournoi_id in (select id from tournois where organisateur_id = auth.uid())
    or tournoi_id in (select tournoi_id from inscriptions where profile_id = auth.uid())
  );
create policy "envoi par un inscrit ou l'organisateur" on messages_chat for insert with check (
  auteur_id = auth.uid()
  and (
    tournoi_id in (select id from tournois where organisateur_id = auth.uid())
    or tournoi_id in (select tournoi_id from inscriptions where profile_id = auth.uid())
  )
);

-- Portefeuille : lecture propriétaire uniquement, aucune écriture cliente (edge function/service_role)
alter table mouvements enable row level security;
create policy "lecture par le propriétaire" on mouvements for select using (profile_id = auth.uid());

-- Engagement
alter table notifications enable row level security;
alter table favoris enable row level security;
alter table notifs_tournoi_suivis enable row level security;
alter table suivis_organisateur enable row level security;
alter table soutiens_organisateur enable row level security;
create policy "lecture par le destinataire" on notifications for select using (destinataire_id = auth.uid());
create policy "modification par le destinataire" on notifications for update using (destinataire_id = auth.uid());
create policy "lecture publique" on favoris for select using (true);
create policy "gestion par soi-meme" on favoris for all using (profile_id = auth.uid());
create policy "lecture publique" on notifs_tournoi_suivis for select using (true);
create policy "gestion par soi-meme" on notifs_tournoi_suivis for all using (profile_id = auth.uid());
create policy "lecture publique" on suivis_organisateur for select using (true);
create policy "gestion par soi-meme" on suivis_organisateur for all using (follower_id = auth.uid());
create policy "lecture publique" on soutiens_organisateur for select using (true);
create policy "creation par soi-meme" on soutiens_organisateur for insert with check (auteur_id = auth.uid());

-- Réputation
alter table avis_tournoi enable row level security;
alter table avis_organisateur enable row level security;
create policy "lecture publique" on avis_tournoi for select using (true);
create policy "creation par soi-meme" on avis_tournoi for insert with check (auteur_id = auth.uid());
create policy "lecture publique" on avis_organisateur for select using (true);
create policy "creation par soi-meme" on avis_organisateur for insert with check (auteur_id = auth.uid());

-- Modération & litiges : propriétaire ou admin, traitement admin seulement
alter table litiges enable row level security;
alter table appels enable row level security;
alter table plaintes enable row level security;
alter table demandes_annulation enable row level security;

create policy "lecture propriétaire ou admin" on litiges for select
  using (auteur_id = auth.uid() or (auth.jwt() ->> 'is_admin')::boolean);
create policy "creation par soi-meme" on litiges for insert with check (auteur_id = auth.uid());
create policy "traitement admin seulement" on litiges for update using ((auth.jwt() ->> 'is_admin')::boolean);

create policy "lecture propriétaire ou admin" on appels for select
  using (auteur_id = auth.uid() or (auth.jwt() ->> 'is_admin')::boolean);
create policy "creation par soi-meme" on appels for insert with check (auteur_id = auth.uid());
create policy "traitement admin seulement" on appels for update using ((auth.jwt() ->> 'is_admin')::boolean);

create policy "lecture propriétaire ou admin" on plaintes for select
  using (auteur_id = auth.uid() or (auth.jwt() ->> 'is_admin')::boolean);
create policy "creation par soi-meme" on plaintes for insert with check (auteur_id = auth.uid());
create policy "traitement admin seulement" on plaintes for update using ((auth.jwt() ->> 'is_admin')::boolean);

create policy "lecture propriétaire ou admin" on demandes_annulation for select
  using (organisateur_id = auth.uid() or (auth.jwt() ->> 'is_admin')::boolean);
create policy "creation par soi-meme" on demandes_annulation for insert with check (organisateur_id = auth.uid());
create policy "traitement admin seulement" on demandes_annulation for update using ((auth.jwt() ->> 'is_admin')::boolean);
