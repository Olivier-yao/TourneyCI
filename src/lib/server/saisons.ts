/**
 * Saisons de classement — remplace le texte fixe "Saison 3 : Éclipse" / "se
 * termine dans 18 jours" (mockProfil.ts) par de vraies dates en base. La
 * saison en cours est créée à la demande (aucune tâche planifiée requise) :
 * le premier visiteur qui arrive après la fin de la précédente en déclenche
 * automatiquement la suivante — auto-guérison, cohérent avec le reste du
 * projet (ex. auto-escalade des suspensions dans moderation.ts).
 */

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

const DUREE_SAISON_JOURS = 30;

/** Rotation de noms thématiques pour les saisons créées automatiquement —
 * évite un simple "Saison 4", "Saison 5"... sans renommage manuel requis. */
const NOMS_SAISON = ["Éclipse", "Zénith", "Aurore", "Tempête", "Nova", "Éclat", "Mirage", "Prisme", "Cyclone", "Odyssée"];

export type SaisonJSON = { id: string; numero: number; nom: string; debutLe: number; finLe: number };

function versSaisonJSON(s: { id: string; numero: number; nom: string; debut_le: Date; fin_le: Date }): SaisonJSON {
  return { id: s.id, numero: s.numero, nom: s.nom, debutLe: s.debut_le.getTime(), finLe: s.fin_le.getTime() };
}

async function creerSaisonSuivante(): Promise<SaisonJSON> {
  const derniere = await prisma.saisons.findFirst({ orderBy: { numero: "desc" } });
  const maintenant = new Date();
  const numero = (derniere?.numero ?? 0) + 1;
  // Enchaîne juste après la fin de la précédente (pas "maintenant") si on
  // rattrape un retard, pour ne jamais chevaucher deux saisons.
  const debut = derniere && derniere.fin_le > maintenant ? derniere.fin_le : (derniere?.fin_le ?? maintenant);
  const fin = new Date(debut.getTime() + DUREE_SAISON_JOURS * 24 * 60 * 60 * 1000);
  const nom = NOMS_SAISON[(numero - 1) % NOMS_SAISON.length];

  try {
    const nouvelle = await prisma.saisons.create({ data: { numero, nom, debut_le: debut, fin_le: fin } });
    return versSaisonJSON(nouvelle);
  } catch (err) {
    // Course entre deux requêtes concurrentes arrivant pile au changement de
    // saison : la contrainte unique sur `numero` rejette la seconde, qui n'a
    // qu'à relire celle que l'autre vient de créer.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const existante = await prisma.saisons.findFirst({ where: { numero } });
      if (existante) return versSaisonJSON(existante);
    }
    throw err;
  }
}

export async function saisonActuelle(): Promise<SaisonJSON> {
  const maintenant = new Date();
  const enCours = await prisma.saisons.findFirst({ where: { debut_le: { lte: maintenant }, fin_le: { gt: maintenant } }, orderBy: { numero: "desc" } });
  if (enCours) return versSaisonJSON(enCours);
  return creerSaisonSuivante();
}
