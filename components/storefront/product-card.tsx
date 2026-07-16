import Image from "next/image";
import Link from "next/link";
import { ImageOff } from "lucide-react";
import { formatMoney } from "@/lib/money";
import type { ProductListItem } from "@/server/services/catalog";
import { AddToCart } from "@/components/storefront/add-to-cart";

// 🔍 [Reviewer] A product card has no state, so it stays a Server Component — it renders on the
// server and ships zero JS. The only interactive part, <AddToCart>, is a "use client" leaf it
// hosts. The rule of thumb: make it a client component only if it holds state; this doesn't, so
// it doesn't. (See docs/concepts/rsc-vs-client.md.)
//
// It renders a view-model (`ProductListItem`), never a Prisma row — it imports only the *type*
// from the service, which the layering rule allows; importing `server/data` here would not be.
//
// `priority` is passed by the grid to the single LCP image (the first card). Everything else
// lazy-loads. See the ⚠️ below.
export function ProductCard({
  product,
  priority = false,
}: {
  product: ProductListItem;
  priority?: boolean;
}) {
  return (
    <article className="flex flex-col overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm">
      <Link
        href={`/product/${product.slug}`}
        className="group relative block aspect-square overflow-hidden bg-muted"
        aria-label={product.name}
      >
        {product.image ? (
          // ⚠️ [Author] `next/image` done right. `fill` makes the image cover its box; `sizes`
          // tells the browser how wide the image renders at each breakpoint (the grid is 1/2/3/4
          // columns), so on a phone it downloads a phone-sized image instead of a desktop one —
          // a missing `sizes` is a real bandwidth bug. `alt` is the product's real name (from the
          // DB), never the filename. Only the LCP card gets `priority`; the rest lazy-load.
          <Image
            src={product.image.url}
            alt={product.image.alt}
            fill
            sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            priority={priority}
            className="object-cover transition-transform duration-200 group-hover:scale-105"
          />
        ) : (
          // A product with no images falls back to a calm placeholder, not a broken <img>. The
          // seed ships one such product on purpose so this path is exercised (and tested).
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <ImageOff className="size-8" aria-hidden="true" />
            <span className="sr-only">No image available</span>
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col justify-between gap-4 p-4">
        <div className="space-y-1">
          <h3 className="font-medium leading-tight">
            <Link href={`/product/${product.slug}`} className="hover:underline">
              {product.name}
            </Link>
          </h3>
          {/* WHY: formatMoney is the single edge where cents becomes a string — the UI never does
              arithmetic on the value, it just formats the Money it was handed. "From" appears only
              when variants disagree on price (priceVaries), i.e. there's a real range. */}
          <p className="text-sm text-muted-foreground">
            <span className="sr-only">Price: </span>
            {product.priceVaries ? `From ${formatMoney(product.price)}` : formatMoney(product.price)}
          </p>
        </div>
        <AddToCart inStock={product.inStock} />
      </div>
    </article>
  );
}
