drop view soldes;
create view soldes with (security_invoker = true) as
  select profile_id, coalesce(sum(montant_xof),0) as solde_xof
  from mouvements group by profile_id;
