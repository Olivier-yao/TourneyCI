create table mouvements (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id),
  type type_mouvement not null,
  libelle text not null,
  montant_xof int not null,
  tournoi_id uuid references tournois(id),
  reference_paiement text,
  created_at timestamptz not null default now()
);

create view soldes as
  select profile_id, coalesce(sum(montant_xof),0) as solde_xof
  from mouvements group by profile_id;

create table notifications (
  id uuid primary key default gen_random_uuid(),
  destinataire_id uuid not null references profiles(id),
  texte text not null,
  tournoi_id uuid references tournois(id),
  lue_le timestamptz,
  created_at timestamptz not null default now()
);
create index on notifications (destinataire_id, created_at desc);

create table favoris (
  profile_id uuid references profiles(id), tournoi_id uuid references tournois(id),
  primary key (profile_id, tournoi_id)
);
create table notifs_tournoi_suivis (
  profile_id uuid references profiles(id), tournoi_id uuid references tournois(id),
  primary key (profile_id, tournoi_id)
);
create table suivis_organisateur (
  follower_id uuid references profiles(id), organisateur_id uuid references profiles(id),
  primary key (follower_id, organisateur_id)
);
create table soutiens_organisateur (
  id uuid primary key default gen_random_uuid(),
  auteur_id uuid references profiles(id),
  organisateur_id uuid references profiles(id),
  tournoi_id uuid references tournois(id),
  created_at timestamptz not null default now(),
  unique (auteur_id, organisateur_id)
);

create table avis_tournoi (
  id uuid primary key default gen_random_uuid(),
  tournoi_id uuid not null references tournois(id) on delete cascade,
  auteur_id uuid not null references profiles(id),
  type type_avis not null,
  message text,
  created_at timestamptz not null default now(),
  unique (tournoi_id, auteur_id)
);

create table avis_organisateur (
  auteur_id uuid references profiles(id),
  organisateur_id uuid references profiles(id),
  type type_avis not null,
  created_at timestamptz not null default now(),
  primary key (auteur_id, organisateur_id)
);
