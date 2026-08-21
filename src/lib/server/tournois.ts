import { NextResponse } from "next/server";
import { creerClientSupabaseServeur } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
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

/** Un tournoi passe "en direct" tout seul dès que l'heure de début est
 * atteinte (et qu'il n'est ni terminé ni annulé) — pas besoin d'action
 * organisateur ni de tâche planifiée : calculé à la lecture, comme
 * termine/annule/checkin. en_direct (colonne stockée) reste disponible pour
 * un futur déclenchement manuel anticipé, mais rien ne l'écrit à true
 * aujourd'hui. */
export function estEnDirect(row: { en_direct: boolean; termine_le: Date | null; annule_le: Date | null; debut_tournoi_le: Date }): boolean {
  if (row.en_direct) return true;
  if (row.termine_le || row.annule_le) return false;
  return Date.now() >= row.debut_tournoi_le.getTime();
}

const includeTournoiDetail = {
  jeux: true,
  villes: true,
  profiles: { include: { organisateur_profils: true } },
  _count: { select: { inscriptions: true } },
  inscriptions: { include: { profiles: true } },
} satisfies Prisma.tournoisInclude;

const includeTournoiListe = {
  jeux: true,
  villes: true,
  profiles: { include: { organisateur_profils: true } },
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
    organisateur: row.profiles.organisateur_profils?.nom_organisateur ?? row.profiles.pseudo,
    format: formatDuTournoi({
      type,
      equipeSousType: row.equipe_sous_type ?? undefined,
      modeEquipe: row.mode_equipe ?? undefined,
      placesTotal: row.places_total,
      manchesParMatch: row.manches_par_match ?? undefined,
    }),
    type,
    modalite: row.modalite,
    ville: row.villes?.nom ?? "En ligne",
    dateLabel: formaterDateLabel(row.debut_tournoi_le.getTime()),
    cashPrizeXof: row.cash_prize_engage_xof,
    fraisXof: row.frais_xof,
    placesInscrites: row._count.inscriptions,
    placesTotal: row.places_total,
    checkin: formaterHeureCheckin(row.checkin_le.getTime()),
    enDirect: estEnDirect(row),
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
    manchesPrevues: row.manches_prevues ?? undefined,
    manchesParMatch: row.manches_par_match ?? undefined,
    debutTournoiTs: row.debut_tournoi_le.getTime(),
    debutInscriptionsTs: row.debut_inscriptions_le?.getTime(),
    finInscriptionsTs: row.fin_inscriptions_le?.getTime(),
    streamActif: row.stream_actif,
  };
}

/** Synchronise le nom d'organisateur (encore 100% localStorage côté client,
 * cf. mockOrganisateur.ts) vers la table organisateur_profils, pour que
 * l'API renvoie le même nom que nomOrganisateurActuel() côté client — sans
 * ça, tournoi.organisateur (pseudo joueur) ne correspond jamais au nom
 * d'organisateur choisi à l'onboarding, et le créateur d'un tournoi n'est
 * plus reconnu comme son propre organisateur (peutSuperviser compare des
 * noms). Best-effort : un conflit d'unicité sur nom_organisateur ne doit
 * jamais faire échouer l'action principale (création de tournoi, etc.).
 */
export async function synchroniserNomOrganisateur(profileId: string, nom: string): Promise<void> {
  const nomTrim = nom.trim();
  if (!nomTrim) return;
  try {
    await prisma.organisateur_profils.upsert({
      where: { profile_id: profileId },
      create: { profile_id: profileId, nom_organisateur: nomTrim },
      update: { nom_organisateur: nomTrim },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") return;
    throw err;
  }
}
