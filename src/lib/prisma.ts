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
 * pas la connexion directe (5432, souvent injoignable en IPv4). */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
