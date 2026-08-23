-- La table litiges existait déjà (migration antérieure, jamais exploitée)
-- avec des policies RLS orientées "admin plateforme" (auth.jwt() ->>
-- 'is_admin') — un mécanisme jamais implémenté dans ce projet (l'admin réel
-- de /tourney-control passe par un cookie HMAC signé côté serveur, cf.
-- src/lib/server/adminAuth.ts, pas par une claim JWT Supabase). Le vrai
-- modèle, confirmé par l'écran d'arbitrage organisateur déjà construit
-- (VueOrganisateurMatch.tsx) et la supervision admin en lecture seule
-- (/tourney-control, onglet Litiges) : le litige est tranché par
-- l'organisateur du tournoi concerné (ou un adjoint accepté), jamais par un
-- admin plateforme.

drop policy "lecture propriétaire ou admin" on litiges;
drop policy "traitement admin seulement" on litiges;

create policy "lecture par l'auteur ou l'organisateur du tournoi" on litiges for select
  using (
    auteur_id = auth.uid()
    or match_id in (
      select m.id from matches m
      join tournois t on t.id = m.tournoi_id
      where t.organisateur_id = auth.uid()
        or exists (select 1 from adjoints_organisateur a where a.proprietaire_id = t.organisateur_id and a.adjoint_id = auth.uid() and a.statut = 'accepte')
    )
  );

create policy "traitement par l'organisateur du tournoi" on litiges for update
  using (
    match_id in (
      select m.id from matches m
      join tournois t on t.id = m.tournoi_id
      where t.organisateur_id = auth.uid()
        or exists (select 1 from adjoints_organisateur a where a.proprietaire_id = t.organisateur_id and a.adjoint_id = auth.uid() and a.statut = 'accepte')
    )
  );
