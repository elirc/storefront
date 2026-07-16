# RSC vs Client: Where the Boundary Falls, and Why It Matters

**One-pager · seeded S01 · pairs with ADR-0001**

In the App Router, **every component is a Server Component until you opt out** with `"use client"`.
This is not a styling choice — it decides what runs where, what ships to the browser, and what a
component is *allowed to touch*. Getting the boundary right is the difference between a page that sends
30KB of JS and one that sends 300KB, and between a data query that runs on the server and one that
leaks to the client.

## The two kinds

| | Server Component (default) | Client Component (`"use client"`) |
|---|---|---|
| Runs | On the server (build/request) | On the server for the first render, then **hydrates and runs in the browser** |
| Can | `await` data, read the DB *through services*, read env/secrets, be `async` | Use `useState`/`useEffect`, event handlers, browser APIs, context |
| Cannot | Use hooks, `onClick`, browser APIs | Be `async`, import server-only modules, touch secrets or the DB |
| Ships to browser | **No JS** for the component itself | Yes — it's in the bundle |

## The mental model

> Server Components are the **page and its data**. Client Components are the **interactive islands**
> inside it. Keep the islands small and push them to the leaves.

A product page is a Server Component: it `await`s the product and reviews and renders them — zero JS
for all that markup. The **Add-to-Cart button**, the **variant picker**, the **filter sidebar** are
Client Components, because they need state and event handlers. The page stays a server component; the
button is a small `"use client"` leaf it renders.

```
ProductPage (server, async)          ← awaits product, renders markup, no JS shipped
├─ Gallery (server)
├─ <AddToCart variantId=…/> (client) ← the only island; useState + onClick live here
└─ Reviews (server, async)
```

## Rules that keep the boundary honest

- **Push `"use client"` down.** Marking a big layout client-side drags its whole subtree into the
  bundle. Mark the *button*, not the page.
- **Pass server data down as props.** A server component fetches, then hands plain data to a client
  island. Don't refetch on the client what the server already had.
- **Never fetch your own API from a server component.** Call the `server/services` function directly —
  it's already on the server. `fetch("/api/...")` from a server component is a round-trip to yourself.
- **Server-only stays server-only.** `server/data` and `server/services` import `server-only`; if a
  client component imports them, the build fails. That, plus the ESLint layering rule, is how the
  boundary is *enforced*, not just intended.
- **`async` is a server-component superpower.** Client components can't be `async`; they fetch with
  TanStack Query / `useEffect` when they truly need client-time data (optimistic, live).

## Why it's a headline skill

The most common Next.js performance and correctness bugs live here: a `"use client"` at the top of the
tree that balloons the bundle; a secret read in a component that turned out to ship to the browser; a
waterfall of client `fetch`es doing work the server could have done in one `await`. Drawing this
boundary well is most of what "good at the App Router" means.

## Try it

1. Add `"use client"` to a product listing page and run `next build`. Compare the First Load JS before
   and after. Where did the weight come from?
2. Put a `console.log(process.env.DATABASE_URL)` in a server component, then in a client component.
   Which one shows it in the browser console — and what does that tell you about what's safe where?
3. Take an interactive filter that currently lives at page level and extract just the interactive part
   into a small client island. What no longer ships to the browser?
