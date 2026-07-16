import "server-only";
import { money, type Money } from "@/lib/money";
import { findProductsWithVariants, type ProductListFilter } from "@/server/data/products";
import { findCategoriesWithCounts } from "@/server/data/categories";

// ⚠️ [Author] `import 'server-only'` at the top, and it matters. A service is server code — it
// reads the database (through `server/data`) and may one day read secrets. If a Client Component
// imports this module, `server-only` makes the BUILD fail with a clear message instead of
// silently bundling server code (and its data access) into the browser. That is one of the two
// guards on the client↔server seam; the ESLint boundaries rule is the other.
//
// 📘 [Author] This is also where Prisma rows become **view-models** the UI can render (ADR-0003).
// The rule the boundary enforces: nothing Prisma-shaped crosses it. The UI never sees a `Decimal`,
// a nullable join, a `_count` object, or a column name — it sees a small, serializable DTO with a
// `Money` value, a primary image (or `null`), and the two booleans a card actually needs. Map
// once here and the S03 detail page, the S07 search results, and the S05 checkout can all reuse
// the shape. NOTE the layering rule forbids `next/*`, React, and Prisma in this file.
//
// 🔗 [Author] The "from $X" pricing computed here is the front of an arc: S03's detail page turns
// it into real variant selection, and S07 adds a price-range facet over the same variant prices.

/** A cover image, already reduced to the two fields the UI renders. */
export interface ProductImageView {
  readonly url: string;
  /** Descriptive alt text — never the filename. Rendered verbatim by `next/image`. */
  readonly alt: string;
}

/** The shape a product list renders from. Serializable; no Prisma leakage. */
export interface ProductListItem {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  /** Lowest variant price — the "from $X" a product with a price range shows. */
  readonly price: Money;
  /**
   * True when variants disagree on price, so the card should read "From $X" rather than a flat
   * price. A multi-variant product whose variants all cost the same is NOT a range.
   */
  readonly priceVaries: boolean;
  /** True if any variant has stock; drives the (disabled, S04) add-to-cart affordance. */
  readonly inStock: boolean;
  /** The primary image, or `null` — the card renders a graceful placeholder when null. */
  readonly image: ProductImageView | null;
}

/** A category as the nav renders it. `_count` is gone; `productCount` is a plain number. */
export interface CategoryView {
  readonly slug: string;
  readonly name: string;
  readonly productCount: number;
}

export async function listProducts(filter: ProductListFilter = {}): Promise<ProductListItem[]> {
  const products = await findProductsWithVariants(filter);

  return products
    .filter((p) => p.variants.length > 0)
    .map((p) => {
      // Variants come back sorted by priceCents asc, so the first is the cheapest.
      const cheapest = p.variants[0]!;
      // Distinct prices > 1 ⇒ a real range ⇒ show "From $X". Same-price variants show a flat price.
      const priceVaries = new Set(p.variants.map((v) => v.priceCents)).size > 1;
      // Pick the primary explicitly rather than trusting order — the query sorts primary-first,
      // but a product may have no primary flagged, or no images at all.
      const primary = p.images.find((img) => img.isPrimary) ?? p.images[0] ?? null;

      return {
        id: p.id,
        slug: p.slug,
        name: p.name,
        // WHY: money crosses the boundary as a `Money` value, built once from the DB's integer
        // cents. The UI formats it with `formatMoney`; it never does math on it.
        price: money(cheapest.priceCents, cheapest.currency as Money["currency"]),
        priceVaries,
        inStock: p.variants.some((v) => v.stock > 0),
        image: primary ? { url: primary.url, alt: primary.alt } : null,
      };
    });
}

export async function listCategories(): Promise<CategoryView[]> {
  const categories = await findCategoriesWithCounts();
  // The only mapping that matters here: `_count.products` (a Prisma shape) becomes a flat
  // `productCount`. The nav never learns how the number was computed.
  return categories.map((c) => ({
    slug: c.slug,
    name: c.name,
    productCount: c._count.products,
  }));
}
