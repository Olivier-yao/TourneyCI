import { prisma } from "@/lib/prisma";

/** Résout un pseudo (profiles.pseudo, unique, insensible à la casse) vers
 * son profile_id — utilisé partout où le client n'envoie qu'un pseudo
 * (identité d'un membre d'équipe) plutôt qu'un id. */
export async function profileIdDepuisPseudo(pseudo: string): Promise<string | undefined> {
  const profil = await prisma.profiles.findFirst({ where: { pseudo: { equals: pseudo.trim(), mode: "insensitive" } } });
  return profil?.id;
}

/** Résout un TAG (profiles.tag, dérivé du pseudo) vers son profile_id —
 * utilisé pour l'invitation d'un joueur par TAG (point 192), désormais un
 * vrai lookup cross-compte au lieu du registre de démo mono-appareil. */
export async function profileIdDepuisTag(tag: string): Promise<string | undefined> {
  const cible = tag.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_|_$/g, "");
  if (!cible) return undefined;
  const profil = await prisma.profiles.findFirst({ where: { tag: cible } });
  return profil?.id;
}

/** Résolution groupée id -> pseudo, pour traduire une ligne membres/chef
 * (profile_id) vers le format pseudo attendu côté UI en une seule requête. */
export async function pseudosDepuisIds(ids: string[]): Promise<Map<string, string>> {
  const uniques = Array.from(new Set(ids));
  if (uniques.length === 0) return new Map();
  const profils = await prisma.profiles.findMany({ where: { id: { in: uniques } }, select: { id: true, pseudo: true } });
  return new Map(profils.map((p) => [p.id, p.pseudo]));
}

/** Résolution groupée pseudo -> photo de profil, pour les écrans qui
 * affichent des joueurs identifiés par leur pseudo (matches, bracket) sans
 * relation directe vers profiles. Les entrées sans photo (ou sans profil,
 * ex. nom d'équipe pour les tournois Équipes) sont simplement absentes de
 * la map. */
export async function photosDepuisPseudos(pseudos: (string | null | undefined)[]): Promise<Map<string, string>> {
  const uniques = Array.from(new Set(pseudos.filter((p): p is string => Boolean(p))));
  if (uniques.length === 0) return new Map();
  const profils = await prisma.profiles.findMany({ where: { pseudo: { in: uniques } }, select: { pseudo: true, photo_url: true } });
  const paires = profils.filter((p): p is { pseudo: string; photo_url: string } => Boolean(p.photo_url));
  return new Map(paires.map((p) => [p.pseudo, p.photo_url]));
}
