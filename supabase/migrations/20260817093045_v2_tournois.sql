create table tournois (
  id uuid primary key default gen_random_uuid(),
  code text not null unique default upper(substr(md5(random()::text),1,6)),
  jeu_id text not null references jeux(id),
  organisateur_id uuid not null references profiles(id),
  titre text not null,
  type type_competition not null,
  modalite modalite_tournoi not null,
  br_sous_type sous_type_br,
  equipe_sous_type sous_type_equipe,
  mode_equipe mode_equipe,
  ville_id int references villes(id),
  frais_xof int not null default 0 check (frais_xof >= 0),
  financement_cash_prize text not null default 'inscriptions',
  cash_prize_engage_xof int not null default 0,
  commission_activee boolean not null default false,
  places_total int not null check (places_total >= 2),
  debut_inscriptions_le timestamptz,
  fin_inscriptions_le timestamptz,
  debut_tournoi_le timestamptz not null,
  checkin_le timestamptz not null,
  reglement text not null check (length(trim(reglement)) > 0),
  informations text,
  banniere_url text,
  symbole_id text,
  en_direct boolean not null default false,
  stream_actif boolean not null default false,
  termine_le timestamptz,
  annule_le timestamptz,
  created_at timestamptz not null default now(),
  constraint checkin_avant_debut check (debut_tournoi_le - checkin_le >= interval '10 minutes')
);

create table repartition_cash_prize (
  id uuid primary key default gen_random_uuid(),
  tournoi_id uuid not null references tournois(id) on delete cascade,
  rang int not null,
  label text not null,
  montant_xof int not null,
  unique (tournoi_id, rang)
);

create table tournoi_equipes_predefinies (
  id uuid primary key default gen_random_uuid(),
  tournoi_id uuid not null references tournois(id) on delete cascade,
  nom text not null
);
