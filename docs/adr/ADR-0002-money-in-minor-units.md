# ADR-0002: Money is Integer Minor Units

- **Status:** Accepted
- **Date:** 2026-07-15
- **Deciders:** [Author], [Reviewer]

## Context

`0.1 + 0.2 === 0.3` is `false` in JavaScript — it is `0.30000000000000004`. Floating point cannot
represent most decimal fractions exactly, and money *is* decimal fractions. Store a price as a float
and every add, tax line, and discount accumulates invisible error until an order total is a cent off
and a customer or an auditor notices. This is a correctness bug that a test-with-round-numbers will
never catch, so we decide the representation up front, in Sprint 1, before any price exists.

## Decision

Represent money as an **integer count of the currency's smallest unit** (cents for USD), carried in
a small `Money` value: `{ amountCents: Cents; currency: Currency }`, where `Cents` is a **branded**
`number` — a raw `number` cannot be passed where `Cents` is expected, so every money value goes
through the `money()` constructor, which rejects non-integers.

- Arithmetic (`addMoney`, `subMoney`, `mulMoney`, `allocate`) is all integer. `allocate` uses
  largest-remainder so split shares sum to exactly the whole — no penny lost or conjured.
- `$19.99` is `1999`. There is no `.99` anywhere in the program, so there is no rounding error
  anywhere in the program.
- **`formatMoney(money)` is the single place cents becomes a display string** (via
  `Intl.NumberFormat`). It lives in `lib/money.ts` and owns the one deliberate `/ 100`, which is for
  display only.
- Prisma stores `priceCents Int` — never `Float`, never a `Decimal` used as a float.

This introduces **no new dependency** — `Money` is a plain TypeScript value in the framework-free
`lib/` kit.

## Consequences

- **Easier:** money math is exact and boring. The branded type makes "add two raw numbers as a
  total" a compile error, and the view-model boundary (ADR-0003, S02) hands the UI a `Money`, so the
  browser never does arithmetic on a price.
- **Guarded by a fitness test:** `test/fitness/no-float-money.test.ts` scans `server/**` and fails
  CI if `parseFloat`, a `/ 100` on a value, or a `.toFixed` appears there. Discipline you can
  *fail*, like a broken test — the money analog of the layering rule. One-pager:
  `docs/concepts/money-in-minor-units.md`.
- **Must-not:** no float money math under `server/`; no formatting cents to a string anywhere but
  `formatMoney`.

## Rejected alternatives

- **`number` dollars (e.g. `19.99`).** The float-accumulation bug above; rejected outright.
- **A big-decimal library.** Real, but heavier than a single-store-currency shop needs, and it hides
  the lesson behind an abstraction. Integer cents in a branded type teaches *why* and adds nothing to
  the bundle. We can revisit (with a superseding ADR) if multi-currency at arbitrary precision ever
  lands — it is explicitly out of scope (SPEC §12).
- **A raw (unbranded) `number` of cents.** Loses the compile-time guard that stops a dollars value,
  or a bare arithmetic result, from being treated as money. The brand is nearly free and catches a
  whole class of mistakes at the type level.
