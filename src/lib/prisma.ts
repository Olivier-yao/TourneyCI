import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/** Instance unique du client Prisma, réutilisée entre les rechargements à
 * chaud de Next.js en dev (sinon chaque hot-reload ouvrirait une nouvelle
 * connexion à la base). Réservé au code serveur (API routes, server
 * components) — jamais importé depuis un composant "use client".
 *
 * Base réelle = Supabase (projet V2 existant, 34 tables + RLS déjà
 * appliqué) — adaptateur Postgres standard, pas l'adaptateur Neon (le
 * schéma a été introspecté depuis Supabase, pas créé sur Neon). DATABASE_URL
 * doit pointer vers le pooler Supabase (port 6543 "Transaction pooler"),
 * pas la connexion directe (5432, souvent injoignable en IPv4).
 *
 * En production, DATABASE_URL n'est pas définie : l'intégration Vercel x
 * Supabase fournit déjà la même chaîne sous POSTGRES_PRISMA_URL — on
 * retombe dessus plutôt que de dupliquer une variable sensible. */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Le pooler Supabase est joignable en TLS mais son certificat n'est pas
// vérifiable par la chaîne de confiance par défaut de Node — sslmode=require
// dans l'URL est désormais interprété comme verify-full par pg-connection-
// string, d'où l'échec "self-signed certificate in certificate chain" en
// prod. Passer ssl: { rejectUnauthorized: false } à côté ne suffit PAS : pg
// reparse connectionString et son sslmode l'écrase (voir
// ConnectionParameters dans node_modules/pg/lib/connection-parameters.js,
// le résultat du parsing prime toujours sur la config explicite). Il faut
// donc forcer sslmode=no-verify directement dans l'URL.
function connexionSansVerificationTls(url: string | undefined): string | undefined {
  if (!url) return url;
  const u = new URL(url);
  u.searchParams.set("sslmode", "no-verify");
  return u.toString();
}

const adapter = new PrismaPg({
  connectionString: connexionSansVerificationTls(process.env.DATABASE_URL ?? process.env.POSTGRES_PRISMA_URL),
});

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
