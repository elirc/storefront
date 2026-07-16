# Sprint 11 — Auth + Accounts + Roles (Customer/Seller)

**Goal:** real accounts. Sign up / sign in, sessions, protected routes and actions, and two roles —
`customer` (storefront + own orders/reviews) and `seller` (admin) — enforced in middleware and in the
write path.

## Scope

**In:** Auth (Auth.js/NextAuth or Lucia — pinned in the ADR) with email+password and/or an OAuth
provider in test mode; `Account`/`Session`/`Role`; middleware protecting `/admin/**` and `/account/**`;
**server actions authorize before they mutate** (not just the route); linking the S04 guest cart to the
account on login (merge carts); account pages (profile, orders, reviews). Authorization is treated as
an ordinary feature, folded into correctness — not a security headline.

**Out:** MFA, password reset flows beyond a stub, SSO/enterprise, fine-grained permissions (two roles
is the scope).

## Teaching focus

Auth in the App Router (session in RSC vs client, `middleware.ts`); **RBAC at two layers** — the
route (middleware) *and* the action (defense the route can't provide, since actions are callable
directly); guest→account cart merge; reading the session server-side without shipping it to the client.

## Commit narrative (sketch)

1. `feat(auth): provider + Account/Session/Role + migration`
2. `feat(auth): middleware guards for /admin and /account`
3. `feat(actions): authorize-in-the-action (role checks at the mutation)`
4. `feat(cart): merge guest cart into account on login`
5. `test: unauthorized action is rejected; seller-only admin; cart merge`
6. `docs: ADR-0012 auth + two-layer RBAC; concepts/authz-in-app-router.md`

## Teaching placements

- 📘 "the middleware guards the *page*; the **action** must guard the *mutation* — a server action is a
  public entry point, callable without ever loading the page."
- ⚠️ don't read the session in a client component and trust it for authz — the client can lie; authorize
  on the server.
- 🔍 cart merge: dedupe lines by variant, sum quantities, re-read prices (S09's rule still applies).

## Debate

`[Reviewer]`: "Middleware already blocks non-sellers from `/admin` — re-checking the role inside each
admin action is belt-and-suspenders noise." `[Author]`: the action is directly invocable (it's an RPC
endpoint under the hood); middleware never runs for a crafted action call. **Resolution (Author wins —
important):** authorize in **both** places; ADR-0012 records *every mutating action authorizes itself,
independent of any route guard.* (An organic security lesson, kept as plain correctness.)

## Exercises

- Call an admin server action while signed in as a customer (bypass the UI). Is it rejected? If only the
  middleware guards it, it isn't — prove it, then fix it.
- Add a guest item, sign in, confirm the cart merged (and prices re-read).
- Where does the session live on a server-rendered page vs a client island — and which one is safe to
  trust?
