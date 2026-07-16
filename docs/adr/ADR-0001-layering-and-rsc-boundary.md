# ADR-0001: The Layering Rule and the RSC/Client Boundary

- **Status:** Accepted
- **Date:** 2026-07-15
- **Deciders:** [Author], [Reviewer]

## Context

Storefront's thesis is that *the server owns the truth; the client owns the experience — and the
seam between them is where real apps break.* The most common Next.js App Router bugs live on that
seam: a `"use client"` at the top of the tree that balloons the bundle; a secret or a database
client that turns out to ship to the browser; a service layer that quietly imports `next/*` and
becomes impossible to unit-test. We want that seam to be **enforced from Sprint 1**, not merely
described in a wiki — the web-app analog of the dependency tests Atlas (the .NET course) ran in CI.

We also have a folder structure with more layers (`data` / `services` / `actions` / `ports` /
`adapters`) than two tables strictly need on day one, and we must decide whether to pay for that
structure now or grow into it.

## Decision

Adopt a **layering fitness rule**, enforced two ways that back each other up:

1. **`eslint-plugin-boundaries`** (`boundaries/element-types` + `boundaries/external`) encodes the
   allowed import directions from SPEC §5 as lint errors. A Client Component that imports
   `server/data`, or a service that imports `next/*`, React, Prisma, or a vendor SDK, fails
   `pnpm lint` — and therefore CI — exactly like a broken test. New dependency (dev):
   `eslint-plugin-boundaries` (the fitness rule itself); `eslint-import-resolver-typescript` (so the
   rule can follow the `@/*` path alias).
2. **`import 'server-only'`** at the top of every `server/data` and `server/services` module. If a
   Client Component pulls one in, the **build** fails with a clear message instead of bundling
   server code — and the connection string — into the browser. New dependency: `server-only`.

The rule is **never weakened to make a sprint easier.** If it fights the design, the design is
wrong; we change the design and record it here.

**Concession to the Reviewer (see Rejected alternatives):** collapse `server/actions` into
`server/services` *for now*. Until S04 introduces the first mutation there is no write path, and a
folder with zero occupants is ceremony. The moment S04 adds a server action, `actions/` earns its
folder and the boundaries rule already has a slot for it. General principle, adopted course-wide:

> **A layer earns its folder when it has a second occupant** (or its first real one). We install
> the *rule* on day one because it is cheapest then and it is the spine of the course; we let the
> *folders* fill in as features arrive.

## Consequences

- **Easier:** the client↔server leak is caught mechanically, so review can spend its attention on
  logic instead of policing imports. The database stays an implementation detail behind
  `server/data`, so S05's Stripe adapter, S10's object store, and S12's atomic inventory all snap
  onto `server/ports` without touching the read path.
- **Harder / must-not:** you cannot take the "just put the Prisma call in the page's `async` body"
  shortcut — and that is the point. A service cannot reach for `next/*` or a vendor SDK; it depends
  on a port and gets a fake in tests.
- Guarded by: `eslint.config.mjs` (the rule), the `server-only` imports, and
  `docs/concepts/rsc-vs-client.md` (the mental model).

## Rejected alternatives

- **"It's a Next app — put the Prisma call in the page and move on."** (The Reviewer's opening
  position.) Cheap today, expensive at every later seam: the client↔server leak this rule prevents
  is a top-3 App Router bug, and unwinding an inlined data layer once four screens depend on it is
  far more work than installing the boundary while the app is two files deep. The boundary is
  cheapest to install on day one.
- **Enforce the boundary by convention / code review only.** Conventions rot; a rule that can go RED
  does not. Architecture you can *fail* is the whole pedagogy.
- **Create all five folders now, empty.** Rejected via the concession above — folders earn their
  place; the *rule* does not wait, the *folders* do.
