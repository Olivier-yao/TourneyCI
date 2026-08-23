-- Chat d'équipe (priorité backend #5) : jusqu'ici entièrement localStorage
-- (mockChatEquipe.ts), donc un message envoyé depuis un appareil n'était
-- jamais visible depuis celui d'un coéquipier — bug rapporté par
-- l'utilisateur en tout début de session ("je ne reçois aucun message").
-- Table dédiée plutôt que de réutiliser messages_chat (dont tournoi_id est
-- NOT NULL et le concept ne colle pas : le chat d'équipe reste accessible
-- entre les tournois, indépendamment de tout tournoi_id précis).

create type type_message_chat_equipe as enum ('message', 'systeme');

create table messages_chat_equipe (
  id uuid primary key default gen_random_uuid(),
  equipe_id uuid not null references equipes_profil(id) on delete cascade,
  auteur_id uuid references profiles(id) on delete no action,
  type type_message_chat_equipe not null default 'message',
  texte text not null,
  created_at timestamptz not null default now()
);

create index messages_chat_equipe_equipe_idx on messages_chat_equipe (equipe_id, created_at);

alter table messages_chat_equipe enable row level security;
create policy "lecture par les membres de l'equipe" on messages_chat_equipe for select
  using (equipe_id in (select equipe_id from equipes_profil_membres where profile_id = auth.uid()));
create policy "ecriture par les membres de l'equipe" on messages_chat_equipe for insert
  with check (auteur_id = auth.uid() and equipe_id in (select equipe_id from equipes_profil_membres where profile_id = auth.uid()));
