import { describe, expect, it } from "vitest";
import { formatXof } from "./formatXof";

// toLocaleString("fr-FR") sépare les milliers par une espace insécable fine
// (U+202F) — la typographie française correcte, pas une espace normale
// (U+0020) qu'on pourrait taper par erreur dans un test.
const ESPACE_FINE = " ";

describe("formatXof", () => {
  it("affiche Gratuit pour un montant nul", () => {
    expect(formatXof(0)).toBe("Gratuit");
  });

  it("formate un montant avec séparateur de milliers et devise", () => {
    expect(formatXof(2000)).toBe(`2${ESPACE_FINE}000 CFA`);
  });

  it("formate un grand montant", () => {
    expect(formatXof(1_500_000)).toBe(`1${ESPACE_FINE}500${ESPACE_FINE}000 CFA`);
  });
});
