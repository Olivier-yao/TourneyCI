create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  pseudo text not null unique,
  tag text generated always as (upper(regexp_replace(pseudo, '[^a-zA-Z0-9]+', '_', 'g'))) stored,
  photo_url text,
  ville_id int references villes(id),
  langue text not null default 'fr' check (langue in ('fr','en')),
  role_prefere text not null default 'joueur' check (role_prefere in ('joueur','organisateur')),
  pseudo_modifie_le timestamptz,
  reglement_interieur_accepte_le timestamptz,
  created_at timestamptz not null default now()
);

create table kyc_verifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id),
  type_piece text not null,
  recto_url text not null,
  verso_url text not null,
  selfie_url text not null,
  age_confirme boolean not null,
  statut statut_kyc not null default 'en_attente',
  document_hash text,
  created_at timestamptz not null default now()
);

create table liste_noire_documents (
  id uuid primary key default gen_random_uuid(),
  document_hash text not null unique,
  motif text not null,
  created_at timestamptz not null default now()
);

create table organisateur_profils (
  profile_id uuid primary key references profiles(id),
  nom_organisateur text not null unique,
  bio text,
  banniere_url text,
  photo_url text,
  reglement_standard_accepte_le timestamptz,
  reglement_certifie_accepte_le timestamptz,
  statut_moderation text not null default 'actif' check (statut_moderation in ('actif','suspendu','banni')),
  suivi_masque boolean not null default false
);

create table demandes_organisateur (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id),
  motivation text not null,
  identite_verifiee boolean not null,
  score_analyse int,
  statut statut_demande not null default 'en_attente',
  message_admin text,
  traite_par uuid references profiles(id),
  created_at timestamptz not null default now()
);
