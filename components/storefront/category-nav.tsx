import Link from "next/link";
import { cn } from "@/lib/cn";
import type { CategoryView } from "@/server/services/catalog";

// 📘 [Author] The category nav is a Server Component made of `<Link>`s — no `"use client"`, no
// `onClick`. Filtering is expressed as navigation: each pill is a link to `/products?category=…`,
// and the server page reads that `?category=` from `searchParams` and re-queries. The URL is the
// state, so a filtered view is shareable, bookmarkable, and back-button-correct — no client store
// needed. (S03 extends this same idea to sort and pagination; S07 to full facets.)
//
// The active category is known from the URL the page already read, passed down as `activeSlug`.
// `aria-current="page"` marks it for assistive tech, not just colour.
export function CategoryNav({
  categories,
  activeSlug,
}: {
  categories: CategoryView[];
  activeSlug?: string;
}) {
  const pill =
    "inline-flex items-center rounded-full border px-3 py-1 text-sm transition-colors hover:bg-accent hover:text-accent-foreground";
  const active = "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground";

  return (
    <nav aria-label="Product categories">
      <ul className="flex flex-wrap gap-2">
        <li>
          <Link
            href="/products"
            aria-current={activeSlug ? undefined : "page"}
            className={cn(pill, !activeSlug && active)}
          >
            All
          </Link>
        </li>
        {categories.map((c) => {
          const isActive = c.slug === activeSlug;
          return (
            <li key={c.slug}>
              <Link
                href={`/products?category=${c.slug}`}
                aria-current={isActive ? "page" : undefined}
                className={cn(pill, isActive && active)}
              >
                {c.name}
                <span className="ml-1.5 text-xs opacity-70">{c.productCount}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
