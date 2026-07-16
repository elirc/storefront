# Sprint 14 — Accessibility + i18n + SEO + E2E Depth

**Goal:** make the storefront usable by keyboard and screen reader, translatable, discoverable, and
covered by deep end-to-end tests — including the error paths. The harvest is one of those error paths:
the add-to-cart optimistic update that never rolled back.

> **Harvest: flaw 5 (missing optimistic rollback).** A Playwright test forces the add-to-cart mutation
> to fail and asserts the cart reverts. RED under the S04 code, GREEN after wiring `onError`/`onSettled`.

## Scope

**In:** accessibility pass — keyboard nav + visible focus, focus management for the cart drawer/modals
(focus trap, restore, `Esc`), ARIA roles/labels, form error association, color-contrast; **axe** in
component tests and a Playwright a11y sweep in CI; i18n scaffolding (message catalog, `next-intl` or
equivalent, locale routing, formatting via `Intl` — money/date/number) with one second locale to prove
the seam; SEO — sitemap, `robots`, canonical URLs, Open Graph, JSON-LD product structured data; **E2E
depth** — the flagship flows plus **error paths** (payment failure, out-of-stock at checkout, and the
add-to-cart failure that is the harvest); the harvest fix — add `onError` (restore snapshot) and
`onSettled` (invalidate) to the S04 add-to-cart mutation.

**Out:** full localization of all copy (the seam + one locale is the lesson), RTL layout polish, an
accessibility audit certification.

## Teaching focus

Accessibility as a build requirement, not a retrofit (focus management is the hardest and most-skipped
part); i18n as a **seam** (extract strings, format via `Intl`) more than a translation project; SEO
metadata/structured data; E2E tests that exercise the **unhappy** paths.

## Commit narrative (sketch)

1. `feat(a11y): keyboard nav, focus management (drawer/modal), ARIA, axe in tests`
2. `feat(i18n): message catalog + locale routing + Intl formatting + one locale`
3. `feat(seo): sitemap, robots, canonical, OG, JSON-LD product data`
4. `test(e2e): failing — add-to-cart failure leaves a phantom cart item (RED)`   ← harvest RED
5. `fix(cart): onError rollback + onSettled reconcile on the add mutation (GREEN)`
6. `test(e2e): payment-failure + out-of-stock-at-checkout error paths`
7. `docs: ADR-0015 a11y/i18n/SEO baseline; concepts/focus-management.md`

## Teaching placements

- 📘 focus management: after closing the cart drawer, focus returns to the trigger; a modal traps focus
  and `Esc` closes it — "a keyboard user must never get lost."
- 📘 the harvest: "the optimistic update from S04 finally gets its other half — `onError` restores the
  snapshot, `onSettled` reconciles." 🔗 back to the S04 🔍 that praised `onMutate` alone.
- ⚠️ i18n and money: format money with `Intl` per locale — never string-concatenate a currency symbol.
- 🔍 JSON-LD must match what's on the page (price, availability) or it's structured *mis*information.

## Debate

`[Reviewer]`: "Accessibility is polish — ship it as a fast-follow after v1." `[Author]`: focus
management and semantics are structural; retrofitting them means rewriting components, and a checkout a
keyboard user can't complete isn't done. **Resolution (Author wins, firmly):** a11y is in the
Definition of Done from here on; ADR-0015 adds axe + a keyboard-path E2E as standing gates. (The
Reviewer's "fast-follow" instinct is explicitly rejected and logged.)

## Exercises

- Complete the entire browse→checkout flow with the mouse unplugged. Where do you get stuck? Fix that.
- Force the add-to-cart action to 409 in Playwright and assert the badge/drawer revert (the harvest).
  Then re-introduce the S04 code and watch the test go red — that's the flaw, pinned.
- Switch locales and confirm money and dates reformat via `Intl`, not hardcoded strings.
