# Storefront — a Full-Stack E-Commerce Platform, Built as a Curriculum

Storefront is a **production-shaped e-commerce application**: a customer surface (browse, search,
cart, checkout, orders, reviews) and a seller **admin** surface (product CRUD, inventory, orders,
image management), over one Next.js codebase and one Postgres database.

It is also — and primarily — a **teaching repository**. The product is real, but the way it was
built is the point: **15 sprints, each shipped as one GitHub Pull Request** engineered as a chapter
of a course that takes a junior engineer toward mid/senior level in **full-stack TypeScript and
modern React** — the CRUD-web-dev skills a backend-heavy course leaves out.

> **Course 9** in the git-connected upskilling series. Predecessors include JS/TS courses (GitJira,
> Tracer, Harbor, Pulse) and the .NET course **Atlas**. Storefront is a deliberate swing back to the
> **frontend and real full-stack integration** — the teaching weight is on the browser and the seams
> between browser, server, database, and payment vendor.

## The thesis

> **The server owns the truth; the client owns the experience — and the seam between them is where
> real apps break.**

A junior can make a page look right. The jump to mid/senior is making it *stay* right under load, on
the error path, across a page refresh, and when money is involved. Every decision in Storefront
serves that seam:

- **Prices, totals, tax, and stock are computed on the server, from the database.** A number that
  arrives from the browser is display state, never authority. (This is a lesson the course *plants a
  violation of* early and harvests later — see the flaw ledger.)
- **A layering rule is enforced in CI from Sprint 1.** Client components cannot import the database;
  the domain/service layer cannot import `next/*` or React. Break the layering and the build fails —
  architecture you can *fail*, not a diagram in a wiki.
- **A real Stripe integration** (Checkout in test mode, the webhook→order-fulfillment loop, signature
  verification, idempotent handling) treats "money moves through another company's system, at least
  once, sometimes twice" as a first-class requirement.
- **The frontend is taught at depth**: RSC-vs-client boundaries, forms + Zod validation, optimistic
  UI with rollback, loading/error/empty states, TanStack Query caching, faceted search, accessibility
  and focus management, Core Web Vitals.

There is a **UI, and it is the subject** — unlike a backend course where the API contract is the
face, here the rendered experience, its states, and its data-fetching are the product.

## What Storefront does

| Surface | Highlights |
|---|---|
| Catalog | Products, variants, categories, inventory; RSC-rendered grids with real loading/empty/error states |
| Product detail | Variant selection, gallery, reviews, SEO metadata, structured data |
| Search | Postgres full-text search, faceted filters (category, price, attributes), sort, URL-as-state |
| Cart | Client state + server-persisted cart; optimistic add/update with rollback |
| Checkout | Stripe Checkout (test mode); server-computed line items; the webhook→fulfillment loop |
| Orders | Customer order history + detail; idempotent fulfillment; guest lookup |
| Reviews | Rating + text UGC, aggregate scores, moderation basics, correct escaping |
| Admin | Seller dashboard: product/variant CRUD, inventory, order management, image upload/variants |
| Accounts | Auth, sessions, customer/seller roles, protected routes and actions |
| Platform | Performance (caching, Core Web Vitals), a11y, i18n scaffolding, SEO, deep E2E |

We clone the *functionality and shape* of a modern storefront — never a specific brand, its copy, or
its assets.

## Stack

- **Next.js 15 (App Router) + TypeScript 5.7**, React 19 — Server Components by default, Client
  Components at the interactive edges.
- **PostgreSQL 16 + Prisma 6** — Postgres for dev (docker-compose) and CI (service container).
- **Stripe (TEST MODE)** for Checkout + webhooks. **MinIO / filesystem adapter** for object storage.
  **Every external dependency is wired to test-mode or a local mock**, so `pnpm test` and CI run with
  **zero real credentials** — exactly the discipline Atlas used to mock its payment vendor. A
  bring-your-own-keys path for real use is documented, but the course build never needs it.
- **Vitest** + **Testing Library** (unit/component), **Playwright** (E2E).
- **TailwindCSS + shadcn/ui**, **Zod + react-hook-form** (forms/validation), **TanStack Query**
  (client data-fetching, optimistic UI).
- **pnpm**, **Node 20+**.

```
app/
  (storefront)/        customer surface: home, products, product/[slug], cart, checkout, orders, account
  (admin)/admin/       seller surface: dashboard, products, inventory, orders, images
  api/                 route handlers — stripe/webhook lives here
components/            ui/ (shadcn primitives), storefront/, admin/ — presentation only
lib/                   framework-free shared kit: money, env, cn, zod schemas, formatting
server/
  data/                repositories — the ONLY place Prisma is imported
  services/            domain/business logic — no React, no next/*, no Prisma directly
  actions/             "use server" server actions (the write path from the UI)
  ports/               interfaces: PaymentGateway, ObjectStore, Mailer, Clock, SearchIndex
  adapters/            implementations: Stripe, MinIO/fs, console mailer — and their fakes
db/prisma/             schema.prisma, migrations, seed.ts
e2e/                   Playwright specs + fixtures
test/                  Vitest setup, factories, fakes
docs/                  the course itself (see below)
```

## How to study this repo

Read **[CONTRIBUTING.md](CONTRIBUTING.md)** first for the per-sprint ritual. Then study each
sprint's **merged PR** in order: the stakeholder issue → the ordered teaching commits, one by one →
the inline persona review comments → the design-debate thread → the exercises. The playbooks in
[`docs/sprints/`](docs/sprints/) say what each sprint teaches; the ADRs in [`docs/adr/`](docs/adr/)
record *why* the code is shaped the way it is; the one-pagers in [`docs/concepts/`](docs/concepts/)
explain the ideas behind the code.

Milestones: **`v0.5.0`** (MVP — browse → cart → Stripe checkout → order — after Sprint 5) and
**`v1.0.0`** (the full product, after Sprint 15). Five flaws are deliberately planted in early
sprints and harvested later with failing-test-first arcs; the ledger is revealed at
`docs/sprints/flaw-ledger.md` after Sprint 15.

## State of this snapshot

This clone stops after **Sprint 02** (`git log`: bootstrap, `Sprint 01 — Walking Skeleton (#7)`,
`Sprint 02 — Product Catalog + Data Layer (#14)`). The table above and the directory tree describe
the **finished** course. What actually exists today:

| Exists now | Planned, not yet in the tree |
|---|---|
| `app/(storefront)/` home + `/products` (with `loading.tsx`, `error.tsx`) | product detail, cart, checkout, orders, account, `app/(admin)/`, `app/api/` |
| `server/data/` (`client.ts`, `products.ts`, `categories.ts`), `server/services/catalog.ts` | `server/actions/`, `server/ports/`, `server/adapters/` (the lint rule already names them) |
| `lib/money.ts`, `lib/cn.ts` | env/zod schema helpers |
| Prisma models `Product`, `ProductVariant`, `ProductImage`, `Category` (two migrations) | carts, orders, users, reviews |
| Vitest: `lib/money.test.ts`, `server/services/catalog.test.ts`, two component tests, the money fitness scan; Playwright: `e2e/smoke.spec.ts`, `e2e/catalog.spec.ts` | Stripe fake gateway, MinIO-backed uploads |

`.env.example`, `docker-compose.yml` and CI already carry Stripe and object-storage settings so they
match later sprints; nothing in the current code reads them. The seed (`db/prisma/seed.ts`) creates
catalog data only — no seller or orders yet.

## Reading the code that exists

- **Read path.** `app/(storefront)/products/page.tsx:33-36` fetches categories and products in
  parallel, `server/services/catalog.ts:54-80` maps rows to `ProductListItem` view-models, and
  `server/data/products.ts:28-40` runs one Prisma query with variants (cheapest first) and images
  (primary first) included.
- **Money.** `lib/money.ts:27-34` is the only constructor and rejects non-integers; `allocate`
  (`:64-90`) is largest-remainder splitting; `formatMoney` (`:95-100`) holds the single `/ 100`.
- **Guards.** `eslint.config.mjs` declares the layer table with `eslint-plugin-boundaries`;
  `import "server-only"` heads every file under `server/`; `test/fitness/no-float-money.test.ts`
  scans `server/` for `parseFloat`, `/ 100` and `.toFixed`.

## Exercises (current code)

1. **Goal:** feel the layering rule.
   **Check:** add `import { prisma } from "@/server/data/client"` to `components/storefront/product-card.tsx`;
   `pnpm lint` fails with a `boundaries/element-types` error for the `components` to `data` import.
2. **Goal:** trip the money scan.
   **Check:** add `const dollars = cents / 100;` to `server/services/catalog.ts`; `pnpm test -- --run`
   fails and the message names the file and line.
3. **Goal:** see a count mismatch.
   **Check:** create a product with no variants in a category; the category nav's count includes it
   (`_count.products`, `server/services/catalog.ts:89`) but the grid does not render it (`:58`).

## Review notes on the current code

- **Misleading copy for an unknown category.** `/products?category=does-not-exist` has no matching
  category, so the page falls into the "no category" branch and tells the visitor to run
  `pnpm db:seed` (`app/(storefront)/products/page.tsx:38,58-70`). `e2e/catalog.spec.ts:32-38` only
  matches `/No products/`, so it passes either way. A 404 or "unknown category" message would be honest.
- **Currency is trusted, not checked.** `currency as Money["currency"]` (`server/services/catalog.ts:74`)
  casts the DB string; `ProductVariant.currency` is a free `String` defaulting to `"USD"`, so a non-USD
  row would reach `formatMoney` unvalidated.
- **The money scan only watches `server/`.** `app/` and `components/` are not scanned
  (`test/fitness/no-float-money.test.ts:20`), and `* 0.01` or `Number(x)` arithmetic is not one of the
  forbidden shapes (`:23-27`).
- **CI's e2e job sets `OBJECT_STORE_DRIVER: s3`** with a MinIO endpoint but has no MinIO service yet;
  harmless today because nothing reads it, but it will fail confusingly in S10 if the service is not
  added back.

## Running Storefront

```bash
pnpm install
docker compose up -d                 # local Postgres + MinIO (object storage)
cp .env.example .env                  # test-mode / mock values only — no real keys needed
pnpm db:migrate && pnpm db:seed       # schema + demo catalog (categories, products, variants, images)
pnpm dev                              # http://localhost:3000 (storefront) and /admin (seller)
```

Payments in dev/CI use Stripe **test mode**; the webhook loop is exercised with the
`stripe listen` CLI locally, and with a signed-fake gateway in tests (no network, no secrets). To run
against your own Stripe test keys, follow the **Bring Your Own Keys** section in
[`docs/curriculum/SPEC.md`](docs/curriculum/SPEC.md).

Verify the whole app the way CI does:

```bash
pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm test:e2e
```

`pnpm lint` includes the **layering fitness rule** (client code cannot reach the database; services
cannot import `next/*`). It fails the build the same way a broken test does.
