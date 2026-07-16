# Sprint 06 — Orders & Order History + Webhook Idempotency

**Goal:** the customer can see their orders — a history list and a detail view — and the webhook
fulfillment loop is made **idempotent**, so a retried Stripe event fulfills exactly once.

> **Harvest: flaw 2 (webhook not idempotent).** This is a real RED→GREEN arc inside the PR: a failing
> test that replays an event twice, then the dedupe fix. The PR body frames it as a bug report.

## Scope

**In:** order-history list (`app/(storefront)/orders/page.tsx`) and detail (`orders/[number]`); guest
order lookup by order number + email; order status display (`paid → fulfilled → shipped` shape);
`server/services/orders.ts` read paths + view-models; the harvest — a `ProcessedWebhookEvent` table
(`stripeEventId` unique) and a fulfillment guard that no-ops on a seen event id, plus wrapping the
success-page fallback (from S05) in the same guard so the two fulfillment paths can't double up.

**Out:** shipping/tracking integration, returns/refunds, admin order management (S09+).

## Teaching focus

Data-fetching for a personalized list; the **idempotency pattern** for at-least-once webhooks
(dedupe on the provider's event id, a unique constraint as the enforcement); why "it worked in the
demo" and "it's correct under retries" are different claims.

## Commit narrative (sketch)

1. `feat(service+ui): order history list + detail + guest lookup`
2. `test(webhook): failing — same event twice creates two orders (RED)`   ← harvest RED
3. `feat(db): ProcessedWebhookEvent (stripeEventId unique) + migration`
4. `fix(webhook): dedupe on event id; success-page fallback shares the guard (GREEN)`
5. `docs: ADR-0007 idempotent webhook handling; concepts/idempotent-webhooks.md`

## Teaching placements

- 📘 the RED test: "a webhook is at-least-once; test it by sending the event **twice** and asserting
  one effect." 🔗 back to the S05 ⚠️ that praised signature verification — "verification kept out
  forgeries; it never promised *once*."
- ⚠️ the unique constraint does the real enforcing — the application check is a fast path, the DB
  constraint is the guarantee (two racing retries).
- 🔍 on the orders view-model: "an order line snapshots its price; don't re-join to the live catalog —
  the price then is not the price now."

## Debate

`[Reviewer]`: "An in-memory `Set` of processed ids is enough — webhooks aren't *that* concurrent."
`[Author]`: memory dies with the process and doesn't span instances; the dedupe must be durable and
race-safe, which is what the **unique constraint** gives you for free. **Resolution (Author holds):**
DB-backed dedupe; ADR-0007 records *the provider's event id + a unique index is the idempotency key.*

## Exercises

- Replay a `checkout.session.completed` twice against the fixed handler. Confirm one order, stock
  decremented once. Now delete the unique index and race two retries — which layer catches it?
- A customer closes the tab before the webhook lands, then hits the success page (the fallback path).
  Prove the fallback + webhook can't both fulfill.
