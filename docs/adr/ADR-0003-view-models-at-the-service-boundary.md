# ADR-0003: View-Models at the Service Boundary

- **Status:** Accepted
- **Date:** 2026-07-15
- **Deciders:** [Author], [Reviewer]

## Context

S01 installed the layering rule: `server/data` is the only layer that touches Prisma, and
`server/services` sits between it and the UI. S02 is the first sprint with enough shape to ask the
question the skeleton deferred: **what type crosses the service→UI boundary?**

A Prisma row is convenient — it is right there in the repository result — but it is *Prisma's*
shape, and that shape leaks:

- a `Decimal` where the UI wants a `Money` (and must never do float math on a price);
- nullable joins (`images: []`, a variant with no rows) the component would have to defend against
  everywhere it renders;
- a `_count: { products: number }` nested object that exists only because we asked Prisma to
  aggregate;
- column names and relation names that become an implicit API every screen depends on, so renaming
  a column or swapping the ORM is now a UI change.

The catalog now has products, variants, images, and categories, rendered by a `ProductCard`, a
`ProductGrid`, and a `CategoryNav`. If those components read raw rows, every one of the leaks above
becomes their problem.

## Decision

**The service maps repository rows to view-model DTOs; nothing Prisma-shaped crosses the service
boundary.** Concretely, `server/services/catalog.ts` returns:

- `ProductListItem` — `{ id, slug, name, price: Money, priceVaries, inStock, image | null }`. The
  cents integer becomes a `Money` once, here; the primary image is resolved to `{ url, alt }` or an
  explicit `null`; "does this product show a price *range*" is decided here (`priceVaries`), not in
  the card.
- `CategoryView` — `{ slug, name, productCount }`. Prisma's `_count.products` is flattened to a
  plain number; the nav never learns how the count was computed.

The view-model is a plain, serializable value: no `Decimal`, no nullable join to guard, no `_count`,
no column names. Map once in the service and the S03 detail page, the S07 search results, and the
S05 checkout can reuse one product shape.

**Introduces no new dependency** — a view-model is a plain TypeScript interface.

### The debate, and its narrow resolution

`[Reviewer]` pushed back: *the row is already there — return it and let the component pick fields;
a mapping layer is a cost you pay on every field the UI ever adds.* The point is fair, and it set
the boundary of the decision:

> Keep the view-model, **but do not pre-map fields no screen uses yet.** The DTO grows when a
> screen needs a field, not speculatively.

So `attributes` (the variant size/color JSON) is in the schema and the seed from S02, because S03's
variant picker needs it — but it is **not** on the S02 `ProductListItem`, because no S02 screen
renders it. The boundary is honest, not gold-plated. (This is one of the ≥3 places across the
course where the Reviewer's challenge changes the shape of the answer.)

## Consequences

- **Easier:** components depend on a small, stable, serializable shape. Money is a `Money` at the
  edge, so the browser never does arithmetic on a price (ADR-0002). A nullable image is `null`, once,
  in the service — the card renders a placeholder instead of every call site writing `?? []`. Swap
  the ORM or cache a query and the blast radius stops at `server/data` + the service map.
- **Harder / must-not:** you cannot hand a raw Prisma row to a component to "save a map." The type
  of `listProducts()` is the contract; widening it to leak a Prisma field is the smell this ADR
  names. A new field on a card means: add it to the DTO and map it — deliberately, in one place.
- **Guarded by:** the layering ESLint rule (a component importing `server/data` fails `pnpm lint`),
  `import 'server-only'` on the service, and the service unit tests that pin the mapping
  (`server/services/catalog.test.ts`). One-pager: `docs/concepts/data-boundary.md`.

## Rejected alternatives

- **Return Prisma rows; let components pick fields.** (The Reviewer's opening position.) Cheapest
  today, and it couples every screen to the ORM's shape — the `Decimal`, the nullable join, the
  `_count`, the column names. The leak this whole layering course is about would move *into the UI*.
  Rejected, but its valid core is kept as the "don't pre-map" resolution above.
- **A shared mapper library / auto-mapper.** Reflection-based mapping hides exactly the boundary we
  want visible and readable. The map is a few explicit lines in the service; that is the feature.
- **Map in the component (a `toViewModel` in the card).** Puts server-shape knowledge back in the
  browser layer and re-does the work per render site. The service is the one place that already
  knows the row shape; the map belongs there.
