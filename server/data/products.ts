import "server-only";
import { prisma } from "@/server/data/client";

// 🔍 [Reviewer] The data layer — repositories — is the *only* place the app talks to Prisma.
// The ESLint boundaries rule (ADR-0001) is what makes "only" true: a service, a page, or a
// component that reaches past this layer for `@prisma/client` fails `pnpm lint`. Why bother?
// Because it keeps the database an implementation detail: swap Prisma, add a read replica, or
// cache a query, and the blast radius stops at `server/data`.
//
// A repository returns rows shaped by the query (Prisma types). It does NOT map to a
// view-model — that is the service's job (ADR-0003). Its only concern is "get the right rows,
// efficiently."

/** Optional filters for a catalog listing. `categorySlug` scopes to one category's products. */
export interface ProductListFilter {
  categorySlug?: string;
}

/**
 * Products with their variants and images, newest first. One query — variants and images are
 * joined in, NOT fetched per-product in a follow-up loop. (The sequential-await / N+1 shape is a
 * real pitfall; keeping the baseline honest here is what lets a later sprint teach it as a
 * regression, S13.)
 *
 * `categorySlug` narrows to products linked to that category via the many-to-many relation; the
 * filter is pushed into SQL (`categories: { some: ... }`), not applied in JS after the fetch.
 */
export function findProductsWithVariants(filter: ProductListFilter = {}) {
  return prisma.product.findMany({
    where: filter.categorySlug
      ? { categories: { some: { slug: filter.categorySlug } } }
      : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      variants: { orderBy: { priceCents: "asc" } },
      // Primary first, then by position — so the service can pick a cover image deterministically.
      images: { orderBy: [{ isPrimary: "desc" }, { position: "asc" }] },
    },
  });
}
