# Sprint Playbooks

Execution scripts for the 15-sprint build of **Storefront** (see [SPEC.md](../curriculum/SPEC.md)).
The course author writes all code, commits, PRs, teaching comments, and design-debate threads; the
learner **observes and studies** each merged PR in order.

The standard per-sprint ritual (Phases A–G, the teaching-comment conventions, the commit format) lives
in [CONTRIBUTING.md](../../CONTRIBUTING.md). Each sprint file below specifies only what is unique to
that sprint: its goal, scope, teaching focus, commit narrative, teaching placements, one design
debate, exercises, and any flaw planted or harvested.

**Phase 1 (S01–S05) is written in full detail; Phase 2 (S06–S15) is a solid outline** — enough to
build from, refined at the start of each Phase-2 sprint.

## Phase 1 — MVP → `v0.5.0`

| Sprint | Playbook | Headline |
|--------|----------|----------|
| 01 | [sprint-01.md](sprint-01.md) | Walking skeleton: scaffold, one vertical slice, layering gate, CI, Playwright smoke |
| 02 | [sprint-02.md](sprint-02.md) | Product catalog + data layer: Prisma, repositories, seed, RSC grid |
| 03 | [sprint-03.md](sprint-03.md) | Product detail + listing, pagination, sort, SEO metadata |
| 04 | [sprint-04.md](sprint-04.md) | Cart: client state + server cart + optimistic UI |
| 05 | [sprint-05.md](sprint-05.md) | Checkout + Stripe test-mode + the webhook→order loop → **v0.5.0** |

## Phase 2 — Full product → `v1.0.0`

| Sprint | Playbook | Headline |
|--------|----------|----------|
| 06 | [sprint-06.md](sprint-06.md) | Orders & order history + webhook idempotency |
| 07 | [sprint-07.md](sprint-07.md) | Search + faceted filters + sort (Postgres full-text) |
| 08 | [sprint-08.md](sprint-08.md) | Reviews & UGC |
| 09 | [sprint-09.md](sprint-09.md) | Admin product/variant CRUD |
| 10 | [sprint-10.md](sprint-10.md) | Image upload & processing/variants |
| 11 | [sprint-11.md](sprint-11.md) | Auth + accounts + roles (customer/seller) |
| 12 | [sprint-12.md](sprint-12.md) | Inventory management + real-time stock |
| 13 | [sprint-13.md](sprint-13.md) | Performance: Core Web Vitals, caching, N+1 hunt |
| 14 | [sprint-14.md](sprint-14.md) | Accessibility + i18n + SEO + E2E depth |
| 15 | [sprint-15.md](sprint-15.md) | Production readiness + deploy + retrospective → **v1.0.0** |

## Cross-sprint arcs the learner should watch

These threads run *through* the sprints — the point of a curriculum built as one product is that ideas
compound. Follow an arc across its sprints and you see a concept mature.

- **Money / price discipline** (S01 → S04 → S05 → S09) — a `Money` value and the no-float rule land in
  S01; the cart introduces where a price *comes from* (S04); checkout proves the server recomputes the
  charged amount (S05); S09 harvests the flaw where an early path trusted the client's price.
- **The trust boundary** (S04 → S05 → S09) — "the client is not authoritative" stated, then violated
  quietly, then repaired with a tamper test.
- **Optimistic UI** (S04 → S13 → S14) — optimistic add-to-cart lands in S04; caching/staleness deepen
  in S13; the missing rollback is harvested with an E2E error-path test in S14.
- **The Stripe webhook loop** (S05 → S06 → S12) — Checkout + fulfillment in S05; idempotency harvested
  in S06; the stock-decrement race inside fulfillment harvested in S12.
- **RSC vs client boundary** (S01 → S02 → S04) — server-by-default in S01/S02; the first real client
  islands (cart, filters) in S04, with the boundary drawn deliberately.
- **Search** (S02 → S03 → S07) — a plain list, then paginated/sorted, then full-text + faceted with the
  URL as state.
- **Performance** (S03 → S13) — the request waterfall is planted in the S03 listing and hunted down in
  the S13 performance sprint.
- **The flaw ledger** — five flaws are planted in S03–S05 and harvested across S06–S14 with RED→GREEN
  arcs. It is revealed at the end: **watch for it in S15** (`flaw-ledger.md`). 😉
