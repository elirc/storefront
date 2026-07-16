import { describe, it, expect, vi, beforeEach } from "vitest";
import { listProducts, listCategories } from "@/server/services/catalog";
import { findProductsWithVariants } from "@/server/data/products";
import { findCategoriesWithCounts } from "@/server/data/categories";

// 🔍 [Reviewer] These tests never touch a database. The repositories are the service's "port"
// to Postgres; we mock them and feed hand-built rows, then assert the *mapping* — the exact
// contract ADR-0003 says the service owns: cents → Money, "from" pricing, primary-image pick,
// the missing-image fallback, and flattening `_count` to a plain number. Pure, fast, on-save.
vi.mock("@/server/data/products", () => ({ findProductsWithVariants: vi.fn() }));
vi.mock("@/server/data/categories", () => ({ findCategoriesWithCounts: vi.fn() }));

type ProductRows = Awaited<ReturnType<typeof findProductsWithVariants>>;
type CategoryRows = Awaited<ReturnType<typeof findCategoriesWithCounts>>;

// Minimal row builders. We only populate the fields the service reads; the casts keep the test
// terse without re-declaring every Prisma column (createdAt/updatedAt/description/…).
function variant(priceCents: number, stock = 10) {
  return { priceCents, currency: "USD", stock };
}
function image(url: string, alt: string, isPrimary: boolean, position: number) {
  return { url, alt, isPrimary, position };
}
function product(over: {
  id?: string;
  slug?: string;
  name?: string;
  variants: ReturnType<typeof variant>[];
  images?: ReturnType<typeof image>[];
}) {
  return {
    id: over.id ?? "p1",
    slug: over.slug ?? "a-product",
    name: over.name ?? "A Product",
    variants: over.variants,
    images: over.images ?? [],
  };
}
function mockProducts(rows: ReturnType<typeof product>[]) {
  vi.mocked(findProductsWithVariants).mockResolvedValue(rows as unknown as ProductRows);
}

beforeEach(() => vi.clearAllMocks());

describe("listProducts — price mapping", () => {
  it("shows a flat price (priceVaries=false) when every variant costs the same", async () => {
    mockProducts([product({ variants: [variant(5900), variant(5900)] })]);
    const [item] = await listProducts();
    expect(item!.price.amountCents).toBe(5900);
    expect(item!.priceVaries).toBe(false);
  });

  it('shows the cheapest as the "from" price (priceVaries=true) for a real range', async () => {
    // Repository returns variants sorted priceCents asc; the cheapest is first.
    mockProducts([product({ variants: [variant(1200), variant(3900)] })]);
    const [item] = await listProducts();
    expect(item!.price.amountCents).toBe(1200);
    expect(item!.priceVaries).toBe(true);
  });

  it("carries the variant currency into the Money value", async () => {
    mockProducts([product({ variants: [variant(1000)] })]);
    const [item] = await listProducts();
    expect(item!.price.currency).toBe("USD");
  });
});

describe("listProducts — images", () => {
  it("returns null image when the product has no images (graceful fallback)", async () => {
    mockProducts([product({ variants: [variant(1000)], images: [] })]);
    const [item] = await listProducts();
    expect(item!.image).toBeNull();
  });

  it("picks the flagged primary image, not merely the first row", async () => {
    mockProducts([
      product({
        variants: [variant(1000)],
        images: [
          image("/images/products/placeholder-02.png", "Second", false, 1),
          image("/images/products/placeholder-01.png", "Cover", true, 0),
        ],
      }),
    ]);
    const [item] = await listProducts();
    expect(item!.image).toEqual({ url: "/images/products/placeholder-01.png", alt: "Cover" });
  });

  it("falls back to the first image when none is flagged primary", async () => {
    mockProducts([
      product({
        variants: [variant(1000)],
        images: [image("/images/products/placeholder-05.png", "Only", false, 0)],
      }),
    ]);
    const [item] = await listProducts();
    expect(item!.image!.alt).toBe("Only");
  });
});

describe("listProducts — stock and filtering", () => {
  it("marks inStock true when any variant has stock, false when all are zero", async () => {
    mockProducts([
      product({ id: "in", variants: [variant(1000, 0), variant(1000, 3)] }),
      product({ id: "out", variants: [variant(1000, 0)] }),
    ]);
    const [a, b] = await listProducts();
    expect(a!.inStock).toBe(true);
    expect(b!.inStock).toBe(false);
  });

  it("drops products with zero variants (nothing buyable, no price to show)", async () => {
    mockProducts([product({ id: "empty", variants: [] })]);
    expect(await listProducts()).toEqual([]);
  });

  it("passes the category filter straight through to the repository", async () => {
    mockProducts([]);
    await listProducts({ categorySlug: "audio" });
    expect(findProductsWithVariants).toHaveBeenCalledWith({ categorySlug: "audio" });
  });
});

describe("listCategories", () => {
  it("flattens Prisma's _count into a plain productCount (no _count leaks past the service)", async () => {
    vi.mocked(findCategoriesWithCounts).mockResolvedValue([
      { slug: "audio", name: "Audio", _count: { products: 4 } },
      { slug: "bags", name: "Bags", _count: { products: 3 } },
    ] as unknown as CategoryRows);

    const cats = await listCategories();
    expect(cats).toEqual([
      { slug: "audio", name: "Audio", productCount: 4 },
      { slug: "bags", name: "Bags", productCount: 3 },
    ]);
    expect(cats[0]).not.toHaveProperty("_count");
  });
});
