-- Gestion des saisons de classement : jusqu'ici "Saison 3 : Éclipse" et "se
-- termine dans 18 jours" (mockProfil.ts) étaient du texte fixe, aucune vraie
-- date, et points_classement s'accumulait indéfiniment (jamais de reset).
--
-- Le classement (ladder, rang national) doit repartir à zéro à chaque
-- saison — le palier de progression (Débutant→Légende), lui, reste basé
-- sur le cumul à VIE (cohérent avec matchs_joues, qui ne se réinitialise
-- jamais) : perdre son badge "Légende" tous les 30 jours serait décourageant,
-- ce n'est pas ce que "progression" signifie ici. Donc : points_classement
-- gagne une colonne saison_id (clé composite avec profile_id/jeu_id) — le
-- classement affiché filtre sur la saison en cours, le total carrière (pour
-- le palier) reste une simple somme sans filtre de saison.
--
-- Table encore vide à ce jour (aucun tournoi clôturé depuis la mise en
-- place des points la semaine dernière) : pas de backfill nécessaire, la
-- colonne peut être ajoutée NOT NULL directement.

create table saisons (
  id uuid primary key default gen_random_uuid(),
  numero int not null unique,
  nom text not null,
  debut_le timestamptz not null,
  fin_le timestamptz not null,
  created_at timestamptz not null default now(),
  constraint saisons_dates_coherentes check (fin_le > debut_le)
);

-- Continuité avec le texte déjà affiché aux joueurs ("Saison 3 : Éclipse")
-- avant que ce ne soit réel — on ne repart pas à "Saison 1".
insert into saisons (numero, nom, debut_le, fin_le)
values (3, 'Éclipse', now(), now() + interval '30 days');

alter table points_classement drop constraint points_classement_pkey;
alter table points_classement add column saison_id uuid not null references saisons(id) on delete cascade;
alter table points_classement add constraint points_classement_pkey primary key (profile_id, jeu_id, saison_id);

alter table saisons enable row level security;
create policy "lecture publique" on saisons for select using (true);
