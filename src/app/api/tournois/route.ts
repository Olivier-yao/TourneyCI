import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  utilisateurConnecte,
  nonAuthentifie,
  versTournoiJSON,
  versTypeCompetition,
  synchroniserNomOrganisateur,
  INCLUDE_TOURNOI_LISTE,
} from "@/lib/server/tournois";
import { peutCreerTournoiPayant } from "@/lib/server/moderation";
import { televerserImagePublique } from "@/lib/server/storage";

// Cache mémoire très court (par instance serverless, pas partagé entre
// instances — pas de Redis sur ce projet) pour la liste NON filtrée
// uniquement : c'est le cas le plus lourd (tous les tournois, 4 relations
// jointes) et le moins personnalisé (identique pour tout visiteur), appelée
// par les trois écrans de liste (accueil/en-direct/tournois) qui font
// ensuite leur propre filtrage côté client. Un test de charge a montré
// cette route saturer le pool de connexions Postgres au-delà de ~100
// requêtes concurrentes — quelques secondes de fraîcheur en moins changent
// peu ici (le rafraîchissement temps réel côté client reste la source de
// vérité pour les changements de statut), mais évitent qu'un pic de trafic
// ne déclenche autant de requêtes DB que de visiteurs simultanés.
const DUREE_CACHE_LISTE_MS = 5_000;
const LIMITE_TOURNOIS = 300;
let cacheListeNonFiltree: { expireA: number; donnees: unknown[] } | null = null;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const organisateurMoi = searchParams.get("organisateur") === "me";
  const enDirect = searchParams.get("enDirect") === "1";
  const nonFiltree = !organisateurMoi && !enDirect;

  if (nonFiltree && cacheListeNonFiltree && cacheListeNonFiltree.expireA > Date.now()) {
    return NextResponse.json({ success: true, data: cacheListeNonFiltree.donnees });
  }

  let organisateurId: string | undefined;
  if (organisateurMoi) {
    const user = await utilisateurConnecte();
    if (!user) return nonAuthentifie();
    organisateurId = user.id;
  }

  const tournois = await prisma.tournois.findMany({
    where: {
      ...(organisateurId ? { organisateur_id: organisateurId } : {}),
      // Même définition qu'estEnDirect() (calculée à la lecture) : en_direct
      // stocké à true, OU l'heure de début est passée sans que le tournoi
      // soit terminé/annulé.
      ...(enDirect
        ? { OR: [{ en_direct: true }, { termine_le: null, annule_le: null, debut_tournoi_le: { lte: new Date() } }] }
        : {}),
    },
    include: INCLUDE_TOURNOI_LISTE,
    orderBy: { created_at: "desc" },
    // Garde-fou : sans borne, cette requête charge l'intégralité de la table
    // (+ 4 relations jointes) à chaque appel — sans effet aujourd'hui (11
    // tournois au total) mais deviendrait un vrai problème de croissance non
    // bornée. Une vraie pagination avec UI dédiée (recherche/filtres des 3
    // écrans de liste) est un chantier plus large, pas fait ici — ceci
    // empêche seulement le pire cas (des milliers de lignes chargées d'un
    // coup) en attendant.
    take: LIMITE_TOURNOIS,
  });

  const donnees = tournois.map(versTournoiJSON);
  if (nonFiltree) cacheListeNonFiltree = { expireA: Date.now() + DUREE_CACHE_LISTE_MS, donnees };

  return NextResponse.json({ success: true, data: donnees });
}

export async function POST(request: Request) {
  const user = await utilisateurConnecte();
  if (!user) return nonAuthentifie();

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ success: false, error: "Requête invalide." }, { status: 400 });
  }

  const titre = typeof body.titre === "string" ? body.titre.trim() : "";
  const jeuId = typeof body.jeuId === "string" ? body.jeuId : "";
  const type = body.type as "1v1" | "equipes" | "battle_royale";
  const modalite = body.modalite as "virtuel" | "presentiel";
  const placesTotal = Number(body.placesTotal);
  const debutTournoiTs = Number(body.debutTournoiTs);
  const checkinTs = Number(body.checkinTs);
  const reglement = typeof body.reglement === "string" ? body.reglement.trim() : "";

  if (!titre || !jeuId || !type || !modalite || !placesTotal || !debutTournoiTs || !checkinTs || !reglement) {
    return NextResponse.json({ success: false, error: "Champs obligatoires manquants." }, { status: 400 });
  }

  const jeu = await prisma.jeux.findUnique({ where: { id: jeuId } });
  if (!jeu) {
    return NextResponse.json({ success: false, error: "Jeu inconnu." }, { status: 400 });
  }

  let villeId: number | undefined;
  if (modalite === "presentiel") {
    const villeNom = typeof body.ville === "string" ? body.ville.trim() : "";
    if (!villeNom) {
      return NextResponse.json({ success: false, error: "Ville obligatoire pour un tournoi présentiel." }, { status: 400 });
    }
    const villeRow = await prisma.villes.findFirst({ where: { nom: villeNom } });
    if (!villeRow) {
      return NextResponse.json({ success: false, error: "Ville inconnue." }, { status: 400 });
    }
    villeId = villeRow.id;
  }

  const organisateurNom = typeof body.organisateurNom === "string" ? body.organisateurNom : "";
  if (organisateurNom) await synchroniserNomOrganisateur(user.id, organisateurNom);

  // Vérification serveur (pas seulement l'écran de création côté client,
  // contournable en appelant cette route directement) : un organisateur
  // suspendu ou banni ne peut pas créer de tournoi où de l'argent réel
  // circule — inscriptions payantes, ou cash prize financé de sa poche.
  const fraisXof = Number(body.fraisXof) || 0;
  const cashPrizeXof = Number(body.cashPrizeXof) || 0;
  const impliqueArgent = fraisXof > 0 || (body.financementCashPrize === "organisateur" && cashPrizeXof > 0);
  if (impliqueArgent && !(await peutCreerTournoiPayant(user.id))) {
    return NextResponse.json({ success: false, error: "Ton compte organisateur est suspendu ou banni : impossible de créer un tournoi impliquant de l'argent réel." }, { status: 403 });
  }

  const repartitionCashPrize: unknown = body.repartitionCashPrize;
  const repartitionValide = Array.isArray(repartitionCashPrize)
    ? repartitionCashPrize.filter(
        (r): r is { label: string; montantXof: number } =>
          typeof r?.label === "string" && Number.isFinite(Number(r?.montantXof)) && Number(r.montantXof) > 0,
      )
    : [];

  const banniereUrlBrute = typeof body.banniereUrl === "string" ? body.banniereUrl : undefined;
  const banniereUrl = banniereUrlBrute?.startsWith("data:")
    ? await televerserImagePublique(banniereUrlBrute, "tournois-bannieres", `${user.id}-${Date.now()}`)
    : banniereUrlBrute;

  const tournoi = await prisma.tournois.create({
    data: {
      jeu_id: jeuId,
      organisateur_id: user.id,
      titre,
      type: versTypeCompetition(type),
      modalite,
      br_sous_type: body.brSousType ?? undefined,
      equipe_sous_type: body.equipeSousType ?? undefined,
      mode_equipe: body.modeEquipe ?? undefined,
      ville_id: villeId,
      frais_xof: Number(body.fraisXof) || 0,
      financement_cash_prize: body.financementCashPrize === "organisateur" ? "organisateur" : "inscriptions",
      cash_prize_engage_xof: Number(body.cashPrizeXof) || 0,
      commission_activee: Boolean(body.commissionActivee),
      places_total: Math.max(1, Math.round(placesTotal)),
      manches_prevues: Number.isFinite(Number(body.manchesPrevues)) && body.manchesPrevues ? Math.max(1, Math.round(Number(body.manchesPrevues))) : undefined,
      manches_par_match: Number.isFinite(Number(body.manchesParMatch)) && body.manchesParMatch ? Math.max(1, Math.round(Number(body.manchesParMatch))) : undefined,
      debut_inscriptions_le: body.debutInscriptionsTs ? new Date(Number(body.debutInscriptionsTs)) : undefined,
      fin_inscriptions_le: body.finInscriptionsTs ? new Date(Number(body.finInscriptionsTs)) : undefined,
      debut_tournoi_le: new Date(debutTournoiTs),
      checkin_le: new Date(checkinTs),
      reglement,
      informations: typeof body.informations === "string" ? body.informations.trim() || undefined : undefined,
      banniere_url: banniereUrl,
      symbole_id: typeof body.symboleId === "string" ? body.symboleId : undefined,
      repartition_cash_prize:
        repartitionValide.length > 0
          ? { create: repartitionValide.map((r, i) => ({ rang: i + 1, label: r.label, montant_xof: Math.round(r.montantXof) })) }
          : undefined,
    },
    include: INCLUDE_TOURNOI_LISTE,
  });

  // Évite qu'un tournoi fraîchement créé mette jusqu'à 5s (DUREE_CACHE_LISTE_MS)
  // à apparaître dans les listes pour son propre créateur.
  cacheListeNonFiltree = null;

  return NextResponse.json({ success: true, data: versTournoiJSON(tournoi) });
}
