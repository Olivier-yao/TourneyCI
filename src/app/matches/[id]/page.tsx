import { notFound } from "next/navigation";
import { matchParId } from "@/lib/mockBracket";
import { tournoiParId } from "@/lib/mockTournaments";
import { MatchLiveClient } from "./MatchLiveClient";

export default async function MatchLivePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const match = await matchParId(id);

  if (!match) {
    notFound();
  }

  const tournoi = await tournoiParId(match.tournoiId);

  return (
    <MatchLiveClient
      match={match}
      tournoiId={match.tournoiId}
      tournoiTitre={tournoi?.titre ?? ""}
    />
  );
}
