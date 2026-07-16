import "server-only";
import { PrismaClient } from "@prisma/client";

// The Prisma client singleton. In dev, Next's hot-reload re-evaluates modules, which would
// otherwise open a new pool of DB connections on every edit — so we stash one instance on
// `globalThis` and reuse it. In production a single module instance is created once.
//
// This file, and everything else under `server/data`, is the ONLY layer permitted to import
// `@prisma/client` (enforced by the ESLint boundaries rule). `import 'server-only'` is the
// second guard: if a Client Component ever pulls this in, the build fails loudly instead of
// shipping a database client — and your connection string — to the browser.

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
