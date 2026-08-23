/**
 * Clôture d'un tournoi — entièrement server-side, exécutée par
 * POST /api/tournois/[id]/terminer : versement du cash prize, commission
 * organisateur, ET progression joueur (matchs joués/victoires/points de
 * classement, cf. appliquerProgressionEtPoints).
 *
 * Remplace l'ancien versement client (terminerTournoi() dans
 * mockTournaments.ts) qui ne créditait jamais que le compte de l'appareil
 * ayant déclenché la clôture — jamais le vrai vainqueur si c'était un autre
 * compte — et attribuait les points en localStorage (jamais partagés d'un
 * appareil à l'autre). Ici, le classement est recalculé côté serveur à
 * partir des mêmes données (matches ou manches_br) : le(s) gagnant(s) sont
 * crédités directement via un mouvement wallet réel (table `mouvements`),
 * et TOUS les participants réels (pas seulement le podium) voient leurs
 * matchs_joues/victoires/points_classement incrémentés — quel que soit
 * l'appareil qui a déclenché la clôture.
 *
 * Les fonctions pures (repartitionAutomatique, barèmes BR/points) sont
 * dupliquées ici depuis mockTournaments.ts/mockBattleRoyale.ts plutôt
 * qu'importées : ces fichiers font des appels fetch() avec URL relative,
 * invalides côté Node (même contrainte que le fix du crash /matches/[id]
 * plus tôt dans ce chantier) — un module serveur ne doit dépendre que de
 * code sans fetch.
 */

import { prisma } from "@/lib/prisma";
import { estCertifie } from "@/lib/server/kyc";
import { saisonActuelle } from "@/lib/server/saisons";

const COMMISSION_PCT = 0.2;
const BAREME_PLACEMENT_BR = [10, 6, 5, 4, 3, 2, 1, 1];

/** Points de classement par place finale (bracket 1v1/Équipes) — même barème
 * que l'ancien pointsPourPlace() client (mockTournaments.ts), porté ici pour
 * un calcul server-side fiable. */
function pointsPourPlace(place: number, effectif: number): number {
  if (place === 1) return 100;
  if (place === 2) return 70;
  if (place <= 4) return 50;
  if (place <= 8) return 30;
  if (place <= Math.ceil(effectif / 2)) return 15;
  return 5;
}

/** Même barème pour la première moitié, mais les éliminés de la seconde
 * moitié reçoivent des points négatifs (plus sévère pour les tout premiers
 * éliminés) plutôt qu'un minimum symbolique — porté depuis l'ancien
 * pointsPourPlaceBR() client. */
function pointsPourPlaceBR(place: number, effectif: number): number {
  if (place === 1) return 100;
  if (place === 2) return 70;
  if (place <= 4) return 50;
  if (place <= 8) return 30;
  const moitie = Math.ceil(effectif / 2);
  if (place <= moitie) return 15;
  return Math.max(-20, -(place - moitie) * 2);
}

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

/** matchs joués + victoires par nom (pseudo ou nom d'équipe), calculés à
 * partir des matches réels d'un bracket (1v1/Équipes) — chaque match
 * terminé compte pour les deux participants, la victoire pour un seul. */
function progressionDepuisMatches(matches: { statut: string; joueur1: string | null; joueur2: string | null; score1: number | null; score2: number | null }[]): Map<string, { matchs: number; victoires: number }> {
  const parNom = new Map<string, { matchs: number; victoires: number }>();
  const ajouter = (nom: string | null, victoire: boolean) => {
    if (!nom) return;
    const entree = parNom.get(nom) ?? { matchs: 0, victoires: 0 };
    entree.matchs += 1;
    if (victoire) entree.victoires += 1;
    parNom.set(nom, entree);
  };
  for (const m of matches) {
    if (m.statut !== "termine" || !m.joueur1 || !m.joueur2) continue;
    const gagnant = (m.score1 ?? 0) > (m.score2 ?? 0) ? m.joueur1 : m.joueur2;
    ajouter(m.joueur1, gagnant === m.joueur1);
    ajouter(m.joueur2, gagnant === m.joueur2);
  }
  return parNom;
}

/** Même chose pour le Battle Royale : chaque manche jouée compte comme un
 * match pour chaque participant qui y a un résultat, la victoire pour celui
 * qui a fini 1er de la manche. */
function progressionDepuisManches(manches: { manches_br_resultats: { participant: string; placement: number }[] }[]): Map<string, { matchs: number; victoires: number }> {
  const parNom = new Map<string, { matchs: number; victoires: number }>();
  for (const manche of manches) {
    for (const r of manche.manches_br_resultats) {
      const entree = parNom.get(r.participant) ?? { matchs: 0, victoires: 0 };
      entree.matchs += 1;
      if (r.placement === 1) entree.victoires += 1;
      parNom.set(r.participant, entree);
    }
  }
  return parNom;
}

/** Résout la progression (matchs/victoires) et les points de classement par
 * nom vers de vrais profile_id, puis persiste : profiles.matchs_joues/
 * victoires (compteurs cumulés) et points_classement (cumulé par jeu).
 * Chaque membre d'une équipe reçoit le plein montant (contrairement au cash
 * prize, les points ne se "partagent" pas entre coéquipiers). */
async function appliquerProgressionEtPoints(
  tournoiId: string,
  jeuId: string,
  saisonId: string,
  estEquipe: boolean,
  progressionParNom: Map<string, { matchs: number; victoires: number }>,
  classement: string[],
  bareme: (place: number, effectif: number) => number,
): Promise<number> {
  const progressionParProfil = new Map<string, { matchs: number; victoires: number }>();
  for (const [nom, delta] of progressionParNom) {
    for (const profileId of await profileIdsPourNom(tournoiId, nom, estEquipe)) {
      const entree = progressionParProfil.get(profileId) ?? { matchs: 0, victoires: 0 };
      entree.matchs += delta.matchs;
      entree.victoires += delta.victoires;
      progressionParProfil.set(profileId, entree);
    }
  }
  for (const [profileId, delta] of progressionParProfil) {
    await prisma.profiles.update({
      where: { id: profileId },
      data: { matchs_joues: { increment: delta.matchs }, victoires: { increment: delta.victoires } },
    });
  }

  const pointsParProfil = new Map<string, number>();
  let pointsAttribuesTotal = 0;
  for (let i = 0; i < classement.length; i++) {
    const points = bareme(i + 1, classement.length);
    pointsAttribuesTotal += points;
    for (const profileId of await profileIdsPourNom(tournoiId, classement[i], estEquipe)) {
      pointsParProfil.set(profileId, (pointsParProfil.get(profileId) ?? 0) + points);
    }
  }
  for (const [profileId, points] of pointsParProfil) {
    await prisma.points_classement.upsert({
      where: { profile_id_jeu_id_saison_id: { profile_id: profileId, jeu_id: jeuId, saison_id: saisonId } },
      create: { profile_id: profileId, jeu_id: jeuId, saison_id: saisonId, points },
      update: { points: { increment: points }, updated_at: new Date() },
    });
  }

  return pointsAttribuesTotal;
}

export type GagnantCredite = { nom: string; profileIds: string[]; montantXof: number };
export type ResultatCloture = { gagnantsCredites: GagnantCredite[]; cashPrizeTotalXof: number; commissionXof: number; pointsAttribuesTotal: number };

/** Commission organisateur — créditée seulement si le tournoi était payant,
 * la commission activée par l'organisateur, ET son identité réellement
 * vérifiée (kyc_verifications validée, jamais un flag client — cf.
 * src/lib/server/kyc.ts). Auparavant créditée depuis le navigateur via
 * crediter() dans mockTournaments.ts : n'importe quel compte connecté
 * pouvait appeler /api/wallet/mouvements directement avec type "commission"
 * et un montant arbitraire, sans que ce chemin serveur n'existe pour le
 * vérifier. */
async function crediterCommissionCloture(tournoi: { id: string; titre: string; frais_xof: number; commission_activee: boolean; organisateur_id: string }, placesInscrites: number): Promise<number> {
  if (tournoi.frais_xof <= 0 || !tournoi.commission_activee) return 0;
  if (!(await estCertifie(tournoi.organisateur_id))) return 0;

  const commissionXof = Math.round(tournoi.frais_xof * placesInscrites * COMMISSION_PCT);
  if (commissionXof <= 0) return 0;

  await prisma.mouvements.create({
    data: { profile_id: tournoi.organisateur_id, type: "commission", libelle: `Commission · ${tournoi.titre}`, montant_xof: commissionXof, tournoi_id: tournoi.id },
  });
  return commissionXof;
}

/** Calcule le classement final et crédite directement le(s) compte(s)
 * gagnant(s) (mouvement `gain`, jamais un séquestre local) + la commission
 * organisateur si applicable — appelée une seule fois par
 * POST /api/tournois/[id]/terminer, avant que termine_le ne soit marqué de
 * façon à pouvoir encore lire les matches/manches réels. */
export async function verserCashPrizeCloture(tournoiId: string): Promise<ResultatCloture> {
  const tournoi = await prisma.tournois.findUnique({
    where: { id: tournoiId },
    include: { _count: { select: { inscriptions: true } }, repartition_cash_prize: { orderBy: { rang: "asc" } } },
  });
  if (!tournoi) return { gagnantsCredites: [], cashPrizeTotalXof: 0, commissionXof: 0, pointsAttribuesTotal: 0 };

  const commissionXof = await crediterCommissionCloture(tournoi, tournoi._count.inscriptions);

  const estEquipe = tournoi.type === "equipes" || (tournoi.type === "battle_royale" && tournoi.br_sous_type !== null && tournoi.br_sous_type !== "solo");
  const estBR = tournoi.type === "battle_royale";

  let classement: string[];
  let progressionParNom: Map<string, { matchs: number; victoires: number }>;
  if (estBR) {
    const manches = await prisma.manches_br.findMany({ where: { tournoi_id: tournoiId }, include: { manches_br_resultats: true } });
    classement = classementFinalBRServeur(manches);
    progressionParNom = progressionDepuisManches(manches);
  } else {
    const matches = await prisma.matches.findMany({ where: { tournoi_id: tournoiId } });
    classement = classementFinalBracketServeur(matches);
    progressionParNom = progressionDepuisMatches(matches);
  }

  // Points/matchs joués/victoires : indépendants du cash prize (un tournoi
  // gratuit ou sans répartition configurée fait quand même progresser les
  // joueurs), donc calculés avant tout early-return lié à l'argent.
  const pointsAttribuesTotal =
    classement.length > 0
      ? await appliquerProgressionEtPoints(
          tournoiId,
          tournoi.jeu_id,
          (await saisonActuelle()).id,
          estEquipe,
          progressionParNom,
          classement,
          estBR ? pointsPourPlaceBR : pointsPourPlace,
        )
      : 0;

  if (tournoi.repartition_cash_prize.length === 0) {
    return { gagnantsCredites: [], cashPrizeTotalXof: 0, commissionXof, pointsAttribuesTotal };
  }
  if (classement.length === 0) return { gagnantsCredites: [], cashPrizeTotalXof: 0, commissionXof, pointsAttribuesTotal };

  const cashPrizeTotalXof = cashPrizeVersable(tournoi, tournoi._count.inscriptions);
  if (cashPrizeTotalXof <= 0) return { gagnantsCredites: [], cashPrizeTotalXof: 0, commissionXof, pointsAttribuesTotal };

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

  return { gagnantsCredites, cashPrizeTotalXof, commissionXof, pointsAttribuesTotal };
}

/** Délai avant clôture automatique une fois le tournoi prêt (finale décidée
 * pour un bracket, nombre de manches attendu atteint pour un Battle
 * Royale) — laisse une petite marge si un score doit être corrigé juste
 * après (point 218, demandé explicitement : plus besoin de cliquer sur
 * "Clôturer", 1 à 2 minutes après avoir un vainqueur). */
const DELAI_CLOTURE_AUTO_MS = 2 * 60_000;

/** Vérifie si un tournoi est prêt à se clôturer tout seul et, si oui, le
 * fait — même logique "paresseuse" que la bascule de saison (saisons.ts) :
 * pas de tâche planifiée, appelée à la lecture depuis les routes GET les
 * plus consultées (fiche tournoi, matchs, manches BR). Réutilise le même
 * verrou atomique que la clôture manuelle (WHERE termine_le IS NULL) : si
 * cette fonction est appelée en parallèle par plusieurs requêtes (plusieurs
 * spectateurs qui rechargent au même instant), une seule verse le cash
 * prize. Ne fait rien pour un tournoi déjà terminé/annulé, ou dont la
 * finale n'est pas encore décidée depuis assez longtemps. */
export async function essaierClotureAutomatique(tournoiId: string): Promise<void> {
  const tournoi = await prisma.tournois.findUnique({ where: { id: tournoiId } });
  if (!tournoi || tournoi.termine_le || tournoi.annule_le) return;

  let pretDepuis: Date | undefined;

  if (tournoi.type === "battle_royale") {
    const derniere = await prisma.manches_br.findFirst({ where: { tournoi_id: tournoiId }, orderBy: { numero: "desc" } });
    const cible = tournoi.manches_prevues ?? 1;
    if (derniere && derniere.numero >= cible) pretDepuis = derniere.created_at;
  } else {
    const agrege = await prisma.matches.aggregate({ where: { tournoi_id: tournoiId }, _max: { round: true } });
    const totalRounds = agrege._max.round;
    if (totalRounds) {
      const finale = await prisma.matches.findUnique({
        where: { tournoi_id_round_position: { tournoi_id: tournoiId, round: totalRounds, position: 0 } },
      });
      if (finale?.statut === "termine" && finale.termine_le) pretDepuis = finale.termine_le;
    }
  }

  if (!pretDepuis || Date.now() - pretDepuis.getTime() < DELAI_CLOTURE_AUTO_MS) return;

  // Même verrou atomique que POST /api/tournois/[id]/terminer (clôture
  // manuelle, conservée pour un cas où l'organisateur voudrait clôturer
  // avant la fin du délai) : une seule requête gagne la course.
  const premiereCloture = await prisma.tournois.updateMany({
    where: { id: tournoiId, termine_le: null },
    data: { termine_le: new Date() },
  });
  if (premiereCloture.count > 0) await verserCashPrizeCloture(tournoiId);
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
