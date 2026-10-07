# Sprint 02 — Product Catalog + Data Layer

**Goal:** turn the one-table skeleton into a real catalog — products with variants, categories, and
images — rendered as a responsive, accessible grid with honest loading/empty/error states, all through
the data→service→UI layering the skeleton installed.

## Scope

**In:**

- Prisma schema grows: `Category` (many-to-many with `Product`), `ProductImage` (ordered, one primary,
  URL for now — real upload is S10), variant `attributes Json` (size/color), `sku`. Migration + richer
  seed (a few categories, ~24 products, multiple variants and images each).
- `server/data`: `products.ts` (list with category filter + variant/image includes), `categories.ts`.
- `server/services/catalog.ts`: `listProducts({ categorySlug? })`, `listCategories()`; returns
  view-model DTOs (never raw Prisma rows past the service boundary) with `Money`, primary image, and a
  "from $X" price for multi-variant products.
- UI: `ProductCard` (server component — image via `next/image` with correct `sizes`, price via
  `formatMoney`, `alt` text), a responsive CSS-grid `ProductGrid`, a category nav, `loading.tsx`
  skeletons that match the card layout, `error.tsx` boundary with a retry, and an explicit empty state
  ("no products in this category").
- Component tests (Vitest + Testing Library): `ProductCard` renders name/price/alt and links to the
  (stub) detail route; grid renders N cards; empty state shows when the list is empty.

**Out:** pagination and sort (S03), product detail page (S03 — cards link to a placeholder), search
(S07), real image upload (S10 — images are seeded URLs).

## Teaching focus

The **data-access boundary** in practice: repositories return domain-shaped data, services map to
view-models, UI never sees a Prisma row. RSC composition (a server `ProductGrid` rendering server
`ProductCard`s — still zero JS). `next/image` done right (`sizes`, `priority` for the LCP image, `alt`
that isn't the filename). The three non-happy states as first-class deliverables.

## Commit narrative (sketch)

1. `feat(db): Category, ProductImage, variant attributes; migration + seed`
2. `feat(data): products + categories repositories with includes`
3. `feat(service): catalog view-models — Money, primary image, "from" pricing`
4. `test(service): catalog mapping — multi-variant "from" price, missing-image fallback`
5. `feat(ui): ProductCard + responsive ProductGrid + category nav`
6. `feat(ui): loading skeletons, error boundary, empty state`
7. `test(component): ProductCard + grid + empty state (Testing Library)`
8. `docs: ADR-0003 view-models at the service boundary; concepts/data-boundary.md`

## Teaching placements

- 📘 on `catalog.ts` mapping: "why the service returns a view-model, not the Prisma row — the UI
  shouldn't know about `_count` or a nullable join."
- 🔍 on `ProductCard`: "a card is a Server Component; the only reason to make it client is if it holds
  state — it doesn't, so it doesn't."
- ⚠️ on `next/image`: missing `sizes` → the browser downloads a desktop image on a phone; the LCP card
  gets `priority`, the rest lazy-load.
- ⚠️ on the empty state: distinguish **empty** (valid, zero results) from **error** (something broke) —
  they are different components with different copy.
- 🔗 the "from $X" pricing ← S03 detail (variant selection) and S07 (price-range facet).
- 🔍 on the skeleton: "the skeleton should match the card's box model, or the layout jumps on load
  (CLS) — accessibility and Core Web Vitals both live here."

## Debate

`[Reviewer]`: "The service returns fully-shaped view-models — that's a mapping layer you'll pay for on
every field the UI adds. Just return the Prisma rows and let the component pick fields." `[Author]`
defends: the row shape is Prisma's, and it leaks (`Decimal`, nullable joins, `_count`) — mapping once
in the service keeps `Money` and the boundary honest and means the S07 search results and the S05
checkout can reuse one product view-model. **Resolution (Author holds, narrowly):** keep the
view-model, but **don't pre-map fields no screen uses yet** — the DTO grows when a screen needs a
field, not speculatively. Recorded in ADR-0003.

## Exercises

- Add a "sale" badge driven by a `compareAtPriceCents` on the variant. Which layers change? (Data +
  service + card — the boundary makes the blast radius visible.)
- Render a product with **no** images. Does the card fall back gracefully, or throw? Write the test
  first.
- Make `ProductCard` a client component and measure the First Load JS delta on `/products`. Then revert
  and explain the number.

## As built in this repository

What the merged Sprint 02 code looks like, for checking the playbook against reality:

- Schema: `Category` (many-to-many `ProductCategories`), `ProductImage` (`position`, `isPrimary`),
  variant `sku` (unique) and `attributes Json` (`db/prisma/schema.prisma`); second migration
  `20260716022808_catalog_categories_images_attributes`.
- Repositories: `findProductsWithVariants` pushes the category filter into SQL with
  `categories: { some: { slug } }` (`server/data/products.ts:28-40`); `server/data/categories.ts`
  returns `_count.products`.
- Service: `listProducts` drops products with no variants, takes the first (cheapest) variant as the
  price, sets `priceVaries` from distinct prices, and picks the flagged primary image or the first one
  (`server/services/catalog.ts:54-80`). Ten service tests cover these rules
  (`server/services/catalog.test.ts:46-125`).
- UI: `ProductCard`/`ProductGrid` with tests (`components/storefront/product-card.test.tsx`,
  `product-grid.test.tsx`, including "only the first card's image is priority"), `loading.tsx`,
  `error.tsx`, `EmptyState`, and a disabled `AddToCart` client stub.
- E2E: `e2e/catalog.spec.ts` (alt text, "from" price, URL-driven category filter, empty state).

The exercise "render a product with no images" is already answered by
`catalog.test.ts:69` and `product-card.test.tsx:57`.

### Check yourself

1. **Goal:** confirm the filter runs in SQL.
   **Check:** with Prisma query logging enabled, `/products?category=lighting` issues one product query
   whose `WHERE` references the category relation, not a full-table read filtered in JavaScript.
2. **Goal:** spot the empty-vs-unknown gap.
   **Check:** `/products?category=does-not-exist` shows "No products yet" with seeding advice, the
   copy meant for an empty database (`app/(storefront)/products/page.tsx:58-70`). Decide whether this
   should be a 404 and write the e2e assertion that pins it.
3. **Goal:** reconcile counts.
   **Check:** a product with zero variants is counted in the nav (`_count.products`) but filtered out of
   the grid (`server/services/catalog.ts:58`); either filter it in the count query or show it as
   unavailable.
