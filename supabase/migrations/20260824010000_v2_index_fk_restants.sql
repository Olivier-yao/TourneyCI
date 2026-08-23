-- Complète la couverture des clés étrangères sans index (advisor de
-- performance Supabase, 46 au total sur ce schéma) — les 12 les plus
-- consultées ont déjà été indexées (20260823110000_v2_index_fk_chauds.sql).
-- Celles-ci sont sur des tables admin/à plus faible trafic, ajoutées ici
-- pour couvrir l'intégralité de la liste plutôt que de laisser une dette
-- partielle.
create index if not exists adjoints_organisateur_adjoint_id_idx on adjoints_organisateur (adjoint_id);
create index if not exists demandes_annulation_organisateur_id_idx on demandes_annulation (organisateur_id);
create index if not exists demandes_annulation_tournoi_id_idx on demandes_annulation (tournoi_id);
create index if not exists demandes_equipe_br_demandeur_id_idx on demandes_equipe_br (demandeur_id);
create index if not exists demandes_organisateur_profile_id_idx on demandes_organisateur (profile_id);
create index if not exists demandes_organisateur_traite_par_idx on demandes_organisateur (traite_par);
create index if not exists equipes_br_chef_id_idx on equipes_br (chef_id);
create index if not exists equipes_br_tournoi_id_idx on equipes_br (tournoi_id);
create index if not exists equipes_br_membres_profile_id_idx on equipes_br_membres (profile_id);
create index if not exists equipes_profil_membres_profile_id_idx on equipes_profil_membres (profile_id);
create index if not exists inscriptions_equipe_br_id_idx on inscriptions (equipe_br_id);
create index if not exists invitations_equipe_profil_destinataire_id_idx on invitations_equipe_profil (destinataire_id);
create index if not exists invitations_equipe_profil_equipe_id_idx on invitations_equipe_profil (equipe_id);
create index if not exists kyc_verifications_profile_id_idx on kyc_verifications (profile_id);
create index if not exists litiges_auteur_id_idx on litiges (auteur_id);
create index if not exists match_evenements_match_id_idx on match_evenements (match_id);
create index if not exists messages_chat_auteur_id_idx on messages_chat (auteur_id);
create index if not exists messages_chat_equipe_auteur_id_idx on messages_chat_equipe (auteur_id);
create index if not exists plaintes_auteur_id_idx on plaintes (auteur_id);
create index if not exists points_classement_jeu_id_idx on points_classement (jeu_id);
create index if not exists profiles_ville_id_idx on profiles (ville_id);
create index if not exists propositions_equipe_equipe_id_idx on propositions_equipe (equipe_id);
create index if not exists propositions_equipe_proposeur_id_idx on propositions_equipe (proposeur_id);
create index if not exists propositions_equipe_tournoi_id_idx on propositions_equipe (tournoi_id);
create index if not exists retraits_equipe_br_equipe_id_idx on retraits_equipe_br (equipe_id);
create index if not exists retraits_equipe_br_membre_id_idx on retraits_equipe_br (membre_id);
create index if not exists soutiens_organisateur_organisateur_id_idx on soutiens_organisateur (organisateur_id);
create index if not exists soutiens_organisateur_tournoi_id_idx on soutiens_organisateur (tournoi_id);
create index if not exists suivis_organisateur_organisateur_id_idx on suivis_organisateur (organisateur_id);
create index if not exists tournoi_equipes_predefinies_tournoi_id_idx on tournoi_equipes_predefinies (tournoi_id);
create index if not exists tournois_jeu_id_idx on tournois (jeu_id);
create index if not exists tournois_ville_id_idx on tournois (ville_id);
create index if not exists villes_commune_de_idx on villes (commune_de);
create index if not exists villes_pays_id_idx on villes (pays_id);
