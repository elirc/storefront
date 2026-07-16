# Sprint 04 — Cart: Client State + Server Cart + Optimistic UI

**Goal:** a working cart — add, update quantity, remove — that feels instant (optimistic UI via
TanStack Query) and survives a refresh (persisted server-side). This is the first **write** in the app,
so the `actions/` layer earns its folder (per the S01 ADR-0001 rule).

> **Flaws 1 (client-trusted price) and 5 (missing optimistic rollback) are planted here.** Both have
> genuinely-good neighbors that the review praises. Ledger stays author-private.

## Scope

**In:**

- Prisma: `Cart` (id, `cookieId`, timestamps) + `CartLine` (cart, `variantId`, `qty`, and — as planted
  — a stored `unitPriceCents`/`name`). Migration. A cart cookie issued on first add (guest cart;
  account linkage is S11).
- `server/services/cart.ts`: `getCart(cookieId)`, `addToCart(...)`, `updateQty(...)`, `removeLine(...)`;
  cart totals via `Money` (`allocate` for any line-level rounding). `server/data/cart.ts` repository.
- `server/actions/cart.ts`: `"use server"` actions wrapping the service, with **zod** input validation;
  each action revalidates the cart.
- Client islands: `<AddToCart>` (was a stub in S01 — now real), a `<CartDrawer>`, `<QtyStepper>`, a
  header `<CartBadge>`; a **TanStack Query** cart query + mutations with **optimistic updates**. A
  `zustand` store holds only ephemeral UI (drawer open/closed), not the cart truth.
- `app/(storefront)/cart/page.tsx` — full cart view (server component reading the cart) with an empty
  state ("your cart is empty") and per-line subtotal.
- Tests: cart service (add merges same variant, qty math, totals); zod rejection of `qty<=0`; a
  component test that add-to-cart optimistically shows the item.

**Out:** checkout + payment (S05 — the cart's `checkout` button is present but routes to a stub),
account-linked carts (S11), inventory reservation (S12).

## Teaching focus

Optimistic UI and — the part juniors skip — **its rollback** (see `concepts/optimistic-ui.md`).
TanStack Query mutations (`onMutate`/`onError`/`onSettled`). The client↔server split for a cart:
**server holds the truth, the client holds a fast optimistic mirror.** Server actions as the write
path, shaped like a checklist (validate → mutate → revalidate). The **trust boundary**: what in an
add-to-cart payload is authoritative and what is not.

## Commit narrative (sketch)

1. `feat(db): Cart + CartLine schema + migration`
2. `feat(service): cart add/update/remove + Money totals`   ← **flaw 1 planted here**
3. `test(service): merge-same-variant, qty math, totals`
4. `feat(actions): server actions + zod validation + revalidate`
5. `feat(ui): AddToCart + CartDrawer + CartBadge with TanStack Query optimistic updates` ← **flaw 5 planted here**
6. `feat(ui): cart page + empty state + per-line subtotal`
7. `test(component): optimistic add shows item; zod rejects qty<=0`
8. `docs: ADR-0005 server-owns-cart-truth; concepts/optimistic-ui.md`

### How the flaws are planted (author-private context)

- **Flaw 1 (commit 2):** `addToCart` accepts `{ variantId, qty, unitPriceCents, name }` from the client
  and **persists `unitPriceCents` and `name` as given**, instead of re-reading them from
  `product_variant`. The zod schema *validates the shape* of `unitPriceCents` (a positive int), which
  makes it look handled. Reviewer praises the zod validation (below), silent that the value is trusted.
- **Flaw 5 (commit 5):** the add-to-cart `useMutation` has a correct `onMutate` that snapshots and
  applies the optimistic line — but **no `onError` restore** and no `onSettled` invalidate. Happy path
  is flawless; a rejected add leaves a phantom line. Reviewer praises the `onMutate`, silent on the
  missing `onError`.

## Teaching placements

- 📘 on the `useMutation`: the three moments — `onMutate` snapshot, `onError` rollback, `onSettled`
  reconcile — as one unit. (← `concepts/optimistic-ui.md`)
- **Flaw 5 blind-spot:** a `[Reviewer]` 🔍 **praises `onMutate`**: "nice — the UI updates before the
  round-trip; the badge feels instant." No mention that `onError` is absent. 🔗 "optimistic error paths
  get hardened when we do E2E depth (S14)" — foreshadow, no hint.
- **Flaw 1 blind-spot:** a `[Reviewer]` 🔍 **praises the zod schema** on the cart action: "good — the
  qty is validated server-side, not trusted from the form." Silent that `unitPriceCents` from the same
  payload is *stored* rather than looked up. A separate honest 📘 nearby states the ideal ("the server
  owns the price") on the *display* path, making the gap on the write path crueler.
- ⚠️ on `revalidatePath`/`revalidateTag`: after a server-action mutation, revalidate or the server-
  rendered cart page shows stale lines.
- 🔍 on `zustand`: "the store holds *drawer open/closed*, not the cart contents — UI state and server
  state are different things; don't duplicate the cart into a client store."

## Debate

`[Reviewer]`: "You have the cart in three places — the DB, the TanStack Query cache, and the server-
rendered cart page. That's a consistency nightmare; pick one." `[Author]`: they're one source (the DB)
with two *views* — the Query cache is an optimistic mirror reconciled on `onSettled`; the server page
re-reads on revalidate. The trick is that **none of them is a second source of truth**; the zustand
store deliberately holds no cart data. **Resolution (Reviewer wins a guardrail):** add an explicit rule
in ADR-0005 — *the cart lives in the DB; the client cache is derived and must reconcile on settle; no
cart data in the UI store* — and note that the missing `onSettled` reconcile in the add mutation is a
gap to close (foreshadowing the S14 harvest without naming the bug in the ledger sense).

## Exercises

- Add the same variant twice. Does the service **merge** into one line with `qty 2`, or create two
  lines? Write the test, then check the code.
- Throttle the network and force the add-to-cart action to 500. Watch the item linger (this is flaw 5,
  live). Sketch the `onError` you'd add — you'll write it in S14.
- Intercept the add-to-cart request and change `unitPriceCents` to `1`. Add a $999 item. What price
  does the cart store? (This is flaw 1 — you'll harvest it in S09.)
