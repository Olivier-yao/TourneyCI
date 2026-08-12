-- Schéma initial Tourney : événements, participants, matchs, admins.

create extension if not exists pgcrypto;

create type event_statut as enum ('ouvert', 'cloture', 'en_cours', 'termine');
create type paiement_statut as enum ('en_attente', 'paye');
create type match_statut as enum ('a_venir', 'en_cours', 'termine');

create table events (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  jeu text not null,
  date timestamptz not null,
  lieu text not null,
  max_participants integer not null,
  frais_inscription integer not null,
  statut event_statut not null default 'ouvert',
  created_at timestamptz not null default now()
);

create table participants (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events (id) on delete cascade,
  nom text not null,
  pseudo_tiktok text not null,
  whatsapp text not null,
  statut_paiement paiement_statut not null default 'en_attente',
  created_at timestamptz not null default now()
);

create index participants_event_id_idx on participants (event_id);

create table matches (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events (id) on delete cascade,
  round integer not null,
  position integer not null,
  participant1_id uuid references participants (id) on delete set null,
  participant2_id uuid references participants (id) on delete set null,
  score1 integer,
  score2 integer,
  gagnant_id uuid references participants (id) on delete set null,
  statut match_statut not null default 'a_venir'
);

create index matches_event_id_idx on matches (event_id);

create table admins (
  id uuid primary key default gen_random_uuid(),
  code_acces text not null
);
