-- La table plaintes existait déjà (jamais exploitée) avec des policies RLS
-- orientées "admin plateforme" via auth.jwt() ->> 'is_admin' — un mécanisme
-- jamais implémenté dans ce projet (l'admin réel de /tourney-control passe
-- par un cookie HMAC signé côté serveur, cf. src/lib/server/adminAuth.ts,
-- pas par une claim JWT Supabase). Contrairement à litiges (où de vrais
-- comptes joueur/organisateur ont un accès légitime), plaintes est
-- entièrement admin-only + auteur — même profil que kyc_verifications
-- (RLS activé, aucune policy : accès direct bloqué pour tout le monde,
-- tout passe par Prisma + le contrôle d'accès explicite du serveur).

drop policy "creation par soi-meme" on plaintes;
drop policy "lecture propriétaire ou admin" on plaintes;
drop policy "traitement admin seulement" on plaintes;
