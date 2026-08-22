create type statut_adjoint as enum ('en_attente', 'accepte');

create table adjoints_organisateur (
  proprietaire_id uuid not null references profiles(id) on delete cascade,
  adjoint_id uuid not null references profiles(id) on delete cascade,
  statut statut_adjoint not null default 'en_attente',
  created_at timestamptz not null default now(),
  primary key (proprietaire_id, adjoint_id)
);

alter table adjoints_organisateur enable row level security;
