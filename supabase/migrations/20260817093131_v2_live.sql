create table matches (
  id uuid primary key default gen_random_uuid(),
  tournoi_id uuid not null references tournois(id) on delete cascade,
  round int not null,
  position int not null,
  joueur1 text, joueur2 text,
  score1 int, score2 int,
  statut statut_match not null default 'a_venir',
  unique (tournoi_id, round, position)
);

create table match_evenements (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references matches(id) on delete cascade,
  texte text not null,
  created_at timestamptz not null default now()
);

create table manches_br (
  id uuid primary key default gen_random_uuid(),
  tournoi_id uuid not null references tournois(id) on delete cascade,
  numero int not null,
  created_at timestamptz not null default now(),
  unique (tournoi_id, numero)
);

create table manches_br_resultats (
  manche_id uuid not null references manches_br(id) on delete cascade,
  participant text not null,
  placement int not null,
  eliminations int not null default 0,
  primary key (manche_id, participant)
);

create table manche_br_en_cours (
  tournoi_id uuid primary key references tournois(id) on delete cascade,
  resultats jsonb not null,
  mis_a_jour_le timestamptz not null default now()
);

create table room_infos (
  tournoi_id uuid primary key references tournois(id) on delete cascade,
  lien text,
  mot_de_passe text
);

create table messages_chat (
  id uuid primary key default gen_random_uuid(),
  tournoi_id uuid not null references tournois(id) on delete cascade,
  auteur_id uuid not null references profiles(id),
  texte text not null,
  created_at timestamptz not null default now()
);
