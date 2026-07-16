# Sprint 09 — Admin Product/Variant CRUD

**Goal:** the seller admin gets full product/variant CRUD — create, edit, archive — with real forms,
server actions, and revalidation. Editing a price is what surfaces the client-trusted-price flaw.

> **Harvest: flaw 1 (client-trusted price).** A seller changes a variant's price; support finds an
> order that paid a price the store never listed. The RED→GREEN arc fixes the cart to re-read the
> catalog price server-side, with a tamper test.

## Scope

**In:** admin product list + create/edit forms (react-hook-form + zod, shared schema with the
server action); variant editor (add/remove variants, price, SKU, attributes); archive/unarchive
(soft delete, hidden from the storefront); optimistic list updates with rollback (applying S04's
lesson correctly this time — a deliberate contrast); revalidation of affected storefront pages; the
harvest — `addToCart`/cart read stop trusting client `unitPriceCents`/`name` and **re-read the
authoritative price from `product_variant`** at add and at checkout, with a tamper test.

**Out:** bulk import/CSV, product-level analytics (S13+ reporting), image upload (S10 — image fields
are URLs until then).

## Teaching focus

Admin CRUD done well: forms with server-side re-validation, optimistic list mutations **with rollback**
(the right way, contrasted with S04's gap), `revalidatePath`/`revalidateTag` after writes; and the
trust-boundary harvest — **a price is authoritative only from the catalog**.

## Commit narrative (sketch)

1. `feat(admin): product list + create/edit forms (rhf+zod) + server actions`
2. `feat(admin): variant editor + archive + storefront revalidation`
3. `feat(admin): optimistic list update WITH onError rollback (contrast to S04)`
4. `test(service): failing — cart stores client unitPrice, not catalog price (RED)`   ← harvest RED
5. `fix(cart): re-read authoritative price from product_variant at add + checkout (GREEN)`
6. `test(e2e): tamper unitPrice → order total is the catalog price`
7. `docs: ADR-0010 the price is authoritative only from the catalog`

## Teaching placements

- 📘 the harvest: "a price the client sends is *what they saw*, not *what it costs* — re-read it. The
  cart line stores a **snapshot taken from the catalog**, not from the request." 🔗 back to the S04 🔍
  that praised the zod validation ("validated the *shape*; never checked the *source*").
- 🔍 commit 3's rollback vs S04's missing one: "same TanStack Query shape, but here `onError` restores
  the snapshot — this is what S04 owed you."
- ⚠️ revalidate the storefront listing and the product page after a price edit, or the old price
  lingers in the RSC cache.

## Debate

`[Reviewer]`: "Snapshot the price on the cart line so a mid-session price change doesn't move the
customer's total." `[Author]`: yes — but the snapshot must be **taken server-side from the catalog at
add time**, not accepted from the client; the S04 bug wasn't snapshotting, it was *trusting the source*.
**Resolution (agreement, sharpened):** snapshot at add time **from the DB**; re-validate against the
live price at checkout and surface a "price changed" notice if it moved. ADR-0010 records both halves.

## Exercises

- Run the S05 tamper exercise again after the fix — confirm the order now charges the catalog price.
- Edit a variant's price while an item sits in a cart. What does the customer see at checkout — the old
  snapshot, the new price, or a "price changed" prompt? Pin your choice with a test.
- Archive a product that's in someone's cart. What should the cart show?
