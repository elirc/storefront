import "server-only";
import { money, type Money } from "@/lib/money";
import { findProductsWithVariants } from "@/server/data/products";

// ⚠️ [Author] `import 'server-only'` at the top, and it matters. A service is server code —
// it reads the database (through `server/data`) and may one day read secrets. If a Client
// Component imports this module, `server-only` makes the BUILD fail with a clear message
// instead of silently bundling server code (and its data access) into the browser. That is
// one of the two guards on the client↔server seam; the ESLint boundaries rule is the other.
// (Exercise: import this from a `"use client"` file and read which guard fires first.)
//
// The service is also where Prisma rows become a **view-model** the UI can render: plain,
// serializable, `Money` instead of a raw cents integer. The UI never sees a Prisma row — so
// it never depends on a nullable join or a column name. In S01 the mapping is tiny; the
// boundary is the point. NOTE the layering rule forbids `next/*`, React, and Prisma in here.

/** The shape a product list renders from. Serializable; no Prisma leakage. */
export interface ProductListItem {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  /** Lowest variant price — the "from $X" a multi-variant product shows. */
  readonly price: Money;
  /** True if any variant has stock; drives the (disabled, S04) add-to-cart affordance. */
  readonly inStock: boolean;
}

export async function listProducts(): Promise<ProductListItem[]> {
  const products = await findProductsWithVariants();

  return products
    .filter((p) => p.variants.length > 0)
    .map((p) => {
      // Variants come back sorted by priceCents asc, so the first is the cheapest.
      const cheapest = p.variants[0]!;
      return {
        id: p.id,
        slug: p.slug,
        name: p.name,
        // WHY: money crosses the boundary as a `Money` value, built once from the DB's
        // integer cents. The UI formats it with `formatMoney`; it never does math on it.
        price: money(cheapest.priceCents, cheapest.currency as Money["currency"]),
        inStock: p.variants.some((v) => v.stock > 0),
      };
    });
}
