"use client";

import { useEffect, useState } from "react";
import { useRealtimeRefetch } from "@/hooks/useRealtimeRefetch";
import { matchParId, type MatchTournoi } from "@/lib/mockBracket";
import { estInscrit } from "@/lib/mockInscriptions";
import { tournoiParId } from "@/lib/mockTournaments";
import { nomOrganisateurActuel } from "@/lib/mockOrganisateur";
import { peutSuperviser } from "@/lib/mockAdjointsOrganisateur";
import { lireProfil, attendreProfil } from "@/lib/mockProfil";
import { VueSpectateurMatch } from "./VueSpectateurMatch";
import { VueParticipantMatch } from "./VueParticipantMatch";
import { VueOrganisateurMatch } from "./VueOrganisateurMatch";

type Role = "chargement" | "introuvable" | "organisateur" | "participant" | "spectateur";

/** Point d'entrée de l'écran Match en direct : charge le match par id (voir
 * page.tsx pour pourquoi ce chargement est entièrement client), détermine le
 * rôle du visiteur et rend l'une des trois vues entièrement distinctes
 * (point 106) — spectateur, participant inscrit, ou organisateur. Aucune
 * logique d'affichage commune au-delà de cette bascule : chaque vue porte
 * ses propres informations et ses propres actions. */
export function MatchLiveClient({ matchId }: { matchId: string }) {
  const [match, setMatch] = useState<MatchTournoi | undefined>(undefined);
  const [tournoiTitre, setTournoiTitre] = useState("");
  const [role, setRole] = useState<Role>("chargement");
  const [monPseudo, setMonPseudo] = useState("");

  async function rafraichir() {
    const m = await matchParId(matchId);
    setMatch(m);
    return m;
  }

  useEffect(() => {
    async function charger() {
      await attendreProfil();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMonPseudo(lireProfil().pseudo);
      const m = await rafraichir();
      if (!m) {
        setRole("introuvable");
        return;
      }
      const tournoi = await tournoiParId(m.tournoiId);
      setTournoiTitre(tournoi?.titre ?? "");
      if (tournoi && (await peutSuperviser(tournoi.organisateur, nomOrganisateurActuel()))) setRole("organisateur");
      else if (await estInscrit(m.tournoiId)) setRole("participant");
      else setRole("spectateur");
    }
    charger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  useRealtimeRefetch(
    [{ table: "matches", filter: `id=eq.${matchId}`, event: "UPDATE" }],
    () => { rafraichir(); },
  );

  if (role === "chargement") {
    return <div className="min-h-screen" style={{ background: "var(--ds-bg)" }} />;
  }

  if (role === "introuvable" || !match) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}>
        Match introuvable.
      </div>
    );
  }

  if (role === "organisateur") {
    return <VueOrganisateurMatch match={match} tournoiId={match.tournoiId} tournoiTitre={tournoiTitre} onMaj={rafraichir} />;
  }

  if (role === "participant") {
    return <VueParticipantMatch match={match} tournoiId={match.tournoiId} tournoiTitre={tournoiTitre} monPseudo={monPseudo} />;
  }

  return <VueSpectateurMatch match={match} tournoiId={match.tournoiId} tournoiTitre={tournoiTitre} />;
}
