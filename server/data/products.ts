import "server-only";
import { prisma } from "@/server/data/client";

// 🔍 [Reviewer] The data layer — repositories — is the *only* place the app talks to Prisma.
// The ESLint boundaries rule (ADR-0001) is what makes "only" true: a service, a page, or a
// component that reaches past this layer for `@prisma/client` fails `pnpm lint`. Why bother?
// Because it keeps the database an implementation detail: swap Prisma, add a read replica, or
// cache a query, and the blast radius stops at `server/data`.
//
// A repository returns rows shaped by the query (Prisma types). It does NOT map to a
// view-model — that is the service's job (S02 makes the mapping layer explicit). Its only
// concern is "get the right rows, efficiently."

/**
 * All products with their variants, newest first. One query, variants joined in — NOT a
 * per-product follow-up query. (The sequential-await / N+1 shape is a real pitfall; keeping
 * the baseline honest here is what lets a later sprint teach it as a regression.)
 */
export function findProductsWithVariants() {
  return prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      variants: {
        orderBy: { priceCents: "asc" },
      },
    },
  });
}
