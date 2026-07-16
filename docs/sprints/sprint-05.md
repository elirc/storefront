# Sprint 05 — Checkout + Stripe (Test Mode) + the Webhook→Order Loop → v0.5.0

**Goal:** a real payment. The shopper checks out, pays in Stripe **test mode**, and — driven by the
**webhook**, not the browser redirect — an order is created and stock decremented. The MVP ships.

> **Flaws 2 (webhook not idempotent) and 3 (oversell race) are planted here.** The webhook's signature
> verification is genuinely correct and is the blind-spot praise target. Ledger stays author-private.
> Two flaws are planted in one PR but harvested three (S06) and seven (S12) sprints apart, so the S05
> review can plausibly miss both.

## Scope

**In:**

- The `PaymentGateway` **port** (`server/ports/payment.ts`): `createCheckoutSession(order draft)` →
  `{ url }`; plus a webhook event type. Two adapters: `StripeGateway` (real, test-mode) and
  `FakeStripeGateway` (tests/CI — **signs its webhook payloads with the same constant
  `STRIPE_WEBHOOK_SECRET` the app verifies**, so the real verification path runs with no real key).
- `server/services/checkout.ts`: builds the Stripe **line items from the server-recomputed cart**
  (variant price re-read from the DB, `Money`), creates the session, stores a pending checkout keyed to
  the session id. **The amount charged is computed server-side — the client's totals are display only.**
- `app/api/stripe/webhook/route.ts`: verifies the signature, and on `checkout.session.completed` calls
  `server/services/orders.ts` `fulfill(session)` → creates `Order` + `OrderLine`s (prices snapshotted
  from the session), decrements variant stock, marks the checkout complete.
- `app/(storefront)/checkout/page.tsx` (review + "pay" → redirect to Stripe) and
  `checkout/success/page.tsx` (reads the order by session id; **polls** until the webhook has fulfilled
  it — teaching that the redirect is not the source of truth).
- `docs/http/checkout.http` and a Playwright E2E: cart → checkout → fake webhook fires → success page
  shows the order.
- Prisma: `Order`, `OrderLine`, `Payment`, `PendingCheckout`. Migration.
- **Tag `v0.5.0` + GitHub Release after merge.**

**Out:** order history UI (S06 — success page is the only order view for now), refunds, idempotency
hardening (S06 — deliberately), inventory reservation/atomic decrement (S12 — deliberately).

## Teaching focus

A real Stripe integration end-to-end: **Checkout Session → hosted payment → webhook → fulfillment**.
Why **the webhook, not the browser redirect, fulfills the order** (the customer can close the tab; the
redirect can be forged; the webhook is the trustworthy signal). **Signature verification** as the
webhook's front door. The **trust boundary at its sharpest**: the charged amount is recomputed
server-side from the catalog, never read from the client. Polling an eventually-consistent success
page.

## Commit narrative (sketch)

1. `feat(ports): PaymentGateway port + Stripe/Fake adapters (fake signs its own webhooks)`
2. `feat(db): Order, OrderLine, Payment, PendingCheckout + migration`
3. `feat(service): checkout — server-recomputed line items + Stripe session`
4. `feat(api): stripe webhook — verify signature, fulfill on completed`   ← **flaws 2 + 3 planted here**
5. `feat(ui): checkout review + success page (polls for fulfillment)`
6. `test(e2e): cart → checkout → fake webhook → order shown`
7. `test(service): checkout amount is recomputed server-side (client totals ignored)`
8. `docs: ADR-0006 the webhook-driven fulfillment loop; concepts/webhook-fulfillment.md; v0.5.0 release notes`

### How the flaws are planted (author-private context)

- **Flaw 2 (commit 4):** the handler verifies the signature (correct) and on `checkout.session.completed`
  **fulfills unconditionally** — no record of processed `event.id`, no dedupe. Stripe's at-least-once
  delivery (or a slow 200 that Stripe retries) → the same event fulfills twice → two orders, stock
  decremented twice. The commit body: *"On `checkout.session.completed`, create the order and decrement
  stock."* Honest, silent.
- **Flaw 3 (commit 4, inside `fulfill`):** stock decrement is a **read-modify-write** —
  `const v = await getVariant(id); if (v.stock >= qty) await setStock(v.stock - qty)` — no transaction,
  no conditional `UPDATE ... WHERE stock >= qty`, no lock. The `if (stock >= qty)` guard *looks*
  careful, which is exactly why the missing atomicity slips past review.

## Teaching placements

- 📘 on the webhook route: "the **redirect** tells the *browser* it's done; the **webhook** tells your
  *server* — and only the server's word creates an order. Fulfill on the webhook."
- 📘 on `checkout.ts`: line items are built from the **server-recomputed** cart; a comment shows the
  client-sent total being ignored. (← the trust-boundary arc; contrast with the S04-planted flaw 1.)
- **Flaw 2 blind-spot:** a `[Reviewer]` ⚠️ **correctly praises the signature verification**: "good — an
  unverified webhook endpoint is an open `POST` to your orders table; verifying the signature is
  non-negotiable." It says **nothing** about idempotency. 🔗 "orders + retries get their own sprint
  (S06)."
- **Flaw 3 blind-spot:** no comment points at the decrement; the nearby honest 📘 praises the
  server-recomputed amount, drawing the eye to price correctness and away from the stock race. The
  `if (stock >= qty)` guard is left to look sufficient.
- ⚠️ on the success page: "don't trust the redirect's query params as order truth — poll for the
  webhook-created order; the tab may have closed before the redirect."

## Debate

`[Reviewer]`: "Fulfilling from the webhook makes the success page **eventually consistent** — the user
lands before the order exists and we have to poll. Just create the order in the checkout redirect
handler where we control the flow." `[Author]`: the redirect is client-controlled and forgeable, and
the customer can close the tab mid-redirect — the payment still succeeds and must still fulfill.
**The webhook is the only signal that survives a closed tab.** Polling a fresh order for a second is the
honest cost of correctness. **Resolution (Author wins on principle; Reviewer wins a UX fix):** keep
webhook-driven fulfillment, but add a *server-action fallback* on the success page that can fulfill
synchronously if the webhook is delayed **(made idempotent in S06 so the two paths can't double-fulfill
— foreshadow logged, not explained)**. ADR-0006 records: *fulfillment is webhook-authoritative; any
second path must be idempotent.*

## Post-merge

Tag `v0.5.0`; GitHub Release: the MVP arc (browse → cart → Stripe checkout → order), what Phase 2 adds,
and a study-order refresher. Note in the release that the webhook loop "gets hardened next sprint" —
true, and quietly the setup for the S06 harvest.

## Exercises

- Intercept the checkout request and inflate the client's cart total 10×. Confirm the **charged amount
  is unchanged** — the server recomputed it. (This is the trust boundary working. Contrast: the S04
  cart-price path, which does *not* — flaw 1.)
- Send the same signed `checkout.session.completed` event to the webhook **twice** with `curl`. How
  many orders exist? (This is flaw 2 — harvested S06.)
- Seed a variant with `stock: 1` and fulfill two orders for it "at the same time." What's the final
  stock? (This is flaw 3 — harvested S12.)
