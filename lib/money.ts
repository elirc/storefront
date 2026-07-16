// 📘 [Author] Money in minor units — the whole discipline in one small file.
//
// `0.1 + 0.2 === 0.3` is `false` in JavaScript (it is `0.30000000000000004`). Money *is*
// decimal fractions, and floating point cannot represent most of them exactly. So we never
// let a money value be a float: a price is an **integer count of the currency's smallest
// unit** (cents for USD), carried in a `Money` value, and it only becomes a human-readable
// string in exactly one place — `formatMoney`. See docs/concepts/money-in-minor-units.md and
// ADR-0002.
//
// This module lives in `lib/` on purpose: it is a framework-free leaf (no React, no next/*,
// no Prisma), so it is trivially unit-testable and importable from any layer.

export type Currency = "USD";

// LEARN: a *branded* type. `Cents` is a `number` at runtime but a distinct type at
// compile time, so a raw `number` cannot be passed where `Cents` is expected — you must go
// through `money()`, which guarantees the integer invariant. `const price: Cents = 1999`
// won't compile; `money(1999).amountCents` will.
export type Cents = number & { readonly __brand: "Cents" };

export interface Money {
  readonly amountCents: Cents;
  readonly currency: Currency;
}

/** The one constructor. Rejects non-integers so a float can never enter the system. */
export function money(amountCents: number, currency: Currency = "USD"): Money {
  if (!Number.isInteger(amountCents)) {
    // GOTCHA: this throw is the guardrail. If you ever see it, something upstream did float
    // math (a `* 0.0825` tax without a `Math.round`, a `/ 100`) — fix it there, in integers.
    throw new Error(`money() requires integer cents, received ${amountCents}`);
  }
  return { amountCents: amountCents as Cents, currency };
}

function sameCurrency(a: Money, b: Money): Currency {
  if (a.currency !== b.currency) {
    throw new Error(`currency mismatch: ${a.currency} vs ${b.currency}`);
  }
  return a.currency;
}

export function addMoney(a: Money, b: Money): Money {
  return money(a.amountCents + b.amountCents, sameCurrency(a, b));
}

export function subMoney(a: Money, b: Money): Money {
  return money(a.amountCents - b.amountCents, sameCurrency(a, b));
}

/** Multiply by an integer quantity (e.g. line total = unit price × qty). */
export function mulMoney(m: Money, qty: number): Money {
  if (!Number.isInteger(qty)) {
    throw new Error(`mulMoney() requires an integer quantity, received ${qty}`);
  }
  return money(m.amountCents * qty, m.currency);
}

// LEARN: largest-remainder allocation. You cannot split 1000¢ into 3 equal integer shares —
// 333+333+333 = 999, a penny vanishes. Floor each share, then hand the leftover units one by
// one to the largest remainders. `allocate(money(1000), [1,1,1])` → [334, 333, 333], summing
// to exactly 1000. Storefront uses it to split an order-level discount across lines so the
// line totals still add up to what the customer paid.
export function allocate(total: Money, weights: number[]): Money[] {
  if (weights.length === 0) return [];
  if (weights.some((w) => w < 0)) throw new Error("allocate() weights must be non-negative");

  const weightSum = weights.reduce((s, w) => s + w, 0);
  if (weightSum === 0) throw new Error("allocate() weights must not sum to zero");

  const total_ = total.amountCents as number;
  let remainder = total_;
  const shares = weights.map((w) => {
    const share = Math.floor((total_ * w) / weightSum);
    remainder -= share;
    return share;
  });

  // Distribute the leftover units to the largest fractional remainders first.
  const order = weights
    .map((w, i) => ({ i, frac: (total_ * w) / weightSum - Math.floor((total_ * w) / weightSum) }))
    .sort((a, b) => b.frac - a.frac);

  for (let k = 0; k < remainder; k++) {
    const target = order[k % order.length];
    if (target) shares[target.i] = (shares[target.i] ?? 0) + 1;
  }

  return shares.map((c) => money(c, total.currency));
}

// 📘 [Author] The ONLY place cents becomes a display string. Note the single, deliberate
// `/ 100` — it exists here, in `lib/`, for DISPLAY only, and nowhere under `server/` (the
// money source-scan fitness test enforces exactly that; see test/fitness/no-float-money).
export function formatMoney(m: Money): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: m.currency,
  }).format(m.amountCents / 100);
}
