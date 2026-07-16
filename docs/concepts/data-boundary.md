# The Data-Access Boundary: Rows In, View-Models Out

**One-pager · seeded S02 · pairs with ADR-0003**

Storefront reads data through three layers: `server/data` → `server/services` → the UI. Each has one
job, and the value of the split is what it *stops* leaking.

```
Postgres ──▶ server/data (repository) ──▶ server/services (view-model) ──▶ app/ + components/ (RSC)
             Prisma rows, one query          plain DTOs: Money, url|null       renders a DTO, zero JS
             the ONLY @prisma/client          no Prisma shape crosses here      never sees a row
```

## Who does what

| Layer | Returns | Knows about | Must not |
|---|---|---|---|
| `server/data` (repository) | Prisma rows, shaped by the query (`include`, `orderBy`, `_count`) | Prisma, the schema | map to a UI shape, contain business rules |
| `server/services` | **view-model DTOs** (`Money`, primary image or `null`, `productCount`) | `data`, `lib` | import `next/*`, React, or a vendor SDK |
| `app/` + `components/` | rendered HTML (Server Components) | `services` (types + reads) | import `server/data`, touch Prisma |

## Why the middle layer earns its place

A Prisma row is *Prisma's* shape, and it leaks:

- **`Decimal` / raw cents** where the UI needs a `Money` it must never do float math on.
- **nullable joins** — `images: []`, a category with no products — that every call site would
  otherwise defend against.
- **`_count: { products }`** — a nested aggregate object that exists only because the query asked
  for it. The nav wants a number, not a shape.
- **column and relation names** — hand a row to the UI and those names become an implicit API. Rename
  a column, add a read replica, or swap the ORM, and now it's a UI change.

The service maps **once**, so the S03 detail page, S07 search results, and S05 checkout reuse one
product shape. In Storefront that map is a few explicit lines:

```ts
// server/services/catalog.ts (shape)
const cheapest = p.variants[0]!;                       // repo sorted variants by price asc
const priceVaries = new Set(p.variants.map(v => v.priceCents)).size > 1;
const primary = p.images.find(i => i.isPrimary) ?? p.images[0] ?? null;
return {
  id: p.id, slug: p.slug, name: p.name,
  price: money(cheapest.priceCents, cheapest.currency),  // cents → Money, once
  priceVaries,                                           // "From $X" is a service decision
  inStock: p.variants.some(v => v.stock > 0),
  image: primary ? { url: primary.url, alt: primary.alt } : null,  // nullable join → explicit null
};
```

## The rule that keeps it honest (ADR-0003)

> Map to a view-model at the service — **but don't pre-map fields no screen uses yet.** The DTO
> grows when a screen needs a field, not speculatively.

That's why variant `attributes` (size/color) live in the schema and seed from S02 but are **not** on
the S02 `ProductListItem`: S03's variant picker is the first screen that renders them. Deliberate,
not gold-plated.

## How it's enforced

- The **layering ESLint rule** fails `pnpm lint` if a component imports `server/data` or a service
  imports `next/*`/React/Prisma (ADR-0001).
- **`import 'server-only'`** makes the build fail if a Client Component pulls a service in.
- **Service unit tests** (`server/services/catalog.test.ts`) pin the map — the "from" price, the
  primary-image pick, the missing-image `null`, the flattened `productCount` — with zero database.

## Try it

1. Add a `compareAtPriceCents` to a variant to drive a "sale" badge. Which layers change? (Schema +
   seed + repository include + the service DTO + the card — the boundary makes the blast radius
   visible and small.)
2. Return the raw Prisma row from `listProducts` and render it in `ProductCard`. Watch what the
   component now has to know: `Decimal`, `images[0]?.url`, `_count`. That coupling is what the
   view-model buys back.
3. Rename `ProductImage.url` to `src` in the schema. With the view-model, how many UI files change?
   Without it?
