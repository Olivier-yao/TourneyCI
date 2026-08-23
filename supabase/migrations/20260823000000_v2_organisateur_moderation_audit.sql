alter table organisateur_profils
  add column moderation_motif text,
  add column moderation_le timestamptz;
