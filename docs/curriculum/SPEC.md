# Storefront — Product Spec & 15-Sprint Curriculum

**Version:** 1.0 · **Date:** 2026-07-15 · **Repo:** `elirc/storefront` · **Course:** 9 (frontend-first full-stack TS)

---

## 1. Purpose

Two goals; the second is the real one:

1. **Product:** a production-shaped e-commerce platform — a customer **storefront** (browse, search,
   cart, checkout, orders, reviews) and a seller **admin** (product CRUD, inventory, orders, image
   management) over one Next.js codebase. Functionality and shape only; never a specific brand or its
   assets.
2. **Learning:** every sprint is a GitHub PR engineered as a chapter of a **full-stack TypeScript /
   modern React** curriculum focused on the **frontend and the browser↔server↔vendor seams** — the
   CRUD-web-dev skills a backend-heavy course leaves out. One thesis:

> **The server owns the truth; the client owns the experience — and the seam between them is where
> real apps break.**

The product is the textbook. The PRs are the chapters. The layering fitness rule is the proctor.

## 2. Personas

| Persona | On the storefront / admin |
|---|---|
| **Shopper (guest)** | Browses, searches, adds to cart, checks out as guest; can look up an order by number + email |
| **Customer (account)** | The above + order history, saved details, writes reviews |
| **Seller** | Owns the admin: product/variant CRUD, inventory, image management, order fulfillment view |
| **Support/Ops** | Read-mostly admin: find an order, read the fulfillment/webhook trail |

Roles are authorization scopes (S11). The storefront is anonymous-friendly until checkout; the admin
is seller-only.

## 3. Domain model (summary)

Money everywhere is **integer minor units** in a `Money` value (see §7 and
`docs/concepts/money-in-minor-units.md`).

- **Product / ProductVariant** — a product has one or more variants (size/color); the **price and
  stock live on the variant**. Variants carry SKU, attributes (JSON), `priceCents`, `currency`.
- **Category** — products belong to categories (many-to-many); categories drive faceted search and
  breadcrumbs.
- **ProductImage** — ordered images per product; a primary image; stored in the object store, served
  via `next/image`. Variants (thumbnail/card/detail) generated on upload (S10).
- **InventoryItem / stock** — per-variant stock; adjustments are auditable; decrements are atomic and
  transactional (the oversell-race lesson, S12).
- **Cart / CartLine** — a server-persisted cart keyed by a cart cookie (guest) or account; lines
  reference a variant + quantity. **Prices are re-read from the catalog at read time**, not trusted
  from the client (the trust-boundary lesson; a violation is planted S04, harvested S09).
- **Order / OrderLine / Payment** — created by **webhook-driven fulfillment** after Stripe Checkout
  succeeds; line prices are *snapshotted* from the server-computed session, stock is decremented, an
  order number is issued. Fulfillment is idempotent (the webhook-idempotency lesson; planted S05,
  harvested S06).
- **Review** — rating (1–5) + text per product per customer; aggregate score cached on the product;
  UGC is escaped by default (React) and never rendered via `dangerouslySetInnerHTML`.
- **Account / Session / Role** — auth (S11); `customer` vs `seller` roles gate the admin.
- **ProcessedWebhookEvent** — a dedupe table (`stripe_event_id` unique) introduced at the S06 harvest
  to make fulfillment idempotent.

## 4. Frontend & data-fetching conventions

- **Server Components by default.** A component is a **Client Component** (`"use client"`) only when it
  needs state, effects, event handlers, or browser APIs. Interactive islands (cart drawer, add-to-cart,
  filters, forms) are client; everything else renders on the server and never ships to the browser. See
  `docs/concepts/rsc-vs-client.md`.
- **Reads:** server components fetch through `server/services` (which read through `server/data`).
  Client components that need live/optimistic data use **TanStack Query** against a small set of route
  handlers or server actions. **No `fetch` to our own API from a server component** — call the service
  directly.
- **Writes:** mutations are **server actions** (`"use server"`) for form/UI writes, or **route
  handlers** for machine/webhook endpoints. A form action reads like a checklist: `validate (zod) →
  authorize → mutate (service) → revalidate`.
- **URL is state** for lists: pagination, sort, filters, and search live in `searchParams`, so a
  filtered listing is shareable and back-button-correct. Client filter UI updates the URL; the server
  component reads it.
- **Every list/detail has three non-happy states**: `loading.tsx` (skeletons), `error.tsx` (boundary +
  retry), and an explicit **empty** state in the component. "It works when there's data" is half a
  feature.
- **Money is never a float in the UI.** Format once, at the edge, via `formatMoney(cents, currency)`.
- **Images** go through `next/image` with correct `sizes`; the LCP image on a page is not lazy.

## 5. Repository / folder structure

```
app/
  (storefront)/
    layout.tsx  page.tsx                      home
    products/   page.tsx  loading.tsx  error.tsx     listing (search/sort/filter via searchParams)
    product/[slug]/ page.tsx  loading.tsx      product detail (generateMetadata)
    cart/       page.tsx
    checkout/   page.tsx  success/page.tsx
    orders/     page.tsx  [number]/page.tsx
    account/    ...
  (admin)/admin/
    layout.tsx  page.tsx                       seller dashboard
    products/   ...                            product/variant CRUD (forms)
    inventory/  ...
    orders/     ...
    images/     ...
  api/
    stripe/webhook/route.ts                    the ONLY payment ingress
    cart/route.ts                              TanStack Query read/mutate endpoints (where used)
  layout.tsx  globals.css
components/
  ui/                                          shadcn primitives (button, input, dialog, ...)
  storefront/                                  ProductCard, CartDrawer, AddToCart, Facets, ...
  admin/                                       ProductForm, InventoryTable, ...
lib/                                           framework-free shared kit
  money.ts  env.ts  cn.ts  format.ts  schemas/ (zod)  slug.ts
server/
  data/                                        repositories — the ONLY place @prisma/client is imported
    client.ts  products.ts  cart.ts  orders.ts  inventory.ts  reviews.ts
  services/                                    business logic — no next/*, no React, no Prisma
    catalog.ts  cart.ts  checkout.ts  orders.ts  pricing.ts  inventory.ts  search.ts
  actions/                                     "use server" actions (UI write path)
  ports/                                       PaymentGateway  ObjectStore  Mailer  Clock  SearchIndex
  adapters/                                    StripeGateway + FakeGateway, S3/FsObjectStore, ConsoleMailer
db/prisma/
  schema.prisma  migrations/  seed.ts
e2e/                                           Playwright specs + fixtures (browse→checkout, admin CRUD)
test/                                          vitest.setup.ts  factories/  fakes/
docs/                                          curriculum, adr, sprints, concepts
```

### The layering rule (CI-enforced from S01)

Enforced by **`eslint-plugin-boundaries`** plus `import 'server-only'` in server barrels. Allowed
import directions:

| Layer (path) | May import |
|---|---|
| `lib/**` (shared) | nothing internal (leaf) |
| `server/ports/**` | `lib` |
| `server/data/**` | `lib`, `ports` — **the only layer allowed to import `@prisma/client`** |
| `server/services/**` | `lib`, `ports`, `data` — **must not import `next/*`, React, or a vendor SDK** |
| `server/adapters/**` | `lib`, `ports` — implement ports; may import a vendor SDK (Stripe, S3) |
| `server/actions/**` | `lib`, `services`, `ports` |
| `app/**`, `components/**` (ui) | `lib`, `services` (server components), `actions`, `ports` (types); **never `data`, `adapters`, or a vendor SDK; client components import no `server/**`** |

The rule is a **fitness function**: violate it and `pnpm lint` (hence CI) fails, exactly like a broken
test. It is never weakened to pass a sprint — if it fights the design, the design changes, recorded in
an ADR.

## 6. Stack & pinned versions

Runtime: **Node 20.11+ LTS** (22 LTS also supported); package manager **pnpm 9**. CI runs Node 20.

| Area | Package | Version (pinned in `package.json`) |
|---|---|---|
| Framework | `next` | `15.1.x` |
| UI runtime | `react`, `react-dom` | `19.0.0` |
| Language | `typescript` | `5.7.x` (strict, `noUncheckedIndexedAccess`) |
| ORM | `prisma`, `@prisma/client` | `6.2.x` |
| Database | PostgreSQL | `16` (docker-compose / CI service) |
| Payments | `stripe` (server), `@stripe/stripe-js` | `17.5.x` / `5.5.x` — **test mode only** |
| Client data | `@tanstack/react-query` | `5.64.x` |
| Validation | `zod` | `3.24.x` |
| Forms | `react-hook-form`, `@hookform/resolvers` | `7.54.x` / `3.10.x` |
| Styling | `tailwindcss`, `postcss`, `autoprefixer` | `3.4.x` |
| Components | shadcn/ui (via `shadcn@2` CLI), `@radix-ui/*`, `lucide-react` | latest at scaffold |
| Client store | `zustand` | `5.0.x` (cart UI store; server cart is source of truth) |
| Object storage | `@aws-sdk/client-s3` (MinIO), `sharp` (variants) | `3.7xx` / `0.33.x` |
| Unit/component | `vitest`, `@vitejs/plugin-react`, `jsdom` | `2.1.x` / `4.3.x` / `25.x` |
| Testing Library | `@testing-library/react`, `/jest-dom`, `/user-event` | `16.1.x` / `6.6.x` / `14.5.x` |
| E2E | `@playwright/test` | `1.49.x` |
| Lint/format | `eslint` (flat) `9.x`, `eslint-config-next` `15.1.x`, `@typescript-eslint` `8.x`, `eslint-plugin-boundaries` `5.x`, `prettier` `3.4.x` | — |

Every new dependency after S01 is justified in one line in the ADR of the sprint that adds it.

## 7. Money

- **Representation:** an integer count of the currency's minor unit (cents), carried in a small
  `Money` value: `{ amountCents: number; currency: 'USD' | ... }`. `amountCents` is a branded integer;
  a raw `number` cannot be passed where `Money` is expected.
- **Arithmetic:** `addMoney`, `subMoney`, `mulMoney(qty)`, and `allocate(total, weights)` (largest-
  remainder, so split shares sum to the total — no penny lost or conjured). All integer.
- **No floats, ever, in money math.** No `parseFloat`, no `/ 100` on the value, no `.toFixed` outside
  `formatMoney`. A **source-scan fitness test** fails the build if float money arithmetic appears under
  `server/`. `formatMoney(cents, currency)` (Intl.NumberFormat) is the single place cents becomes a
  string.
- The whole discipline is one-paged in `docs/concepts/money-in-minor-units.md` and pinned in
  ADR-0002.

## 8. Testing strategy

- **Vitest (unit + component).** Services and `lib/` are tested as pure functions with **fakes for
  every port** (fake `PaymentGateway`, in-memory `ObjectStore`, fixed `Clock`). Components are tested
  with Testing Library + `user-event`, asserting **behavior and accessibility** (roles/labels), not
  markup. Zero database, zero network. Fast enough to run on save.
- **Playwright (E2E).** Full flows against a **Postgres service container**, a **MinIO/filesystem
  object store**, and the **signed-fake Stripe gateway**. Flagship flow: browse → add to cart →
  checkout → (fake webhook fires, signed with the constant test secret) → order confirmation. Admin
  flow: create product → set inventory → see it on the storefront.
- **Fitness tests (source scans).** The layering rule (via ESLint) and the no-float-money rule run in
  CI and can go RED — architecture and discipline you can *fail*.
- **The mock discipline.** The `PaymentGateway` port has a real `StripeGateway` and a
  `FakeStripeGateway`. Tests and CI use the fake; the fake **signs its webhook payloads with the same
  constant `STRIPE_WEBHOOK_SECRET` the app verifies against**, so the real signature-verification code
  path is exercised without any real key. Object storage uses MinIO (S3 API) in CI or a filesystem
  adapter locally. `pnpm test` and CI need **zero real credentials**.

## 9. The 15 sprints

**Phase 1 — MVP (S01–S05) → `v0.5.0`**

| # | Title | Teaching payoff |
|---|---|---|
| 01 | Walking skeleton: Next scaffold + one vertical slice + layering gate + CI + Playwright smoke | RSC data-fetch; the layering fitness rule; money in minor units; the skeleton carries conventions |
| 02 | Product catalog + data layer (Prisma, repos, seed, RSC grid) | RSC vs client boundary; the data-access boundary; loading/empty/error states; responsive grids |
| 03 | Product detail + listing, pagination, sort, SEO metadata | Pagination & data-fetching patterns; `generateMetadata`; **request-waterfall pitfall (flaw 4 planted)** |
| 04 | Cart: client state + server cart + optimistic UI | Optimistic UI + rollback; TanStack Query mutations; **client-price + rollback flaws planted (1, 5)** |
| 05 | Checkout + Stripe test-mode + webhook→order loop → **v0.5.0** | A real Stripe integration; the fulfillment loop; signature verification; **flaws 2, 3 planted** |

**Phase 2 — Full product (S06–S15) → `v1.0.0`**

| # | Title | Teaching payoff |
|---|---|---|
| 06 | Orders & order history + webhook idempotency | Order data-fetching; **idempotent fulfillment — flaw 2 harvested (RED→GREEN)** |
| 07 | Search + faceted filters + sort (Postgres full-text) | Faceted search; URL-as-state; server-driven filtering; debounced client input |
| 08 | Reviews & UGC | Forms + zod at depth; aggregates; escaping user content (organic, not headline security) |
| 09 | Admin product/variant CRUD | Admin dashboard CRUD; forms + server actions + revalidation; **flaw 1 harvested** |
| 10 | Image upload & processing/variants | File upload; the `ObjectStore` port; image variants (sharp); responsive `next/image` |
| 11 | Auth + accounts + roles (customer/seller) | Auth, sessions, middleware, RBAC; protected routes and actions (authz as ordinary feature) |
| 12 | Inventory management + real-time stock | Inventory ops; atomic decrements; concurrency; **oversell race harvested — flaw 3** |
| 13 | Performance: Core Web Vitals, caching, N+1 hunt | Caching (Next + TanStack Query); streaming/Suspense; **waterfall/N+1 harvested — flaw 4** |
| 14 | Accessibility + i18n + SEO + E2E depth | a11y (keyboard/focus/ARIA, axe in CI); SEO/sitemap/OG/structured data; **rollback harvested — flaw 5** |
| 15 | Production readiness + deploy + retrospective + flaw-ledger reveal → **v1.0.0** | Operating what you built; BYO keys; the reveal |

## 10. Teaching machinery

- **Per-sprint ritual:** milestone + story issue + 3–6 task issues → branch `sprint-NN-slug` → ordered
  commits (data → services → actions/handlers → UI → tests → docs; RED→GREEN arcs as real history) →
  PR from a body file → 8–11 tagged inline comments (📘/🔍/⚠️/🔗, personas `[Author]`/`[Reviewer]`/
  `[Stakeholder]`) → one design-debate thread (Reviewer wins ≥3× across the course) → squash-merge →
  close milestone. Full detail in `CONTRIBUTING.md`.
- **ADR per sprint** (`docs/adr/`, numbered from S01) + one `docs/concepts/` one-pager per sprint.
- **Five planted flaws**, seeded silently in S03–S05, harvested with failing tests across S06–S14.
  Ledger is author-private (`FLAW-LEDGER.local.md`, gitignored) until the S15 reveal commits
  `docs/sprints/flaw-ledger.md`.
- **Commit body format:** summary; `Why this way:`; `Notice:`; `See also:`; `Refs #N`.
- **Code markers:** `// LEARN:` `// WHY:` `// GOTCHA:` `// TRY:`.

## 11. Bring Your Own Keys (optional — the course never needs it)

The course build runs entirely on test-mode/mocks. To exercise the real Stripe test dashboard:

1. Create a Stripe account, copy the **test-mode** `sk_test_...` into `.env` as `STRIPE_SECRET_KEY`.
2. Run `stripe listen --forward-to localhost:3000/api/stripe/webhook`; copy the printed
   `whsec_...` into `STRIPE_WEBHOOK_SECRET`; set `PAYMENTS_DRIVER=stripe`.
3. For real object storage, point `OBJECT_STORE_*` at an S3-compatible bucket, or keep MinIO.

No production keys are ever committed or required. Test-mode Stripe moves no real money.

## 12. Out of scope

Real payments/payouts, real tax/shipping-rate engines (shapes are realistic; numbers are
illustrative), real email delivery (console/preview adapter), a native mobile app, multi-currency
checkout beyond a single store currency, and a recommendation engine. Vendor calls exist only as
in-repo adapters behind ports.
