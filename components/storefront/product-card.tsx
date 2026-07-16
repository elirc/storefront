import Link from "next/link";
import { formatMoney } from "@/lib/money";
import type { ProductListItem } from "@/server/services/catalog";
import { AddToCart } from "@/components/storefront/add-to-cart";

// A product card. It has no state, so it stays a Server Component — it renders on the server
// and ships zero JS. The only interactive part, <AddToCart>, is a "use client" leaf it hosts.
//
// NOTE: this imports the `ProductListItem` *type* from the service. Importing a type from
// services into a component is allowed by the layering rule; importing `server/data` here
// would not be. The card renders a view-model, never a Prisma row.
//
// Images arrive in S02/S10 — for the skeleton, the card is text + price + the cart stub. The
// detail route (`/product/[slug]`) is built in S03; the link is here now so the shape is real.
export function ProductCard({ product }: { product: ProductListItem }) {
  return (
    <article className="flex flex-col justify-between rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
      <div className="space-y-1">
        <h3 className="font-medium leading-tight">
          <Link href={`/product/${product.slug}`} className="hover:underline">
            {product.name}
          </Link>
        </h3>
        {/* WHY: formatMoney is the single edge where cents becomes a string — the UI never
            does arithmetic on the value, it just formats the Money it was handed. */}
        <p className="text-sm text-muted-foreground">
          <span className="sr-only">Price: </span>
          {formatMoney(product.price)}
        </p>
      </div>
      <div className="mt-4">
        <AddToCart inStock={product.inStock} />
      </div>
    </article>
  );
}
