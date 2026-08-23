import { describe, expect, it } from "vitest";
import { formatDuTournoi, formaterDateLabel, formaterHeureCheckin, formatCompteARebours, formaterTempsRelatif } from "./tournoiFormat";

describe("formatDuTournoi", () => {
  it("1v1 sans BO", () => {
    expect(formatDuTournoi({ type: "1v1", placesTotal: 8 })).toBe("1v1");
  });

  it("1v1 avec BO", () => {
    expect(formatDuTournoi({ type: "1v1", placesTotal: 8, manchesParMatch: 3 })).toBe("1v1 · BO3");
  });

  it("équipes avec taille et mode libre", () => {
    expect(formatDuTournoi({ type: "equipes", placesTotal: 16, equipeSousType: "duo", modeEquipe: "libre" })).toBe("Équipes · Duo · libre");
  });

  it("équipes sans sous-type", () => {
    expect(formatDuTournoi({ type: "equipes", placesTotal: 16 })).toBe("Équipes · Équipes");
  });

  it("battle royale inclut le nombre de joueurs", () => {
    expect(formatDuTournoi({ type: "battle_royale", placesTotal: 60 })).toBe("Battle Royale · 60 joueurs");
  });
});

describe("formaterDateLabel", () => {
  it("inclut le jour de semaine, le quantième, le mois et l'heure GMT", () => {
    // 2026-08-21T18:00:00Z est un vendredi.
    const ts = Date.UTC(2026, 7, 21, 18, 0);
    expect(formaterDateLabel(ts)).toBe("Vendredi 21 août · 18h00 GMT");
  });

  it("les minutes à un chiffre sont paddées", () => {
    const ts = Date.UTC(2026, 0, 5, 9, 5);
    expect(formaterDateLabel(ts)).toContain("09h05");
  });
});

describe("formaterHeureCheckin", () => {
  it("affiche l'heure quand c'est dans le futur", () => {
    const futur = Date.now() + 60_000;
    expect(formaterHeureCheckin(futur)).toMatch(/^\d{2}h\d{2}$/);
  });

  it("affiche Terminé une fois l'heure passée", () => {
    const passe = Date.now() - 60_000;
    expect(formaterHeureCheckin(passe)).toBe("Terminé");
  });
});

describe("formatCompteARebours", () => {
  it("format MM:SS en dessous d'une heure", () => {
    expect(formatCompteARebours(90_000)).toBe("01:30");
  });

  it("format HH:MM:SS au dessus d'une heure", () => {
    expect(formatCompteARebours(3_661_000)).toBe("01:01:01");
  });

  it("ne descend jamais sous zéro pour une valeur négative", () => {
    expect(formatCompteARebours(-5000)).toBe("00:00");
  });

  it("arrondit à la seconde la plus proche", () => {
    expect(formatCompteARebours(59_600)).toBe("01:00");
  });
});

describe("formaterTempsRelatif", () => {
  it("à l'instant pour moins d'une minute", () => {
    expect(formaterTempsRelatif(Date.now() - 10_000)).toBe("À l'instant");
  });

  it("en minutes pour moins d'une heure", () => {
    expect(formaterTempsRelatif(Date.now() - 5 * 60_000)).toBe("Il y a 5 min");
  });

  it("en heures pour moins d'un jour", () => {
    expect(formaterTempsRelatif(Date.now() - 3 * 3_600_000)).toBe("Il y a 3 h");
  });

  it("hier pour un jour à deux jours", () => {
    expect(formaterTempsRelatif(Date.now() - 30 * 3_600_000)).toBe("Hier");
  });

  it("en jours au delà de deux jours", () => {
    expect(formaterTempsRelatif(Date.now() - 5 * 86_400_000)).toBe("Il y a 5 j");
  });
});
