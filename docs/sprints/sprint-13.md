# Sprint 13 — Performance: Core Web Vitals, Caching, N+1 Hunt

**Goal:** make the storefront fast and prove it — Core Web Vitals budgets, a caching strategy, and the
harvest of the listing-page request waterfall/N+1 that's been quietly hurting LCP since S03.

> **Harvest: flaw 4 (request waterfall + N+1).** A Lighthouse LCP regression and a slow-query trace on
> `/products` lead to the fix: parallelize the fetches and collapse the per-card queries into one.

## Scope

**In:** a query-counting Prisma test double + a data-layer test asserting the listing loads its grid in
a **bounded** number of queries; the fix — replace the sequential per-card `await`s with a single
`include`/joined query and `Promise.all` for independent fetches (category + page + facets in
parallel); Next caching (`revalidate`, `cache: 'force-cache'` where safe, `unstable_cache`/tags for the
catalog), TanStack Query `staleTime` tuning; streaming/Suspense for below-the-fold sections; image LCP
audit; a Lighthouse-CI budget check in the workflow (advisory).

**Out:** a full CDN/edge rollout, RUM/analytics vendor integration (a stub only), micro-optimizations
without a trace to justify them.

## Teaching focus

Diagnosing before optimizing (trace, then fix); the **waterfall vs parallel** distinction; N+1 as a
data-layer smell; the Next caching model (static/dynamic, revalidate, tags) and how it interacts with
the S09 revalidation; query shape vs object shape.

## Commit narrative (sketch)

1. `test(perf): failing — listing fires ~50 queries for a 24-item grid (RED)`   ← harvest RED
2. `fix(data): single joined query + Promise.all for independent fetches (GREEN)`
3. `perf(cache): catalog caching with tags; TanStack Query staleTime`
4. `perf(ui): Suspense-stream below-the-fold; LCP image audit`
5. `ci: Lighthouse budget (advisory) on /products and a PDP`
6. `docs: ADR-0014 caching + data-fetching parallelism; concepts/waterfalls-and-caching.md`

## Teaching placements

- 📘 "sequential `await`s that don't depend on each other are a **waterfall** — `Promise.all` them; a
  per-row `await` in a `map` is an **N+1** — join it." 🔗 back to the S03 🔍 that praised the "clean
  top-to-bottom data-fetch" — "readable and slow are not opposites; measure."
- ⚠️ caching a per-user or price-sensitive fragment is a correctness bug — cache the catalog, not the
  cart; tag-invalidate on the S09 price edit.
- 🔍 the RED test counts queries with a Prisma test double — a perf regression you can *fail* in CI.

## Debate

`[Reviewer]`: "Just slap `force-cache` on the listing and call it fast." `[Author]`: caching hides the
waterfall, it doesn't fix it — the first (uncached) render and every revalidation still pay ~50 queries,
and a stale cache on a price is a lie. **Fix the query, then cache the fixed query.** **Resolution
(Author wins):** correctness first (join + parallelize), caching second; ADR-0014 records the order and
the "never cache user/price-sensitive fragments" rule.

## Exercises

- Compare the query count and LCP on `/products` before and after the fix. Which mattered more —
  the join or the `Promise.all`?
- Cache the catalog with a tag; edit a price in the admin (S09) and confirm the tag invalidation shows
  the new price. Then *remove* the invalidation and watch the stale price — the caching-correctness
  trap.
- Find another sequential-await pair in the codebase (hint: the PDP). Parallelize it and measure.
