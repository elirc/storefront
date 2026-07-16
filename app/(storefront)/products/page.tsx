import type { Metadata } from "next";
import { listProducts } from "@/server/services/catalog";
import { ProductCard } from "@/components/storefront/product-card";

export const metadata: Metadata = {
  title: "Products",
  description: "Browse the Storefront catalog.",
};

// WHY: render per request, reading the live catalog from Postgres. This also keeps the DB out
// of `next build` — the build (locally and in CI) has no database, and a statically-prerendered
// page would try to query one. Caching / incremental revalidation is a deliberate S13 topic;
// the skeleton stays honestly dynamic.
export const dynamic = "force-dynamic";

// 📘 [Author] Look at the signature: this file is `async` and there is not a single
// `useState`, `useEffect`, or `onClick` in it. That makes it a **Server Component**. The
// `await` below runs on the server and its markup ships **zero JS** to the browser — the
// grid is HTML by the time it reaches the client. (See docs/concepts/rsc-vs-client.md.)
//
// LEARN: the read path is `page → server/services → server/data → Postgres`. The page calls
// the service *function directly* — it does NOT `fetch("/api/products")`. A Server Component
// fetching its own API would be a network round-trip to itself; the data is already here, on
// the server. (Exercise: add a GET /products route handler, then explain why the grid still
// must not use it.)
export default async function ProductsPage() {
  const products = await listProducts();

  // 🔍 [Reviewer] The empty state ships in THIS PR, not "later." A grid that only renders
  // when data happens to exist is half a feature: the first real deploy, a fresh database, or
  // a filtered view with no matches all land here. Empty (valid, zero results) is a different
  // component from error (something broke) — this is the former.
  if (products.length === 0) {
    return (
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
        <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
          <p className="font-medium text-foreground">No products yet</p>
          <p className="text-sm">Seed the catalog with `pnpm db:seed`, then refresh.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => (
          <li key={product.id}>
            <ProductCard product={product} />
          </li>
        ))}
      </ul>
    </section>
  );
}
