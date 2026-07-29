import { PrismaClient } from "@prisma/client";
import { loadDotEnv } from "./load-dotenv.js";

loadDotEnv();

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/**
 * Shared Prisma client for demo/simulations against Supabase.
 * Prefer DIRECT_URL for one-shot scripts; DATABASE_URL (pooler) for long-lived servers.
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
