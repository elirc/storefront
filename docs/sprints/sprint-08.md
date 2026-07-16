# Sprint 08 — Reviews & UGC

**Goal:** customers write product reviews (rating + text); products show an aggregate score and a
paginated review list; user-generated content is rendered **safely**.

## Scope

**In:** `Review` (product, author, `rating 1–5`, `body`, timestamps, `status` for basic moderation);
a review form (react-hook-form + zod) posted via a server action (only customers who exist can post —
purchase-verification is noted as a future gate); aggregate score + count cached on the product and
recomputed on write; paginated review list with an empty state; basic moderation (a seller can hide a
review). **UGC escaping**: review text renders as plain text through React's default escaping —
**never** `dangerouslySetInnerHTML`; if a subset of formatting is wanted, it's an explicit allowlist
sanitizer, not raw HTML.

**Out:** rich-text/markdown reviews, images in reviews, verified-purchase badges, reply threads.

## Teaching focus

Forms at depth (react-hook-form + zod, field errors, pending state, server-action integration); moving
an aggregate (score/count) without drift; **escaping UGC** — taught as ordinary correctness, not a
security headline (React escapes by default; the mistake is opting out with `dangerouslySetInnerHTML`).

## Commit narrative (sketch)

1. `feat(db): Review + aggregate fields + migration`
2. `feat(service): submit review + recompute aggregate (transactional)`
3. `feat(ui): review form (rhf+zod) + list + empty state`
4. `feat(admin): hide/unhide a review (moderation)`
5. `test: zod validation, aggregate recompute, hidden reviews excluded`
6. `docs: ADR-0009 aggregates + UGC escaping; concepts/forms-and-validation.md`

## Teaching placements

- 📘 react-hook-form + zod: one schema validates on the client (fast feedback) **and** re-validates in
  the server action (authority) — never trust the client's pass.
- 📘 rendering UGC: "React escapes `{review.body}` for you; the only way to get XSS here is to *ask* for
  it with `dangerouslySetInnerHTML` — so don't." (organic, not a security theme)
- ⚠️ the aggregate is recomputed in the **same transaction** as the insert, or a concurrent read sees a
  new review with a stale average.
- 🔍 pending + error states on the form: a submit with no disabled state double-posts.

## Debate

`[Reviewer]`: "Recomputing the aggregate on every write is wasteful — do it in a nightly job."
`[Author]`: a stale rating is a visible product lie and the recompute is one cheap grouped query in the
same transaction; batch it only if it ever shows up in a trace. **Resolution (Reviewer wins a hedge):**
recompute inline now, but store enough (`sum`, `count`) to make it an O(1) update rather than a full
re-aggregate — ADR-0009 records the incremental-aggregate choice.

## Exercises

- Submit a review whose body is `<img src=x onerror=alert(1)>`. Confirm it renders as literal text.
  Now (in a scratch branch) render it with `dangerouslySetInnerHTML` and watch what changes — then
  delete that branch.
- Post two reviews concurrently and assert the count/average stay consistent.
- Add a "most helpful" sort. What does it do to pagination stability?
