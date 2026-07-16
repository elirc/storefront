# Optimistic UI: The Update You Have to Be Able to Take Back

**One-pager · seeded S04 · pairs with ADR-0004**

An optimistic update shows the result of a mutation **before the server confirms it** — the cart badge
ticks to 3 the instant you click "add," not 300ms later when the round-trip returns. It makes an app
feel fast. It also quietly signs you up for a promise: **if the server says no, you must put the UI
back exactly as it was.** An optimistic update without a rollback is not a fast UI — it's a UI that
lies when the network or the server disagrees.

## The three moments

TanStack Query models them as a triple you should never split up:

```ts
useMutation({
  mutationFn: addToCartAction,
  onMutate: async (line) => {
    await queryClient.cancelQueries({ queryKey: ["cart"] });     // stop in-flight refetch clobbering us
    const previous = queryClient.getQueryData(["cart"]);          // 1. SNAPSHOT the truth
    queryClient.setQueryData(["cart"], (c) => addLine(c, line));  // 2. apply the OPTIMISTIC change
    return { previous };                                          //    hand the snapshot to onError
  },
  onError: (_err, _line, ctx) => {
    queryClient.setQueryData(["cart"], ctx.previous);             // 3. ROLL BACK to the snapshot
  },
  onSettled: () => queryClient.invalidateQueries({ queryKey: ["cart"] }), // reconcile with the server
});
```

- **`onMutate`** — snapshot, then apply. The snapshot is the whole point; skip it and you have nothing
  to restore.
- **`onError`** — restore the snapshot. This is the line that gets forgotten, because the happy path
  looks perfect without it.
- **`onSettled`** — invalidate so the optimistic guess is replaced by server truth (the real line id,
  the recomputed total).

## What "no rollback" looks like

The add-to-cart button optimistically adds the item; the variant is out of stock; the server returns
409; `onError` isn't wired. The item stays in the drawer, the badge stays at 3, the total is wrong —
until a hard refresh. QA files "cart shows an item I couldn't add." It's not a rare edge case; it's
**every** failed mutation.

> Storefront plants exactly this gap in S04 and harvests it in S14 with a Playwright test that forces
> the mutation to fail and asserts the cart reverts. Watch the `onError` handler across those two
> sprints.

## Rules of thumb

- **Only go optimistic when you can predict the result** and reverse it. Adding a known line to a cart:
  yes. Anything whose outcome you can't compute locally: show a pending state instead.
- **Always snapshot in `onMutate`, always restore in `onError`, always reconcile in `onSettled`.** Treat
  the three as one unit in review — a mutation with `onMutate` but no `onError` is an incomplete diff.
- **Keep the optimistic state derivable.** Compute the badge count from the cart data, not a second
  counter you have to keep in sync.
- **Disable or guard against double-submits** while a mutation is in flight, or two optimistic updates
  race.

## Try it

1. Delete the `onError` handler and, in the network tab, throttle + force a 500 on the add-to-cart
   call. Watch the drawer keep the phantom item. This is the S04 flaw, live.
2. Re-add `onError` restoring `ctx.previous`. Force the 500 again. Watch the item disappear and the
   badge revert.
3. Remove `onSettled`'s invalidate. Add a real item successfully — notice the optimistic line keeps its
   fake temporary id instead of the server's. Why does reconciliation matter even on success?
