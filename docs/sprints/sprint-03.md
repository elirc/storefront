# Sprint 03 — Product Detail + Listing, Pagination, Sort, SEO

**Goal:** a real product-detail page (variant selection, gallery, price, metadata) and a listing that
paginates and sorts — the read surface a shopper actually browses, with dynamic SEO metadata per page.

> **Flaw 4 (request waterfall + N+1) is planted here.** See "Teaching placements" for the blind-spot
> comment. The ledger is author-private; nothing in the committed PR names the flaw.

## Scope

**In:**

- `app/(storefront)/product/[slug]/page.tsx` — server component: product, variants, images, category
  breadcrumb; a client `<VariantPicker>` island (selects variant → updates price + the S04
  add-to-cart target via URL/`useState`); `generateMetadata({ params })` producing title/description/
  Open Graph from the product; `generateStaticParams` for the top products.
- `app/(storefront)/products/page.tsx` grows into a **paginated, sortable** listing: reads
  `searchParams` (`?page=`, `?sort=price_asc|price_desc|newest`, `?category=`); a `Pagination`
  component (prev/next + page numbers) that updates the URL; a `SortSelect` client island that pushes
  `sort` to the URL. **The URL is the state.**
- `server/data/products.ts`: `listPaged({ skip, take, sort, categorySlug })` returning `{ items, total }`;
  `getBySlug(slug)`.
- `server/services/catalog.ts`: `getProductDetail(slug)`, `listCatalog({ page, sort, category })` with
  page-size + total-pages math.
- Tests: pagination math (page → skip/take, last-page clamping), sort mapping, `getProductDetail`
  view-model; a component test that `SortSelect` changing value updates the URL.

**Out:** full-text search + facets (S07), cart (S04), reviews (S08 — a placeholder count only).

## Teaching focus

Pagination and data-fetching patterns; **URL-as-state** (a filtered/sorted/paged listing is shareable
and back-button-correct); dynamic `generateMetadata` colocated with the page; `generateStaticParams`
and what "static vs dynamic" costs. And — taught *positively* here, harvested later — how a page's data
fetch can quietly become a **waterfall**.

## Commit narrative (sketch)

1. `feat(data): getBySlug + listPaged (skip/take/sort/total)`
2. `feat(service): product detail view-model + paginated catalog with page math`
3. `test(service): pagination + sort + last-page clamp`
4. `feat(ui): product detail page + VariantPicker island + gallery`
5. `feat(seo): generateMetadata + Open Graph + generateStaticParams for top products`
6. `feat(ui): listing pagination + SortSelect (URL as state)`     ← **flaw 4 planted here**
7. `test(component): SortSelect updates the URL; Pagination renders boundaries`
8. `docs: ADR-0004 URL-as-state for lists; concepts/pagination-and-metadata.md`

### How flaw 4 is planted (author-private context)

In commit 6, `products/page.tsx` fetches **sequentially**: `await getCategory(slug)` → then
`await listCatalog(...)` → then, mapping the results, it `await`s each product's primary image and live
stock **one at a time** inside the render (`for (const p of items) { p.image = await getPrimaryImage(p.id); p.inStock = await getStock(p.id) }`). It renders correctly and reads cleanly, so review misses it. The
detail page has the same sequential-await shape (product, then reviews-count, then related). The
commit body is honest and silent: *"Fetches the category, the page of products, and each card's image
and stock, then renders the grid."* No word is untrue; none says "waterfall."

## Teaching placements

- 📘 on `generateMetadata`: colocated per-page SEO; why it's a separate async export and how it dedupes
  the product fetch with the page via React `cache`.
- 📘 on `searchParams`: the URL is the source of truth for list state — deep-linkable, shareable,
  server-readable.
- 🔍 on `VariantPicker`: "the *picker* is the client island; the page around it stays a server
  component."
- **Flaw 4 blind-spot (planting):** a `[Reviewer]` 📘 **praises the clean RSC data-fetch and the
  colocated `generateMetadata`** — "nice: the page reads top-to-bottom like a data script, and metadata
  lives with the page it describes." It says **nothing** about the sequential per-card `await`s two
  lines below. 🔗 quietly notes "listing performance gets its own sprint (S13)" — foreshadowing without
  a hint.
- ⚠️ on `generateStaticParams`: static params for the top-N, dynamic for the long tail — and what that
  means for a price that changes.

## Debate

`[Reviewer]`: "Offset pagination (`?page=`) will drift and get slow deep in the catalog — use a cursor."
`[Author]`: cursors are correct for infinite feeds, but shoppers expect **numbered pages** they can
jump to and share, and page numbers need a `total` anyway; offset is the honest model for a browsable
catalog of this size. **Resolution (Author holds, with a debt noted):** keep offset for the browsable
listing; ADR-0004 records that **S13 revisits deep-page performance** and S07's search may use a
keyset/cursor where "page 400" isn't a use case. (Reviewer's point is logged, not dismissed.)

## Exercises

- Sort by `price_desc` and page to the end. Does the last page clamp, or 500 on an out-of-range offset?
  Write the test that pins the answer.
- Add `?category=` to a sorted, paged URL and share the link. Confirm it reproduces the exact view —
  that's what "URL as state" buys you.
- **(You'll want this in S13):** count the database queries a 24-item listing fires. Write it down.
  You'll compare against it when the performance sprint comes for this page.
