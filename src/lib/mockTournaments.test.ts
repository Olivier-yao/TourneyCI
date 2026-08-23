import { describe, expect, it } from "vitest";
import {
  commissionEstimee,
  repartitionAutomatique,
  cashPrizeAffiche,
  cashPrizeEstEstime,
  inscriptionsFermees,
  tournoiComplet,
  clotureEffectiveInscriptions,
  capaciteLobbyMax,
  genreDuJeu,
  modeDuTournoi,
  COMMISSION_PCT,
} from "./mockTournaments";

const HEURE_MS = 3_600_000;

describe("commissionEstimee", () => {
  it("20% des frais collectés (frais × places)", () => {
    expect(commissionEstimee(1000, 10)).toBe(2000); // 1000*10*0.2
  });

  it("zéro pour un tournoi gratuit", () => {
    expect(commissionEstimee(0, 32)).toBe(0);
  });
});

describe("repartitionAutomatique", () => {
  it("un seul finaliste reçoit tout, libellé Vainqueur", () => {
    expect(repartitionAutomatique(10_000, 1)).toEqual([{ label: "Vainqueur", montantXof: 10_000 }]);
  });

  it("répartit en poids dégressifs 1/rang et somme exactement au montant net (pas de perte d'arrondi)", () => {
    const repartition = repartitionAutomatique(100_000, 3);
    expect(repartition.map((r) => r.label)).toEqual(["1er", "2e", "3e"]);
    const total = repartition.reduce((s, r) => s + r.montantXof, 0);
    expect(total).toBe(100_000);
    // Dégressif : chaque rang reçoit strictement moins que le précédent.
    expect(repartition[0].montantXof).toBeGreaterThan(repartition[1].montantXof);
    expect(repartition[1].montantXof).toBeGreaterThan(repartition[2].montantXof);
  });

  it("somme exacte même avec un montant qui ne se divise pas proprement", () => {
    const repartition = repartitionAutomatique(100_001, 7);
    const total = repartition.reduce((s, r) => s + r.montantXof, 0);
    expect(total).toBe(100_001);
  });

  it("plafonne à 20 finalistes et plancher à 1", () => {
    expect(repartitionAutomatique(1000, 50)).toHaveLength(20);
    expect(repartitionAutomatique(1000, 0)).toHaveLength(1);
    expect(repartitionAutomatique(1000, -5)).toHaveLength(1);
  });

  it("libellés au delà de la 3e place en \"Ne\"", () => {
    const repartition = repartitionAutomatique(10_000, 5);
    expect(repartition.map((r) => r.label)).toEqual(["1er", "2e", "3e", "4e", "5e"]);
  });
});

describe("cashPrizeAffiche / cashPrizeEstEstime", () => {
  const base = {
    fraisXof: 1000,
    placesInscrites: 5,
    placesTotal: 10,
    financementCashPrize: "inscriptions" as const,
    commissionActivee: false,
    cashPrizeXof: 0,
    finInscriptionsTs: undefined,
    debutTournoiTs: undefined,
    enDirect: false,
  };

  it("avant clôture : basé sur la capacité totale (placesTotal), pas les inscrits actuels", () => {
    expect(cashPrizeAffiche(base)).toBe(1000 * 10); // pas placesInscrites
    expect(cashPrizeEstEstime(base)).toBe(true);
  });

  it("après clôture (en direct) : basé sur les inscrits réels", () => {
    const clos = { ...base, enDirect: true };
    expect(cashPrizeAffiche(clos)).toBe(1000 * 5);
    expect(cashPrizeEstEstime(clos)).toBe(false);
  });

  it("commission activée réduit le cash prize affiché de COMMISSION_PCT", () => {
    const avecCommission = { ...base, enDirect: true, commissionActivee: true };
    const brut = 1000 * 5;
    expect(cashPrizeAffiche(avecCommission)).toBe(brut - Math.round(brut * COMMISSION_PCT));
  });

  it("financé par l'organisateur : montant fixe, jamais dérivé des frais", () => {
    const financeOrga = { ...base, financementCashPrize: "organisateur" as const, cashPrizeXof: 50_000, fraisXof: 0 };
    expect(cashPrizeAffiche(financeOrga)).toBe(50_000);
    expect(cashPrizeEstEstime(financeOrga)).toBe(false);
  });

  it("tournoi gratuit sans financement organisateur : aucun cash prize", () => {
    const gratuit = { ...base, fraisXof: 0, cashPrizeXof: 0 };
    expect(cashPrizeAffiche(gratuit)).toBe(0);
  });
});

describe("inscriptionsFermees / tournoiComplet / clotureEffectiveInscriptions", () => {
  it("tournoi complet même si l'heure de clôture n'est pas atteinte", () => {
    expect(tournoiComplet({ placesInscrites: 10, placesTotal: 10 })).toBe(true);
    expect(inscriptionsFermees({ placesInscrites: 10, placesTotal: 10, enDirect: false, finInscriptionsTs: undefined, debutTournoiTs: undefined })).toBe(true);
  });

  it("jamais complet avec placesTotal à zéro (évite une division dégénérée)", () => {
    expect(tournoiComplet({ placesInscrites: 0, placesTotal: 0 })).toBe(false);
  });

  it("un tournoi en direct a toujours ses inscriptions fermées", () => {
    expect(inscriptionsFermees({ placesInscrites: 1, placesTotal: 10, enDirect: true, finInscriptionsTs: undefined, debutTournoiTs: undefined })).toBe(true);
  });

  it("clôture explicite prioritaire sur la marge par défaut avant le début", () => {
    const debut = Date.now() + 10 * HEURE_MS;
    const finExplicite = debut - HEURE_MS;
    expect(clotureEffectiveInscriptions({ finInscriptionsTs: finExplicite, debutTournoiTs: debut })).toBe(finExplicite);
  });

  it("sans clôture explicite, marge par défaut avant le début du tournoi", () => {
    const debut = Date.now() + 10 * HEURE_MS;
    const cloture = clotureEffectiveInscriptions({ finInscriptionsTs: undefined, debutTournoiTs: debut });
    expect(cloture).toBeLessThan(debut);
    expect(cloture).toBeGreaterThan(debut - HEURE_MS); // marge de 12 min, largement sous 1h
  });

  it("undefined sans aucune date renseignée", () => {
    expect(clotureEffectiveInscriptions({ finInscriptionsTs: undefined, debutTournoiTs: undefined })).toBeUndefined();
  });

  it("inscriptions pas fermées avant l'heure de clôture", () => {
    const debut = Date.now() + 10 * HEURE_MS;
    expect(inscriptionsFermees({ placesInscrites: 1, placesTotal: 10, enDirect: false, finInscriptionsTs: undefined, debutTournoiTs: debut })).toBe(false);
  });
});

describe("capaciteLobbyMax", () => {
  it("retombe sur la capacité par défaut pour un jeu inconnu", () => {
    expect(capaciteLobbyMax("jeu-totalement-inconnu-xyz")).toBe(50);
  });
});

describe("genreDuJeu / modeDuTournoi", () => {
  it("undefined pour un id de jeu inconnu", () => {
    expect(genreDuJeu("jeu-inconnu")).toBeUndefined();
  });

  it("battle royale toujours en mode Battle Royale", () => {
    expect(modeDuTournoi({ type: "battle_royale", format: "" })).toBe("Battle Royale");
  });

  it("équipes toujours en mode Team", () => {
    expect(modeDuTournoi({ type: "equipes", format: "Équipes · Duo" })).toBe("Team");
  });
});
