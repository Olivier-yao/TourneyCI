-- Stockage fichiers dédié (dernière priorité backend) : jusqu'ici toutes
-- les images (photo/bannière profil, photo/bannière organisateur, bannière
-- tournoi, documents KYC) étaient encodées en data URL et stockées
-- directement dans des colonnes text de Postgres — fonctionnel mais pas
-- prévu pour la volumétrie/coût à grande échelle. Deux buckets Supabase
-- Storage (jamais utilisé dans ce projet jusqu'ici, storage.buckets était
-- vide) :
--   - public-assets : public en lecture, pour tout ce qui est déjà visible
--     publiquement dans l'app (avatars, bannières).
--   - kyc-documents : privé, aucune lecture publique. Les téléversements et
--     lectures passent exclusivement par le serveur (clé service_role,
--     jamais le client) — même discipline que kyc_verifications côté
--     Postgres (RLS actif, zéro policy, tout médié par le serveur).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('public-assets', 'public-assets', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('kyc-documents', 'kyc-documents', false, 5242880, array['image/jpeg', 'image/png', 'image/webp']);
