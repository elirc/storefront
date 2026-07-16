import "server-only";
import { prisma } from "@/server/data/client";

// The categories repository. Like `products.ts`, it lives in `server/data` — the only layer
// permitted to import `@prisma/client` — and returns Prisma-shaped rows for the service to map.
//
// 🔍 [Reviewer] Note the `_count`: asking Postgres to count each category's products in the same
// query is far cheaper than fetching the products just to `.length` them. But `_count` is a
// Prisma-ism — a nested object the UI has no business knowing about. The service flattens it to a
// plain `productCount` before it crosses the boundary (ADR-0003); the repository's job is only to
// get the number efficiently.

/** All categories, alphabetical, each with a count of how many products link to it. */
export function findCategoriesWithCounts() {
  return prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });
}
