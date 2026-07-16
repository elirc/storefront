// 📘 [Author] `loading.tsx` — Next renders this automatically while the server component's
// `await` is in flight (it wraps the route in a Suspense boundary for you). Shipping it in
// the same PR as the page is a house rule: a list has three non-happy states — loading,
// empty, error — and "it works when the data is already there" is only one of them.
//
// The skeleton's box model should echo the real card so the layout does not jump when data
// arrives (that jump is Cumulative Layout Shift — a Core Web Vitals penalty, addressed in S13).
export default function ProductsLoading() {
  return (
    <section className="space-y-4">
      <div className="h-8 w-32 animate-pulse rounded bg-muted" />
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <li key={i}>
            <div className="flex flex-col justify-between rounded-lg border bg-card p-4 shadow-sm">
              <div className="space-y-2">
                <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
              </div>
              <div className="mt-4 h-9 w-full animate-pulse rounded bg-muted" />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
