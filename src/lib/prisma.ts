import { PrismaClient } from "@/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

/** Instance unique du client Prisma, réutilisée entre les rechargements à
 * chaud de Next.js en dev (sinon chaque hot-reload ouvrirait une nouvelle
 * connexion à la base). Réservé au code serveur (API routes, server
 * components) — jamais importé depuis un composant "use client".
 *
 * Adaptateur Neon (driver serverless, sur HTTP/WebSocket) plutôt qu'une
 * connexion TCP classique : adapté au déploiement Vercel de l'app (pas de
 * pool de connexions persistant à gérer). À adapter si la base finale n'est
 * pas Neon (ex. @prisma/adapter-pg pour un Postgres générique). */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
