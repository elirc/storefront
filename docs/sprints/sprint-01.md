# Sprint 01 — Walking Skeleton

**Goal:** the thinnest possible end-to-end slice — a home page and a product-list page rendering real
products from Postgres through the full layering — with every quality gate already armed. Nothing is
mocked that a later sprint will make real; everything conventional (the `Money` type, the layering
rule, loading/empty states, CI, a Playwright smoke test) is present before any feature is.

## Scope

**In:**

- Next.js 15 App Router + TS (strict) scaffold; Tailwind + shadcn/ui initialized; pnpm workspace.
- Postgres via docker-compose; Prisma with a **minimal** schema: `Product` + `ProductVariant`
  (name, slug, `priceCents Int`, `currency`, `stock Int`). One migration. `db/prisma/seed.ts` with a
  handful of demo products.
- The layering skeleton with **all layers present but thin**: `server/data/products.ts` (the only
  Prisma importer), `server/services/catalog.ts` (`listProducts()`), `lib/money.ts` (`Money`,
  `formatMoney`, the branded `Cents`).
- Two Server Components: `app/(storefront)/page.tsx` (home) and
  `app/(storefront)/products/page.tsx` (grid), plus `loading.tsx` (skeletons) and an explicit empty
  state. One `<AddToCart>` is a **disabled** client-component stub that says "cart lands in S04".
- **The layering fitness rule:** `eslint-plugin-boundaries` config + `import 'server-only'` in server
  barrels, wired into `pnpm lint`. One deliberately-failing boundary violation is demoed in a commit
  body (client importing `server/data`), then removed — the RED→GREEN of the gate itself.
- **The money fitness test:** a Vitest source-scan that fails on float money math under `server/`.
- CI (`.github/workflows/ci.yml`): typecheck, lint, unit test, build, and a **Playwright smoke**
  (`/` and `/products` render, a product name is visible) against the Postgres service container.
- `.env.example` (all mock/test values), scripts (`db:migrate`, `db:seed`, `test`, `test:e2e`).

**Out:** cart (S04 — the button is a labeled stub), product detail (S03), auth (S11), payments (S05).

## Teaching focus

The walking skeleton as a place to **install conventions before features**. The layering rule as an
*executable* fitness function, not a diagram. RSC data-fetching (an `async` server component that
`await`s a service). Money as integer minor units from line one. Why a page's loading and empty states
ship in the same PR as its happy path.

## Commit narrative (sketch)

1. `chore: scaffold Next 15 App Router + TS strict + Tailwind + shadcn` — the frame; `next build`
   green; no features.
2. `chore(ci): pnpm + typecheck/lint/test/build/e2e workflow, docs-only safe` — the gate exists before
   the code it guards.
3. `feat(lib): Money in minor units + formatMoney + money source-scan fitness test` — the type and the
   test that defends it.
4. `feat(db): Product + ProductVariant schema, migration, seed`
5. `feat(server): products repository + catalog service (server-only)` — the data→service boundary.
6. `chore(lint): layering boundaries rule (RED demo → GREEN)` — commit body shows the violation
   failing lint, then the fix; the gate is proven, not asserted.
7. `feat(ui): home + product grid (RSC) with loading + empty states; AddToCart stub`
8. `test(e2e): Playwright smoke — home and grid render a seeded product`
9. `docs: ADR-0001 layering & RSC boundary, ADR-0002 money; concepts/rsc-vs-client, money-in-minor-units`

## Teaching placements

- 📘 on `products/page.tsx`: "this file is `async` and has no `useState` — it's a Server Component; its
  markup ships **zero JS**." (← `concepts/rsc-vs-client.md`)
- 📘 on `lib/money.ts`: integer minor units and the branded `Cents`; a raw `number` can't be a price.
- 🔍 on `server/data/products.ts`: "the *only* file allowed to `import '@prisma/client'` — the boundary
  rule is why."
- ⚠️ on `catalog.ts`: `import 'server-only'` — what breaks if a client component imports this, and how
  the build tells you.
- 🔗 the layering ESLint config ← ADR-0001: "architecture you can fail, like Atlas's dependency tests —
  but for the browser↔server seam."
- 🔍 on the empty state: "a grid that only renders with data is half a feature; the empty state ships
  in this PR, not later."

## Debate

`[Reviewer]`: "Five folders (`data`/`services`/`actions`/`ports`/`adapters`) for two tables is
ceremony. It's a Next app — put the Prisma call in the page's `async` body and move on." `[Author]`
defends: the boundary is cheapest to install on day one and it's the spine of the course — S05's Stripe
adapter, S10's object store, S12's atomic inventory all snap onto `ports/`, and the client↔server leak
that the boundary prevents is a top-3 Next.js bug. **Resolution (Reviewer wins a concession):** collapse
`actions/` into `services/` *for now* — there are no writes yet — and split it out the moment S04
introduces the first mutation. Recorded in ADR-0001: *layers earn their folder when they have a second
occupant.*

## Exercises

- Add a `GET /products` route handler that returns the same data the grid renders. Then explain why the
  **grid itself** must not use it (what does a server component calling its own API cost?).
- Make a client component import `server/data/products.ts`. Read the build error. Which guard caught it
  — `server-only` or the ESLint rule? (Trick: both can; find out which fires first.)
- Break `formatMoney` to use `parseFloat`. Watch the money source-scan fitness test go RED and name the
  file.

## As built in this repository

The Sprint 01 commit (`88f0017`) delivered the skeleton the playbook describes; Sprint 02 then grew
it, so today's files show the Sprint 02 shape. Pieces that are still recognisably Sprint 01:
`lib/money.ts` (`money`, `formatMoney`, branded `Cents`, plus `allocate`), `server/data/client.ts`
(the `globalThis` Prisma singleton), the money fitness scan in `test/fitness/no-float-money.test.ts`,
the disabled `components/storefront/add-to-cart.tsx` stub, and `e2e/smoke.spec.ts` (home to products,
a seeded "Aurora Desk Lamp" at `$59.00`, the disabled add-to-cart).

### Check yourself

1. **Goal:** prove the money scan is not vacuous.
   **Check:** `test/fitness/no-float-money.test.ts:51-54` fails if `server/` has no source files;
   rename `server/` temporarily and watch "finds source files to scan" go red.
2. **Goal:** see why the products page is dynamic.
   **Check:** remove `export const dynamic = "force-dynamic"` (`app/(storefront)/products/page.tsx:17`)
   and run `pnpm build` without a database; the build now tries to prerender the page and query
   Postgres.
