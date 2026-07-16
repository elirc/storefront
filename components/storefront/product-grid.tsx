import type { ProductListItem } from "@/server/services/catalog";
import { ProductCard } from "@/components/storefront/product-card";

// 📘 [Author] Composition, all on the server. A server `ProductGrid` renders server
// `ProductCard`s — no `"use client"` anywhere in this subtree, so the whole grid is HTML by the
// time it reaches the browser (the interactive island, <AddToCart>, sits below the card and opts
// in for itself). This is what "Server Components compose" looks like in practice.
//
// The grid is a plain responsive CSS grid: 1 column on a phone, up to 4 on a wide screen. It also
// owns one performance decision — which image is the LCP. Only the first card gets `priority`;
// see the ⚠️ note. Layout classes are duplicated in `loading.tsx` on purpose, so the skeleton
// occupies the same boxes and the page doesn't jump when data arrives (CLS).
export function ProductGrid({ products }: { products: ProductListItem[] }) {
  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product, i) => (
        <li key={product.id}>
          {/* ⚠️ [Author] Exactly one `priority` image per page. Marking every card priority tells
              the browser "everything is the LCP", which defeats the point and hurts the metric it
              is meant to help. The first card is the above-the-fold candidate; the rest lazy-load. */}
          <ProductCard product={product} priority={i === 0} />
        </li>
      ))}
    </ul>
  );
}
