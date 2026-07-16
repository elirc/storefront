import Link from "next/link";
import { listProducts } from "@/server/services/catalog";
import { ProductGrid } from "@/components/storefront/product-grid";
import { Button } from "@/components/ui/button";

// Render per request against the live catalog (and keep the DB out of `next build`; see the
// note on /products). Caching is an explicit S13 topic.
export const dynamic = "force-dynamic";

// 📘 [Author] Home. Like every page in the App Router, it is a Server Component by default —
// it can be `async` and `await` a service directly. This one previews a few products, which
// means the home page is already exercising the full slice: service → data → Postgres → RSC.
export default async function HomePage() {
  const products = await listProducts();
  const featured = products.slice(0, 3);

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight">The walking skeleton is alive.</h1>
        <p className="max-w-2xl text-muted-foreground">
          A home page and a product grid, rendering real products from Postgres through the full
          layering — with the money type, the layering gate, loading and empty states, CI, and a
          Playwright smoke test all in place before the first feature.
        </p>
        <Button asChild>
          <Link href="/products">Browse all products</Link>
        </Button>
      </section>

      {featured.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-medium">Featured</h2>
          {/* Reuse the same server-composed grid the /products page uses — the LCP image gets
              `priority` for free, and there's one place that decides how a card grid looks. */}
          <ProductGrid products={featured} />
        </section>
      )}
    </div>
  );
}
