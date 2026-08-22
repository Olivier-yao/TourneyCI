create type salon_chat as enum ('general', 'tribune', 'inscrits');

alter table messages_chat
  add column match_id uuid references matches(id) on delete cascade,
  add column salon salon_chat not null default 'general';

create index messages_chat_tournoi_salon_idx on messages_chat (tournoi_id, salon) where match_id is null;
create index messages_chat_match_salon_idx on messages_chat (match_id, salon) where match_id is not null;
