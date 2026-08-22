-- Complète le profil organisateur (point 58/59) : TAG personnel, jusque-là
-- un simple champ localStorage sans equivalent en base (contrairement au
-- nom_organisateur deja migre) - donnee libre, distincte du nom
-- d'organisateur, pas de formule de derivation comme profiles.tag.
alter table organisateur_profils add column tag text;
alter table organisateur_profils add column photo_modifiee_le timestamptz;

-- Le reglement standard (point 178) peut desormais etre accepte AVANT le
-- choix d'un nom d'organisateur (c'est la toute premiere etape du parcours
-- "devenir organisateur") : la ligne organisateur_profils doit donc pouvoir
-- exister sans nom_organisateur pour l'instant. Postgres traite chaque NULL
-- comme distinct sous une contrainte UNIQUE standard, donc la retirer la
-- NOT NULL suffit - pas besoin de repenser la contrainte unique.
alter table organisateur_profils alter column nom_organisateur drop not null;

-- Reseaux sociaux (point 58/59) : un seul lien par plateforme, jusque-là un
-- unique tableau JSON en localStorage (CLE_RESEAUX_SOCIAUX), aucune table
-- correspondante en base.
create table organisateur_reseaux_sociaux (
  profile_id uuid not null references profiles(id) on delete cascade,
  plateforme text not null,
  url text not null,
  primary key (profile_id, plateforme)
);

alter table organisateur_reseaux_sociaux enable row level security;
create policy "lecture publique" on organisateur_reseaux_sociaux for select using (true);
create policy "gestion par le proprietaire" on organisateur_reseaux_sociaux for all using (profile_id = auth.uid());
