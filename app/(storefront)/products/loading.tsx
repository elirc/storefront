// 📘 [Author] `loading.tsx` — Next renders this automatically while the page's `await` is in
// flight (it wraps the route in a Suspense boundary for you). It ships in the same PR as the page
// because a list has three non-happy states — loading, empty, error — and "it works when the data
// is already there" is only one of them.
//
// 🔍 [Reviewer] The skeleton must echo the REAL card's box model, or the layout jumps when data
// arrives — that jump is Cumulative Layout Shift, a Core Web Vitals penalty (tuned in S13). So
// the grid classes and the aspect-square image box below are deliberately the same as
// ProductGrid + ProductCard. Accessibility and Core Web Vitals both live here.
export default function ProductsLoading() {
  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <div className="h-8 w-32 animate-pulse rounded bg-muted" />
        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
      </div>

      {/* Category-nav pills placeholder */}
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-7 w-20 animate-pulse rounded-full bg-muted" />
        ))}
      </div>

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <li key={i}>
            <div className="flex flex-col overflow-hidden rounded-lg border bg-card shadow-sm">
              {/* Same aspect-square box as the card image, so the grid doesn't reflow on load. */}
              <div className="aspect-square animate-pulse bg-muted" />
              <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="space-y-2">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
                </div>
                <div className="h-9 w-full animate-pulse rounded bg-muted" />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
