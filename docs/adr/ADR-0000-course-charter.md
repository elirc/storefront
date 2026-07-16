# ADR-0000: Course Charter — Storefront as a Teaching Repository

- **Status:** Accepted
- **Date:** 2026-07-15
- **Deciders:** [Author], [Stakeholder]

## Context

We want to take a junior engineer to mid/senior level in **full-stack TypeScript and modern React** —
specifically the CRUD-web-dev skills that a backend-heavy curriculum (like our .NET course, Atlas)
deliberately leaves out. Those skills are the browser-facing ones: where the React Server Component
boundary falls, what an optimistic update owes you on the error path, how a real Stripe integration's
webhook loop actually works, what "the client is not authoritative" means in code, why a listing page
with a request waterfall fails Core Web Vitals.

Reading docs and toy tutorials doesn't transfer these. The skills are learned from **real codebases
with visible decision history** — but real codebases hide their history: squashed rationale, deleted
debates, invisible dead ends, and (crucially) the bugs that shipped and the reviews that missed them.

## Decision

Build a real product — **Storefront**, a two-surface e-commerce platform (customer + seller admin) —
**as a curriculum**: 15 sprints, each a single squash-merged PR engineered as a chapter.

- The **thesis** is *the server owns the truth; the client owns the experience — and the seam between
  them is where real apps break.* The teaching weight is on the **frontend and the browser↔server↔
  vendor seams**, not on a service layer the browser never sees.
- **Two surfaces, one codebase:** a customer storefront and a seller admin, so the learner practices
  both read-heavy public UX and write-heavy internal CRUD.
- Every PR carries: ordered teaching commits, 8–11 tagged inline review comments, one design-debate
  thread, an ADR, a concept one-pager, and exercises.
- **Five realistic, frontend/full-stack flaws** are planted silently in Phase 1 and harvested later
  with RED→GREEN arcs. The ledger stays author-private until Sprint 15 reveals it. This teaches the
  single most transferable reviewer skill: *what a polite LGTM missed.*
- **A layering fitness rule** (ESLint boundaries + `server-only`) enforces the client↔server↔data
  separation in CI from Sprint 1 — architecture you can *fail*, the web-app analog of Atlas's
  dependency tests.
- All personas (`[Author]`, `[Reviewer]`, `[Stakeholder]`) are played by the course author from one
  GitHub account, prefix-tagged. The learner **observes and studies**; they never ship product code
  here.

## Non-goals

- **No dedicated security-audit or threat-model sprint, and no CI secret-scanning or dependency-audit
  gates.** Atlas had those; Storefront deliberately does not. Security is folded into ordinary
  correctness where it is natural — never trust client-computed prices, validate input, escape UGC,
  authorize the mutation — but it is **not a headline theme**. Basic auth/authorization is just a
  normal feature (S11).
- **No real cloud credentials in CI, ever.** Stripe runs test-mode/signed-fake; object storage is
  MinIO/filesystem; email is a console/preview adapter. `pnpm test` and CI need zero real keys. A
  bring-your-own-keys path exists for real use but the course build never requires it.
- **No microservices, no multi-region, no native mobile.** One Next.js app, one Postgres. The lessons
  are about the browser↔server seam, not distributed systems.
- **Domain fidelity has limits:** tax, shipping, and discount *shapes* are realistic; the *numbers* are
  illustrative. This is a course about building web apps well, not a commerce-compliance reference.

## Consequences

- The repo is optimized for **reading**: commits are smaller and more narrated than a shipping team
  might bother with; some inline comments exist purely to teach.
- CI must be **deterministic and credential-free** so every PR's gate is trustworthy years later. The
  fake payment gateway signs its own webhooks with a constant test secret so the real
  signature-verification path is still exercised.
- The planted flaws mean **`main` is knowingly imperfect between plant and harvest.** That is the
  point; the Sprint 15 ledger reveal makes it auditable, with links to plant and harvest commits.
- Because there is a UI, "done" includes the non-happy states (loading, error, empty) and
  accessibility — a feature that only works with data present is treated as half-finished.

## Rejected alternatives

- **A finished-code tutorial repo** — hides exactly the history (debates, the bug that shipped, the
  fix) that teaches.
- **The learner builds, the AI reviews** — slower feedback, and the learner cannot yet reliably produce
  the *interesting* frontend mistakes worth studying (the missed rollback, the waterfall). Observation
  first; production later.
- **A pure-frontend app with a mocked API** — would dodge the whole point: the best lessons here live
  at the real browser↔server↔database↔Stripe seams, so the backend must be real (if modest).
- **Splitting storefront and admin into two apps** — fashionable, but the shared domain (catalog,
  inventory, orders) is where the trust-boundary and consistency lessons live; one codebase with an
  enforced layering rule teaches them better than a network hop.

---

## ADR format (for ADR-0001 onward)

Later decisions are recorded as `docs/adr/ADR-NNNN-short-slug.md`, numbered per the sprint that
introduces them, using this template:

```
# ADR-NNNN: <Title>

- Status: Proposed | Accepted | Superseded by ADR-XXXX
- Date: YYYY-MM-DD
- Deciders: [Author], [Reviewer], ...

## Context
What forces are at play — the requirement, the constraint, the trade-off — in a few sentences.

## Decision
The choice, stated plainly. Any new dependency it introduces, with a one-line justification.

## Consequences
What gets easier, what gets harder, what we now must not do. Link the sprint and any fitness test
or concept one-pager that guards the decision.

## Rejected alternatives
The roads not taken and why — the most valuable section for a future reader.
```

An ADR is amended by a *new* ADR that supersedes it, never by silent edit — the decision history is
part of what the course teaches.
