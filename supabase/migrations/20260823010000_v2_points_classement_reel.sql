-- Points/classement/palier (priorite backend #4) : jusqu'ici entierement
-- localStorage (CLASSEMENTS statique + attribuerPoints dans mockProfil.ts),
-- donc jamais partage d'un appareil a l'autre, et matchsJoues/victoires
-- restaient des valeurs figees (MON_PROFIL) puisqu'aucun vrai match n'etait
-- agrege. Les matchs/manches reels existent deja (tables matches,
-- manches_br_resultats) mais rien n'en derivait de compteurs par profil.

alter table profiles add column matchs_joues integer not null default 0;
alter table profiles add column victoires integer not null default 0;

-- Points cumules par joueur ET par jeu (le classement est par jeu, comme
-- l'etait CLASSEMENTS). Incremente uniquement a la cloture d'un tournoi
-- (src/lib/server/cloture.ts), jamais depuis le client.
create table points_classement (
  profile_id uuid not null references profiles(id) on delete cascade,
  jeu_id text not null references jeux(id) on delete cascade,
  points integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (profile_id, jeu_id)
);

alter table points_classement enable row level security;
create policy "lecture publique" on points_classement for select using (true);
