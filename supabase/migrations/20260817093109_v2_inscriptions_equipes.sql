create table equipes_br (
  id uuid primary key default gen_random_uuid(),
  tournoi_id uuid not null references tournois(id) on delete cascade,
  nom text not null,
  chef_id uuid not null references profiles(id),
  paiement_couvert boolean not null default false,
  created_at timestamptz not null default now()
);

create table inscriptions (
  id uuid primary key default gen_random_uuid(),
  tournoi_id uuid not null references tournois(id) on delete cascade,
  profile_id uuid not null references profiles(id),
  tag text,
  equipe_nom text,
  equipe_br_id uuid references equipes_br(id),
  paye_le timestamptz,
  montant_paye_xof int,
  present_le timestamptz,
  created_at timestamptz not null default now(),
  unique (tournoi_id, profile_id)
);

create table equipes_br_membres (
  equipe_id uuid not null references equipes_br(id) on delete cascade,
  profile_id uuid not null references profiles(id),
  primary key (equipe_id, profile_id)
);

create table demandes_equipe_br (
  id uuid primary key default gen_random_uuid(),
  equipe_id uuid not null references equipes_br(id) on delete cascade,
  demandeur_id uuid not null references profiles(id),
  created_at timestamptz not null default now(),
  unique (equipe_id, demandeur_id)
);

create table retraits_equipe_br (
  id uuid primary key default gen_random_uuid(),
  equipe_id uuid not null references equipes_br(id) on delete cascade,
  membre_id uuid not null references profiles(id),
  motif text not null,
  created_at timestamptz not null default now()
);

create table equipes_profil (
  id uuid primary key default gen_random_uuid(),
  chef_id uuid not null references profiles(id),
  nom text not null,
  nom_modifie_le timestamptz,
  created_at timestamptz not null default now(),
  unique (chef_id, nom)
);

create table equipes_profil_membres (
  equipe_id uuid not null references equipes_profil(id) on delete cascade,
  profile_id uuid not null references profiles(id),
  primary key (equipe_id, profile_id)
);

create table invitations_equipe_profil (
  id uuid primary key default gen_random_uuid(),
  equipe_id uuid not null references equipes_profil(id) on delete cascade,
  destinataire_id uuid not null references profiles(id),
  statut statut_invitation not null default 'en_attente',
  created_at timestamptz not null default now()
);

create table propositions_equipe (
  id uuid primary key default gen_random_uuid(),
  equipe_id uuid not null references equipes_profil(id) on delete cascade,
  tournoi_id uuid not null references tournois(id) on delete cascade,
  proposeur_id uuid not null references profiles(id),
  statut statut_invitation not null default 'en_attente',
  created_at timestamptz not null default now()
);
