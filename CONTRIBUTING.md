# Working Agreements

These are the team rules Storefront is built under. They are enforced socially in review and
mechanically in CI. The learner does not push product code here — they study the merged PRs — but the
rules are written as if for a real team, because that is what makes them worth learning.

## The four Storefront rules

1. **The server owns the truth.** Prices, line totals, tax, discounts, and stock changes are computed
   **on the server, from the database**, on every request that matters. A number that arrives in a
   request body (a unit price, a total, a "the cart says $X") is *display state the client happened to
   have* — never authority. Recompute it. Trusting a client-sent price is a failed review.
2. **The layering rule is law.** UI → actions/route-handlers → services → data, with `lib/` as the
   framework-free shared kit and `ports/`+`adapters/` at the edges. **Client components never import
   the database; `server/services` never imports `next/*`, React, or Prisma directly; only
   `server/data` and `server/adapters` touch a vendor SDK.** This is enforced by an ESLint boundaries
   rule (plus `import 'server-only'`) that runs in CI from Sprint 1. The rule is never weakened to make
   a sprint easier — if it fights you, the design is wrong; fix the design and record it in an ADR.
3. **Money is integer minor units.** Money is represented as an integer count of the currency's
   smallest unit (cents), carried in a `Money` type, at every boundary. **No floats in money math** —
   no `parseFloat`, no `/ 100` arithmetic on the value, no `toFixed` outside the single formatting
   function. A source-scan fitness test fails the build if float money math appears in `server/`.
4. **Money-moving and inventory operations are idempotent and atomic.** Checkout fulfillment
   decrements stock in a transaction with a conditional update; the Stripe webhook is safe to receive
   twice and fulfills once. This is the *stated ideal from day one* — and, honestly, one the course
   deliberately falls short of early and repairs later (that is the flaw-harvest pedagogy; see below).

## Process — one sprint, one PR

- **One sprint = one branch = one PR**, squash-merged. Branch: `sprint-NN-short-slug`, cut from an
  up-to-date `main` **before** any code is written.
- Every sprint has a milestone (`Sprint NN`), one **stakeholder story issue** in a persona's voice,
  and **3–6 task issues** decomposing it.
- Commits are **ordered to teach**: data model → services → actions/handlers → UI → tests → docs, with
  lesson arcs as *real history* (a naive commit → a RED failing-test commit → the GREEN fix).
- The PR is opened from a `--body-file`: summary, a behavior walkthrough (with screenshots or a short
  Playwright trace), an **architecture-impact** section, teaching goals, a Definition-of-Done
  checklist, exercises, and `Closes #N` lines.
- Reviewer sign-off is a PR comment under the `[Reviewer]` persona (GitHub blocks self-approval; all
  personas post from one account, prefix-tagged). The sign-off comment *is* the approval.

## The per-sprint ritual (Phases A–G)

Every sprint follows this script. Sprint playbooks in `docs/sprints/` specify only what is unique to
that sprint.

- **A — Frame.** Milestone exists. Open the stakeholder story issue (persona voice) + 3–6 task issues;
  attach milestone and labels (`sprint-NN`, phase label, `enhancement`).
- **B — Branch & build.** `git checkout -b sprint-NN-slug` from fresh `main`. Build **outside-in from
  the data model**: Prisma model + migration → `server/data` repository → `server/services` logic
  (with exhaustive unit tests) → `server/actions` or `app/api` → `app/` + `components/` UI → E2E → docs
  (ADR, concept one-pager, and any `.http`/README updates).
- **C — Commit narrative.** 4–10 ordered commits telling the story. Commit body format below.
- **D — Pull request.** Push; open the PR from the body file.
- **E — Review theater (the heart of the course).** Post **8–11 inline comments** on diff lines, tagged
  and persona-prefixed (see conventions). Include **one design-debate thread** where `[Reviewer]`
  challenges a real decision and `[Author]` defends with trade-offs and a documented conclusion — and
  **≥3 times across the course the Reviewer wins** and a follow-up commit changes course.
- **F — Merge.** Squash-merge once CI is green (`gh pr merge <N> --squash --delete-branch`). Close the
  milestone. Sync local `main`.
- **G — Post-merge.** After S05: tag `v0.5.0` + GitHub Release (MVP recap). After S15: `v1.0.0` +
  Release + the flaw-ledger reveal. Update the `docs/sprints/` index if arcs shifted.

## Teaching-comment conventions

Inline PR review comments carry a **persona tag** and a **topic marker**.

Personas (all posted from the course account, prefix-tagged):

- `[Author] 📘` — the author explaining a concept or a deliberate choice.
- `[Reviewer] 🔍` — a senior reviewer applying a review lens ("what would I push back on here?").
- `[Stakeholder]` — the product/business voice, usually on the story issue, occasionally on a PR.

Topic markers (may appear with a persona, or in code comments):

| Marker | Means | Example |
|---|---|---|
| `📘` | **Concept** — teaches an idea | "RSC vs client: this file has no `useState`, so it stays a server component and never ships to the browser." |
| `🔍` | **Review lens** — how a reviewer reads this | "A form action should read like a checklist: validate, authorize, mutate, revalidate." |
| `⚠️` | **Pitfall** — a trap worth naming | "`revalidatePath` here or the list shows stale data after the mutation." |
| `🔗` | **Connects to** — links an arc across sprints | "This optimistic update gets its rollback in S14 — watch the error path." |
| `LEARN:` | in-code teaching note | `// LEARN: server components can be async; this await runs on the server, never in the bundle.` |
| `WHY:` | in-code rationale | `// WHY: recompute the total from the DB — the request body's total is not trusted.` |

In-code markers used in source: `// LEARN:` `// WHY:` `// GOTCHA:` `// TRY:`. Ordinary comments follow
ordinary rules — say what the code cannot.

## Commit convention

- Summary line: conventional-commit style, `type(scope): imperative` — e.g.
  `feat(cart): optimistic add-to-cart with TanStack Query`.
- Body sections, in this order, each optional but ordered when present:
  - `Why this way:` — the decision and its trade-off.
  - `Notice:` — something in the diff worth the reader's attention.
  - `See also:` — links to an ADR, concept, or a future sprint's arc.
- Trailer: end with `Refs #N` (or `Closes #N` on the commit that completes a task issue).
- A RED exposing-test commit says so in its summary: `test(orders): failing — webhook retry creates a
  second order (RED)`, followed by the GREEN fix commit.

## Quality gates (all must pass before merge)

```bash
pnpm typecheck        # tsc --noEmit; strict mode, no implicit any
pnpm lint             # eslint, INCLUDING the layering boundaries rule + money source-scan
pnpm test             # vitest: unit + component (Testing Library), zero DB/network
pnpm build            # next build
pnpm test:e2e         # Playwright against a Postgres service container + the fake payment gateway
```

- **Tests never require real credentials, cloud, or the network.** Unit/component tests use fakes for
  every port. E2E uses a Postgres service container, a MinIO/filesystem object store, and a
  **signed-fake Stripe gateway** with a constant test webhook secret — no real Stripe keys.
- CI runs the same gates. There is **no secret-scanning or dependency-audit job** — this course keeps
  security light and folds it into ordinary correctness (validate input, escape UGC, never trust
  client prices) rather than making it a headline theme.
- Every new dependency gets a **one-line justification** in the ADR of the sprint that introduces it.

## The flaw-harvest pedagogy

Five realistic frontend/full-stack flaws are planted silently in early sprints and harvested later
with RED→GREEN arcs. Between plant and harvest, `main` is knowingly imperfect — that is intentional and
made auditable by the ledger reveal after S15. The most transferable reviewer skill this teaches is
**what a polite LGTM missed**: in each planting PR, a `[Reviewer]` comment praises a genuinely-correct
pattern *next to* the flaw, and says nothing about the flaw. The author-private ledger is never
referenced by committed content until the S15 reveal.
