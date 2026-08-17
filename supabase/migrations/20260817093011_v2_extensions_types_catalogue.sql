create extension if not exists pgcrypto;

create type statut_kyc as enum ('en_attente', 'validee', 'refusee');
create type statut_demande as enum ('en_attente', 'validee', 'refusee');
create type genre_jeu as enum ('FPS','TPS','Combat','Sport','Battle Royale');
create type type_competition as enum ('1v1','equipes','battle_royale');
create type modalite_tournoi as enum ('virtuel','presentiel');
create type sous_type_br as enum ('solo','duo','trio','squad');
create type sous_type_equipe as enum ('duo','trio','squad','escouade');
create type mode_equipe as enum ('libre','predefinies');
create type statut_match as enum ('a_venir','en_cours','termine');
create type type_mouvement as enum ('gain','inscription','recharge','retrait','commission','financement','remboursement');
create type statut_invitation as enum ('en_attente','acceptee','refusee');
create type type_avis as enum ('coeur','coeur_brise');

create table jeux (
  id text primary key,
  label text not null,
  genre genre_jeu not null,
  capacite_lobby_max int not null default 50
);

create table pays (
  id text primary key,
  nom text not null
);

create table villes (
  id serial primary key,
  pays_id text not null references pays(id),
  nom text not null,
  commune_de int references villes(id)
);
