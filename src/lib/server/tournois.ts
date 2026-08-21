import { NextResponse } from "next/server";
import { creerClientSupabaseServeur } from "@/lib/supabase/server";
import { Prisma, type type_competition } from "@/generated/prisma/client";
import { formatDuTournoi, formaterDateLabel, formaterHeureCheckin } from "@/lib/tournoiFormat";

/** Même pattern que src/app/api/profil/route.ts, partagé ici car repris par
 * cinq routes (tournois, détail, annuler, terminer, inscriptions) plutôt que
 * dupliqué à chaque fois. */
export async function utilisateurConnecte() {
  const supabase = await creerClientSupabaseServeur();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export function nonAuthentifie() {
  return NextResponse.json({ success: false, error: "Non authentifié." }, { status: 401 });
}

/** type_competition.v1 est mappé sur la valeur DB "1v1" (un enum Prisma ne
 * peut pas commencer par un chiffre) — ces deux fonctions traduisent entre
 * la valeur DB/Prisma et la valeur "1v1" utilisée côté app (cf. TypeCompetition
 * dans mockTournaments.ts). */
export function versTypeCompetition(valeur: "1v1" | "equipes" | "battle_royale"): type_competition {
  return valeur === "1v1" ? "v1" : valeur;
}

export function depuisTypeCompetition(valeur: type_competition): "1v1" | "equipes" | "battle_royale" {
  return valeur === "v1" ? "1v1" : valeur;
}

const includeTournoiDetail = {
  jeux: true,
  villes: true,
  profiles: true,
  _count: { select: { inscriptions: true } },
  inscriptions: { include: { profiles: true } },
} satisfies Prisma.tournoisInclude;

const includeTournoiListe = {
  jeux: true,
  villes: true,
  profiles: true,
  _count: { select: { inscriptions: true } },
} satisfies Prisma.tournoisInclude;

export const INCLUDE_TOURNOI_DETAIL = includeTournoiDetail;
export const INCLUDE_TOURNOI_LISTE = includeTournoiListe;

type TournoiDetailRow = Prisma.tournoisGetPayload<{ include: typeof includeTournoiDetail }>;
type TournoiListeRow = Prisma.tournoisGetPayload<{ include: typeof includeTournoiListe }>;

/** Adapte une ligne Prisma (snake_case, enums bruts) vers le type `Tournoi`
 * (camelCase) déjà utilisé côté UI — pour limiter les changements dans les
 * composants qui consomment mockTournaments.ts. */
export function versTournoiJSON(row: TournoiDetailRow | TournoiListeRow) {
  const inscriptions = "inscriptions" in row ? row.inscriptions : undefined;
  const type = depuisTypeCompetition(row.type);
  return {
    id: row.id,
    code: row.code,
    jeuId: row.jeu_id,
    jeuLabel: row.jeux.label,
    titre: row.titre,
    organisateur: row.profiles.pseudo,
    format: formatDuTournoi({ type, equipeSousType: row.equipe_sous_type ?? undefined, modeEquipe: row.mode_equipe ?? undefined, placesTotal: row.places_total }),
    type,
    modalite: row.modalite,
    ville: row.villes?.nom ?? "En ligne",
    dateLabel: formaterDateLabel(row.debut_tournoi_le.getTime()),
    cashPrizeXof: row.cash_prize_engage_xof,
    fraisXof: row.frais_xof,
    placesInscrites: row._count.inscriptions,
    placesTotal: row.places_total,
    checkin: formaterHeureCheckin(row.checkin_le.getTime()),
    enDirect: row.en_direct,
    reglement: row.reglement,
    informations: row.informations ?? undefined,
    inscrits: inscriptions?.map((i) => i.equipe_nom ?? i.profiles.pseudo) ?? [],
    modeEquipe: row.mode_equipe ?? undefined,
    brSousType: row.br_sous_type ?? undefined,
    equipeSousType: row.equipe_sous_type ?? undefined,
    financementCashPrize: row.financement_cash_prize === "organisateur" ? "organisateur" : "inscriptions",
    commissionActivee: row.commission_activee,
    banniereUrl: row.banniere_url ?? undefined,
    symboleId: row.symbole_id ?? undefined,
    termine: !!row.termine_le,
    annule: !!row.annule_le,
    debutTournoiTs: row.debut_tournoi_le.getTime(),
    debutInscriptionsTs: row.debut_inscriptions_le?.getTime(),
    finInscriptionsTs: row.fin_inscriptions_le?.getTime(),
    streamActif: row.stream_actif,
  };
}
