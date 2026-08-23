/**
 * Versement du cash prize à la clôture d'un tournoi — entièrement
 * server-side, exécuté par POST /api/tournois/[id]/terminer.
 *
 * Remplace l'ancien versement client (terminerTournoi() dans
 * mockTournaments.ts) qui ne créditait jamais que le compte de l'appareil
 * ayant déclenché la clôture — jamais le vrai vainqueur si c'était un autre
 * compte. Ici, le classement est recalculé côté serveur à partir des mêmes
 * données (matches ou manches_br) et le(s) gagnant(s) sont crédités
 * directement via un mouvement wallet réel (table `mouvements`), quel que
 * soit l'appareil qui a déclenché la clôture.
 *
 * Les fonctions pures (repartitionAutomatique, barème BR) sont dupliquées
 * ici depuis mockTournaments.ts/mockBattleRoyale.ts plutôt qu'importées :
 * ces fichiers font des appels fetch() avec URL relative, invalides côté
 * Node (même contrainte que le fix du crash /matches/[id] plus tôt dans ce
 * chantier) — un module serveur ne doit dépendre que de code sans fetch.
 */

import { prisma } from "@/lib/prisma";

const COMMISSION_PCT = 0.2;
const BAREME_PLACEMENT_BR = [10, 6, 5, 4, 3, 2, 1, 1];

function repartitionAutomatique(montantNetXof: number, nbFinalistes: number): number[] {
  const n = Math.max(1, Math.min(Math.round(nbFinalistes) || 1, 20));
  if (n === 1) return [montantNetXof];
  const poids = Array.from({ length: n }, (_, i) => 1 / (i + 1));
  const totalPoids = poids.reduce((a, b) => a + b, 0);
  const montants = poids.map((p) => Math.round((p / totalPoids) * montantNetXof));
  const ecart = montantNetXof - montants.reduce((a, b) => a + b, 0);
  montants[montants.length - 1] += ecart;
  return montants;
}

function perdantDe(m: { statut: string; joueur1: string | null; joueur2: string | null; score1: number | null; score2: number | null }): string | null {
  if (m.statut !== "termine") return null;
  const gagnant = (m.score1 ?? 0) > (m.score2 ?? 0) ? m.joueur1 : m.joueur2;
  return gagnant === m.joueur1 ? m.joueur2 : m.joueur1;
}

/** 1er = vainqueur, puis finaliste, puis perdants des rounds précédents dans
 * l'ordre décroissant — même logique que classementFinalBracket() côté
 * client (mockBracket.ts), portée ici sur des données Prisma déjà chargées
 * plutôt qu'un fetch. */
function classementFinalBracketServeur(matches: { round: number; position: number; joueur1: string | null; joueur2: string | null; score1: number | null; score2: number | null; statut: string }[]): string[] {
  if (matches.length === 0) return [];
  const totalRounds = Math.max(...matches.map((m) => m.round));
  const finale = matches.find((m) => m.round === totalRounds && m.position === 0);
  if (!finale || finale.statut !== "termine") return [];

  const gagnant = (finale.score1 ?? 0) > (finale.score2 ?? 0) ? finale.joueur1 : finale.joueur2;
  const perdantFinale = perdantDe(finale);

  const classement: string[] = [];
  if (gagnant) classement.push(gagnant);
  if (perdantFinale) classement.push(perdantFinale);

  for (let round = totalRounds - 1; round >= 1; round--) {
    const perdants = matches.filter((m) => m.round === round).map(perdantDe).filter((n): n is string => Boolean(n));
    classement.push(...perdants);
  }
  return classement;
}

/** Classement par points cumulés (barème façon PUBG), 1er = plus de points.
 * Contrairement à classementFinalBR() côté client (qui retombe sur l'ordre
 * d'inscription si aucune manche n'a été jouée, pour ne jamais laisser
 * l'écran de classement vide) : ici, aucune manche jouée = aucun classement
 * fiable = liste vide = pas de versement. Verser le cash prize sur un simple
 * ordre d'inscription serait incorrect. */
function classementFinalBRServeur(manches: { manches_br_resultats: { participant: string; placement: number; eliminations: number }[] }[]): string[] {
  if (manches.length === 0) return [];
  const totaux = new Map<string, number>();
  for (const manche of manches) {
    for (const r of manche.manches_br_resultats) {
      const points = (r.placement >= 1 && r.placement <= BAREME_PLACEMENT_BR.length ? BAREME_PLACEMENT_BR[r.placement - 1] : 0) + r.eliminations;
      totaux.set(r.participant, (totaux.get(r.participant) ?? 0) + points);
    }
  }
  return Array.from(totaux.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([nom]) => nom);
}

/** Cash prize réellement versable, recalculé sur les inscriptions réelles
 * (jamais la capacité maximale théorique) — à la clôture les inscriptions
 * sont toujours closes, donc toujours basé sur placesInscrites. */
function cashPrizeVersable(
  tournoi: { frais_xof: number; financement_cash_prize: string; cash_prize_engage_xof: number; commission_activee: boolean },
  placesInscrites: number,
): number {
  if (tournoi.financement_cash_prize === "organisateur" || tournoi.frais_xof <= 0) return tournoi.cash_prize_engage_xof;
  const poolBrut = tournoi.frais_xof * placesInscrites;
  const commissionBrute = tournoi.commission_activee ? Math.round(poolBrut * COMMISSION_PCT) : 0;
  return Math.max(0, poolBrut - commissionBrute);
}

/** Résout le ou les profile_id derrière un nom du classement — un pseudo
 * (1v1) ou un nom d'équipe partagé par plusieurs inscriptions (Équipes,
 * Battle Royale duo/trio/squad). Lit `inscriptions` directement (jamais
 * `equipes_br`, qui est supprimée dès la clôture) : le nom d'équipe est déjà
 * stocké sur chaque inscription individuelle, indépendamment de cette table
 * de formation d'équipe. */
async function profileIdsPourNom(tournoiId: string, nom: string, estEquipe: boolean): Promise<string[]> {
  if (estEquipe) {
    const lignes = await prisma.inscriptions.findMany({ where: { tournoi_id: tournoiId, equipe_nom: nom }, select: { profile_id: true } });
    return lignes.map((l) => l.profile_id);
  }
  const ligne = await prisma.inscriptions.findFirst({ where: { tournoi_id: tournoiId, profiles: { pseudo: nom } }, select: { profile_id: true } });
  return ligne ? [ligne.profile_id] : [];
}

export type GagnantCredite = { nom: string; profileIds: string[]; montantXof: number };
export type ResultatCloture = { gagnantsCredites: GagnantCredite[]; cashPrizeTotalXof: number };

/** Calcule le classement final et crédite directement le(s) compte(s)
 * gagnant(s) (mouvement `gain`, jamais un séquestre local) — appelée une
 * seule fois par POST /api/tournois/[id]/terminer, avant que termine_le ne
 * soit marqué de façon à pouvoir encore lire les matches/manches réels. */
export async function verserCashPrizeCloture(tournoiId: string): Promise<ResultatCloture> {
  const tournoi = await prisma.tournois.findUnique({
    where: { id: tournoiId },
    include: { _count: { select: { inscriptions: true } }, repartition_cash_prize: { orderBy: { rang: "asc" } } },
  });
  if (!tournoi || tournoi.repartition_cash_prize.length === 0) {
    return { gagnantsCredites: [], cashPrizeTotalXof: 0 };
  }

  const estEquipe = tournoi.type === "equipes" || (tournoi.type === "battle_royale" && tournoi.br_sous_type !== null && tournoi.br_sous_type !== "solo");

  let classement: string[];
  if (tournoi.type === "battle_royale") {
    const manches = await prisma.manches_br.findMany({ where: { tournoi_id: tournoiId }, include: { manches_br_resultats: true } });
    classement = classementFinalBRServeur(manches);
  } else {
    const matches = await prisma.matches.findMany({ where: { tournoi_id: tournoiId } });
    classement = classementFinalBracketServeur(matches);
  }
  if (classement.length === 0) return { gagnantsCredites: [], cashPrizeTotalXof: 0 };

  const cashPrizeTotalXof = cashPrizeVersable(tournoi, tournoi._count.inscriptions);
  if (cashPrizeTotalXof <= 0) return { gagnantsCredites: [], cashPrizeTotalXof: 0 };

  const repartition = repartitionAutomatique(cashPrizeTotalXof, tournoi.repartition_cash_prize.length);
  const gagnantsCredites: GagnantCredite[] = [];

  for (let i = 0; i < repartition.length && i < classement.length; i++) {
    const montantXof = repartition[i];
    if (montantXof <= 0) continue;
    const nom = classement[i];
    const profileIds = await profileIdsPourNom(tournoiId, nom, estEquipe);
    if (profileIds.length === 0) continue;

    const partEgale = Math.floor(montantXof / profileIds.length);
    const reste = montantXof - partEgale * profileIds.length;
    await prisma.mouvements.createMany({
      data: profileIds.map((profileId, idx) => ({
        profile_id: profileId,
        type: "gain" as const,
        libelle: `Gain · ${tournoi.titre}${profileIds.length > 1 ? " (part d'équipe)" : ""}`,
        montant_xof: partEgale + (idx === 0 ? reste : 0),
        tournoi_id: tournoiId,
      })),
    });
    gagnantsCredites.push({ nom, profileIds, montantXof });
  }

  return { gagnantsCredites, cashPrizeTotalXof };
}

export type ResultatRemboursement = { nbRembourses: number; totalXof: number };

/** Rembourse chaque inscrit réel d'un tournoi annulé — appelée par
 * traiterDemande()/creerDemande() (src/lib/server/demandesAnnulation.ts) au
 * moment exact où annule_le passe de null à une date. Même correction que
 * verserCashPrizeCloture ci-dessus : l'ancienne version (annulerTournoi dans
 * mockTournaments.ts) ne remboursait que l'appareil ayant déclenché
 * l'annulation, et seulement s'il se trouvait lui-même inscrit — un
 * organisateur n'étant presque jamais inscrit à son propre tournoi, elle ne
 * remboursait donc en pratique personne. Ici, chaque inscription réelle est
 * remboursée sur le montant qu'elle a effectivement payé
 * (montant_paye_xof), ou les frais unitaires actuels en repli pour une
 * inscription antérieure à l'ajout de ce champ. */
export async function rembourserInscritsAnnulation(tournoiId: string): Promise<ResultatRemboursement> {
  const tournoi = await prisma.tournois.findUnique({ where: { id: tournoiId } });
  if (!tournoi || tournoi.frais_xof <= 0) return { nbRembourses: 0, totalXof: 0 };

  const inscriptions = await prisma.inscriptions.findMany({
    where: { tournoi_id: tournoiId },
    select: { profile_id: true, montant_paye_xof: true },
  });
  const aRembourser = inscriptions
    .map((i) => ({ profileId: i.profile_id, montantXof: i.montant_paye_xof ?? tournoi.frais_xof }))
    .filter((i) => i.montantXof > 0);
  if (aRembourser.length === 0) return { nbRembourses: 0, totalXof: 0 };

  await prisma.mouvements.createMany({
    data: aRembourser.map((r) => ({
      profile_id: r.profileId,
      type: "remboursement" as const,
      libelle: `Remboursement · ${tournoi.titre}`,
      montant_xof: r.montantXof,
      tournoi_id: tournoiId,
    })),
  });

  return { nbRembourses: aRembourser.length, totalXof: aRembourser.reduce((s, r) => s + r.montantXof, 0) };
}
