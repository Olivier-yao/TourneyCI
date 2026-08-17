create table litiges (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references matches(id),
  auteur_id uuid not null references profiles(id),
  motif text not null,
  description text not null,
  preuves text[] not null default '{}',
  statut text not null default 'en_attente',
  created_at timestamptz not null default now()
);

create table appels (
  id uuid primary key default gen_random_uuid(),
  tournoi_id uuid not null references tournois(id),
  auteur_id uuid not null references profiles(id),
  motif text not null,
  statut text not null default 'ouvert',
  created_at timestamptz not null default now(),
  unique (tournoi_id, auteur_id)
);

create table plaintes (
  id uuid primary key default gen_random_uuid(),
  auteur_id uuid not null references profiles(id),
  sujet text not null, description text not null,
  statut text not null default 'en_attente',
  message_admin text,
  created_at timestamptz not null default now()
);

create table demandes_annulation (
  id uuid primary key default gen_random_uuid(),
  tournoi_id uuid not null references tournois(id),
  organisateur_id uuid not null references profiles(id),
  motif text not null,
  statut text not null default 'en_attente',
  message_admin text,
  created_at timestamptz not null default now()
);
