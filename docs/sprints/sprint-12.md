# Sprint 12 — Inventory Management + Real-Time Stock

**Goal:** sellers manage stock (adjustments with an audit trail, low-stock signals), the storefront
reflects stock changes promptly, and — the harvest — checkout can no longer **oversell** under
concurrency.

> **Harvest: flaw 3 (oversell race).** A flash-sale item sold more units than existed. The RED→GREEN
> arc: a concurrency test that fires two fulfillments for the last unit, then the fix — an atomic,
> conditional, transactional decrement.

## Scope

**In:** admin inventory view + adjustments (`StockAdjustment` audit rows, reason codes); low-stock
badges + a "back in stock" gate on add-to-cart; near-real-time storefront stock (revalidation on write
+ short-TTL cache, or lightweight polling on the PDP — SSE noted as optional); the harvest — replace
the S05 read-modify-write with an **atomic conditional decrement**
(`UPDATE variant SET stock = stock - :qty WHERE id = :id AND stock >= :qty`) inside the fulfillment
transaction, returning rows-affected to detect the loser; an out-of-stock fulfillment path (refund/hold
stub).

**Out:** multi-warehouse, reservations-with-expiry at add-to-cart (noted as a richer model than the
scope needs), demand forecasting.

## Teaching focus

Concurrency at the database boundary: why `read → check → write` is a race and an **atomic conditional
update** is not; transactions and rows-affected as a decision signal; keeping a fast-changing value
(stock) fresh in an RSC world without lying.

## Commit narrative (sketch)

1. `feat(admin): inventory view + StockAdjustment audit + low-stock`
2. `feat(storefront): stock reflected via revalidation/short-TTL; OOS add-to-cart gate`
3. `test(concurrency): failing — two fulfillments for stock=1 both succeed, stock=-1 (RED)`  ← harvest RED
4. `fix(inventory): atomic conditional decrement in the fulfillment transaction (GREEN)`
5. `test: loser is rejected out-of-stock; stock never negative`
6. `docs: ADR-0013 atomic stock decrement; concepts/oversell-and-atomicity.md`

## Teaching placements

- 📘 the RED test: "you can't catch this with one request — fire two with `Promise.all` and assert the
  invariant (`stock >= 0`, one winner)." 🔗 back to the S05 decrement whose `if (stock >= qty)` guard
  *looked* safe.
- ⚠️ the conditional lives in the `WHERE`, not in JS — `WHERE stock >= qty` is the whole fix; the app
  can't win a race the database has to arbitrate.
- 🔍 rows-affected = 0 means you lost the race; that's your out-of-stock signal, not an exception to
  swallow.

## Debate

`[Reviewer]`: "Reserve stock at add-to-cart with a TTL so the customer isn't surprised at checkout."
`[Author]`: reservations solve a real UX problem but add expiry sweeps and their own races; the
**correctness** bug (overselling) is fixed by the atomic decrement — reservations are a UX upgrade to
schedule, not the fix. **Resolution (Author holds; Reviewer's idea backlogged):** ship the atomic
decrement now; ADR-0013 records reservations as a considered, deferred enhancement with its trade-offs.

## Exercises

- Reproduce the S05 oversell (seed `stock: 1`, two concurrent fulfillments) against the fixed code —
  confirm one winner, one out-of-stock, `stock = 0`.
- Remove the `WHERE stock >= qty` clause and keep only the JS `if`. Watch the race come back.
- Adjust stock in the admin and confirm the storefront reflects it — how stale is "prompt enough"?
