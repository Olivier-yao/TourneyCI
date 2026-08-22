import { MatchLiveClient } from "./MatchLiveClient";

/** Page volontairement minimale : matchParId()/tournoiParId() (et tout ce
 * qui en dépend, cf. MatchLiveClient) sont des appels réseau (fetch relatif
 * "/api/...") depuis la migration du bracket vers Postgres — un Server
 * Component ne peut pas les résoudre (fetch côté Node n'a pas d'origine
 * implicite comme dans le navigateur, contrairement à un <a href="/..."> ou
 * un fetch client). Tout le chargement se fait donc côté client dans
 * MatchLiveClient, cette page ne fait que transmettre l'id de l'URL. */
export default async function MatchLivePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <MatchLiveClient matchId={id} />;
}
