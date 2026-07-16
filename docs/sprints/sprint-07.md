# Sprint 07 — Search + Faceted Filters + Sort (Postgres Full-Text)

**Goal:** shoppers can search and narrow the catalog — full-text query plus faceted filters (category,
price range, attributes) and sort — with the **URL as the single source of state**.

## Scope

**In:** Postgres full-text search (a `tsvector` column + GIN index on product name/description, kept
current by a trigger or app-side); `server/services/search.ts` behind a `SearchIndex` port (so a later
swap to a dedicated engine is a boundary change, not a rewrite); faceted filters — category, price
range (uses `Money`), variant attributes — as `searchParams`; **facet counts** ("Shoes (12)") computed
server-side; a `SearchBar` client island (debounced, pushes `q` to the URL) and a `Facets` sidebar
(checkboxes/range → URL); results reuse the S02/S03 product view-model + pagination.

**Out:** typo-tolerance/synonyms/relevance tuning, autocomplete/suggestions, a non-Postgres search
engine (the port is the seam for it).

## Teaching focus

Faceted search as **server-driven filtering** with the URL as state (shareable, back-correct);
computing facet counts without an N+1; debouncing client input while keeping the server authoritative;
the `SearchIndex` port as a swap seam.

## Commit narrative (sketch)

1. `feat(db): tsvector + GIN index + keep-current trigger`
2. `feat(port+service): SearchIndex port + Postgres full-text search service`
3. `feat(service): faceted filtering + facet counts (single grouped query)`
4. `feat(ui): SearchBar (debounced → URL) + Facets sidebar (→ URL)`
5. `test: query parsing, facet counts, empty-result state`
6. `docs: ADR-0008 search behind a port; concepts/faceted-search.md`

## Teaching placements

- 📘 `searchParams` as the state container: the filtered view is a URL you can paste in Slack.
- ⚠️ facet counts are the classic N+1 trap — compute them in one grouped query, not one-per-facet.
- 🔍 the debounce lives in the client island; the server never sees the keystrokes, only the settled
  query. 🔗 the `SearchIndex` port ← "if Postgres FTS stops scaling, this is the one seam that changes."

## Debate

`[Reviewer]`: "Full-text in Postgres is a toy; wire Meilisearch/Typesense now." `[Author]`: Postgres
FTS is genuinely good to a real scale, needs no new infra in CI, and the **port** means the swap is a
one-adapter change when (if) it's justified — build the seam, defer the dependency. **Resolution
(Author wins; Reviewer's condition logged):** stay on Postgres; ADR-0008 records the swap trigger
(relevance/scale thresholds) so the decision is revisited on evidence, not fashion.

## Exercises

- Search a term matching a product's description but not its name. Does FTS rank it? Tune the
  `tsvector` weights and re-check.
- Apply category + price-range + a sort together and share the URL. Confirm it reproduces exactly.
- Prove the facet counts are one query, not one-per-facet (count the queries).
