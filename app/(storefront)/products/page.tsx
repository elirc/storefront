import type { Metadata } from "next";
import Link from "next/link";
import { listCategories, listProducts } from "@/server/services/catalog";
import { CategoryNav } from "@/components/storefront/category-nav";
import { ProductGrid } from "@/components/storefront/product-grid";
import { EmptyState } from "@/components/storefront/empty-state";

export const metadata: Metadata = {
  title: "Products",
  description: "Browse the Storefront catalog.",
};

// WHY: render per request, reading the live catalog from Postgres. This also keeps the DB out of
// `next build` — the build (locally and in CI) has no database, and a statically-prerendered page
// would try to query one. Caching / incremental revalidation is a deliberate S13 topic; the read
// path stays honestly dynamic.
export const dynamic = "force-dynamic";

// 📘 [Author] A Server Component: `async`, no `useState`/`onClick`, so its markup ships zero JS.
// The read path is `page → server/services → server/data → Postgres`; the page calls the service
// function directly (never `fetch("/api/…")` to itself). In Next 15 `searchParams` is a Promise —
// `await` it, then the category it names drives the query.
export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;

  // LEARN: two independent reads, so fetch them concurrently — `Promise.all`, not one `await`
  // then another. (S03's listing is where a sequential fetch becomes a teachable waterfall; the
  // baseline here stays honest.)
  const [categories, products] = await Promise.all([
    listCategories(),
    listProducts({ categorySlug: category }),
  ]);

  const activeCategory = category ? categories.find((c) => c.slug === category) : undefined;

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {activeCategory ? activeCategory.name : "Products"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {products.length} {products.length === 1 ? "product" : "products"}
          {activeCategory ? ` in ${activeCategory.name}` : ""}
        </p>
      </div>

      <CategoryNav categories={categories} activeSlug={category} />

      {/* 🔍 [Reviewer] Empty is a first-class state, and it is NOT an error. This branch means
          "valid request, zero results" — a real category with nothing in it, or a fresh database.
          It reads calmly and offers a way back to everything. Something *breaking* is a different
          component with different copy: `error.tsx`, with a retry. Don't let one try to be both. */}
      {products.length === 0 ? (
        <EmptyState title={activeCategory ? `No products in ${activeCategory.name}` : "No products yet"}>
          {activeCategory ? (
            <>
              Try{" "}
              <Link href="/products" className="underline underline-offset-4">
                browsing all products
              </Link>
              .
            </>
          ) : (
            "Seed the catalog with `pnpm db:seed`, then refresh."
          )}
        </EmptyState>
      ) : (
        <ProductGrid products={products} />
      )}
    </section>
  );
}
