# Sprint 15 — Production Readiness + Deploy + Retrospective → v1.0.0

**Goal:** make Storefront deployable and operable, write the course retrospective, and **reveal the
flaw ledger** — then tag `v1.0.0`.

> **The flaw-ledger reveal.** The author-private `FLAW-LEDGER.local.md` becomes the public
> `docs/sprints/flaw-ledger.md`, with links to each plant and harvest commit. Nothing before this
> sprint referenced it.

## Scope

**In:** production config — env validation (`lib/env.ts` with zod, fail-fast on boot), error boundaries
+ a global `not-found`/`error` page, structured logging, a health check, request/DB error handling;
**Bring-Your-Own-Keys** wiring made real (swap `PAYMENTS_DRIVER=fake→stripe`, real object store) and
documented; a deploy path (Vercel + a managed Postgres + Stripe test keys) with a runbook; an analytics/
RUM stub behind a port; the **retrospective** (`docs/COURSE-RETROSPECTIVE.md`) — the arcs, the debates
the Reviewer won, what each flaw taught; the **flaw-ledger reveal** committed; the `docs/sprints/README.md`
flaw-arc line updated; **tag `v1.0.0` + GitHub Release**.

**Out:** actual production traffic, a real payment go-live, on-call/paging infrastructure (a runbook,
not a pager).

## Teaching focus

Operating what you built: config validation, error boundaries, health/logging, the deploy story; and
the meta-lesson — reading the whole course backwards through its planted flaws. **"What a polite LGTM
missed"** is the retrospective's centerpiece.

## Commit narrative (sketch)

1. `feat(ops): env validation (zod, fail-fast) + error boundaries + not-found`
2. `feat(ops): health check + structured logging + analytics port stub`
3. `docs(deploy): Vercel + managed Postgres + BYO Stripe keys + runbook`
4. `docs: COURSE-RETROSPECTIVE — arcs, Reviewer-won debates, flaw lessons`
5. `docs: REVEAL flaw-ledger.md with plant→harvest commit links`   ← the reveal
6. `chore(release): tag v1.0.0 + release notes`

## Teaching placements

- 📘 env validation: "validate config at boot with zod — a missing `DATABASE_URL` should fail on start,
  not on the first checkout."
- 📘 the reveal: each flaw with its plant PR, the blind-spot comment that praised the correct neighbor,
  the harvest RED test, and the fix — "the review wasn't lazy; it was human. This is what to look for."
- 🔗 every arc (money, trust boundary, optimistic UI, the webhook loop, performance) gets its closing
  line in the retrospective.

## Debate

`[Reviewer]`: "Revealing that we shipped known bugs makes the course look sloppy — quietly fix them and
skip the ledger." `[Author]`: the planted-and-harvested flaws are the **most transferable** thing here —
every one is a real bug a real review missed, with the fix shown as a RED→GREEN arc. Hiding them wastes
the whole pedagogy. **Resolution (Author wins — it's the thesis):** reveal in full, with commit links,
framed as *what a polite LGTM missed*. Recorded as the retrospective's thesis.

## Post-merge

Tag `v1.0.0`; GitHub Release: the full-course arc (S01→S15), the five flaws and their plant→harvest
links, and the study-order for a learner starting fresh.

## Exercises

- Re-read the S03/S04/S05 planting PRs *knowing* the flaws. Find the blind-spot comment in each and
  name the correct pattern it praised. Would you have caught the flaw next to it?
- Boot the app with a missing env var. Does it fail fast with a clear message, or 500 on first use?
- Trace one arc (say, the trust boundary) across S04 → S05 → S09. Write the three-sentence story of how
  one idea matured.
