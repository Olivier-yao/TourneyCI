"use client";

import { useEffect, useState } from "react";
import { matchParId, type MatchTournoi } from "@/lib/mockBracket";
import { estInscrit } from "@/lib/mockInscriptions";
import { tournoiParId } from "@/lib/mockTournaments";
import { nomOrganisateurActuel } from "@/lib/mockOrganisateur";
import { peutSuperviser } from "@/lib/mockAdjointsOrganisateur";
import { lireProfil } from "@/lib/mockProfil";
import { VueSpectateurMatch } from "./VueSpectateurMatch";
import { VueParticipantMatch } from "./VueParticipantMatch";
import { VueOrganisateurMatch } from "./VueOrganisateurMatch";

type Role = "chargement" | "organisateur" | "participant" | "spectateur";

/** Point d'entrée de l'écran Match en direct : détermine le rôle du
 * visiteur et rend l'une des trois vues entièrement distinctes (point 106)
 * — spectateur, participant inscrit, ou organisateur. Aucune logique
 * d'affichage commune au-delà de cette bascule : chaque vue porte ses
 * propres informations et ses propres actions. */
export function MatchLiveClient({
  match: matchInitial,
  tournoiId,
  tournoiTitre,
}: {
  match: MatchTournoi;
  tournoiId: string;
  tournoiTitre: string;
}) {
  const [match, setMatch] = useState<MatchTournoi>(matchInitial);
  const [role, setRole] = useState<Role>("chargement");
  const [monPseudo, setMonPseudo] = useState("");

  function rafraichir() {
    setMatch(matchParId(matchInitial.id) ?? matchInitial);
  }

  useEffect(() => {
    // État dépendant du localStorage : neutre au premier rendu serveur,
    // synchronisé côté client une fois monté (évite un mismatch d'hydratation).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMonPseudo(lireProfil().pseudo);
    rafraichir();
    const tournoi = tournoiParId(tournoiId);
    if (tournoi && peutSuperviser(tournoi.organisateur, nomOrganisateurActuel())) setRole("organisateur");
    else if (estInscrit(tournoiId)) setRole("participant");
    else setRole("spectateur");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournoiId, matchInitial.id]);

  if (role === "chargement") {
    return <div className="min-h-screen" style={{ background: "var(--ds-bg)" }} />;
  }

  if (role === "organisateur") {
    return <VueOrganisateurMatch match={match} tournoiId={tournoiId} tournoiTitre={tournoiTitre} onMaj={rafraichir} />;
  }

  if (role === "participant") {
    return <VueParticipantMatch match={match} tournoiId={tournoiId} tournoiTitre={tournoiTitre} monPseudo={monPseudo} />;
  }

  return <VueSpectateurMatch match={match} tournoiId={tournoiId} tournoiTitre={tournoiTitre} />;
}
