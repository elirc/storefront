# Money in Minor Units: Integers, Not Floats

**One-pager · seeded S01 · pairs with ADR-0002**

`0.1 + 0.2 === 0.3` is `false` in JavaScript. It returns `0.30000000000000004`. Floating point can't
represent most decimal fractions exactly, and money *is* decimal fractions. Store a price as a float
and every add, every tax line, every discount accumulates error you cannot see until an order total is
a cent off and a customer (or an auditor) notices.

## The rule

> Represent money as an **integer count of the currency's smallest unit** — cents for USD — carried in
> a `Money` value. Do all arithmetic on the integer. Convert to a display string exactly once, at the
> edge.

`$19.99` is `1999`. There is no `.99` in the program, so there is no rounding error in the program.

## The shape

```ts
// lib/money.ts
export type Currency = "USD";
type Cents = number & { readonly __brand: "Cents" };   // branded: a raw number can't sneak in

export interface Money { amountCents: Cents; currency: Currency; }

export const money = (amountCents: number, currency: Currency = "USD"): Money => {
  if (!Number.isInteger(amountCents)) throw new Error("money must be integer cents");
  return { amountCents: amountCents as Cents, currency };
};

export const addMoney = (a: Money, b: Money): Money => money(a.amountCents + b.amountCents, same(a, b));
export const mulMoney = (m: Money, qty: number): Money => money(m.amountCents * qty, m.currency);

// The ONLY place cents becomes a human string:
export const formatMoney = (m: Money) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: m.currency })
    .format(m.amountCents / 100);   // the single, deliberate divide — for DISPLAY only
```

The brand means `mulMoney(product.price, "2")` won't compile and `total = price + tax` (two raw
numbers) is never how money is added.

## Allocation: making the parts sum to the whole

You can't split `1000` cents into 3 equal integer shares: `333 + 333 + 333 = 999`. A cent vanishes.
`allocate(total, weights)` uses **largest-remainder**: floor each share, then hand the leftover units
one-by-one to the largest remainders. `allocate(money(1000), [1,1,1])` → `[334, 333, 333]`, which sums
to exactly `1000`. Storefront uses it for splitting an order-level discount across lines so the line
totals still add up to what the customer paid.

## Where Storefront enforces it

- The `Money` type is used at every boundary; a raw `number` price is a code smell.
- **A source-scan fitness test** fails CI if float money math (`parseFloat`, a `/ 100` on a value, a
  `.toFixed` outside `formatMoney`) appears under `server/`. Discipline you can *fail*, like a test.
- Prisma stores `priceCents Int`, never `Float` or a bare `Decimal` used as a float.

## Try it

1. In a Node REPL: `(0.1 + 0.2).toFixed(2)` vs summing `10 + 20` cents. Which one would you bet a
   reconciliation report on?
2. Add a 8.25% tax line to a `1999` subtotal. Compute it in cents (`Math.round(1999 * 0.0825)`), then
   as `19.99 * 0.0825` floats. Compare — and note that the *rate* multiply is the one place rounding is
   unavoidable, so it happens once, in integers, deliberately.
3. Split a `999`-cent order-level discount across 4 lines with `allocate`. Confirm the shares sum to
   `999` and no two differ by more than one cent.
