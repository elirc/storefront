"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

// 📘 [Author] `error.tsx` is the route's error boundary — the third of the three non-happy states
// (loading, empty, error). Two things Next requires make it a **Client Component**: it must carry
// `"use client"`, and it receives a `reset()` function whose whole job is a client-side event
// handler ("try again"). A boundary that offers a retry cannot be a static server component.
//
// ⚠️ [Author] This is NOT the empty state. Empty means "valid request, zero results" and reads
// calmly (that lives in page.tsx). Error means "something broke" — a dropped database connection,
// a query that threw — and it gets an apology and a retry, never "no products found". Different
// state, different component, different copy.
export default function ProductsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // In a real app this is where the error goes to the logger/monitoring (S13/S15). `digest` is
    // Next's server-side error id, safe to surface; the raw message is not shown to the shopper.
    console.error(error);
  }, [error]);

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
      <div
        role="alert"
        className="rounded-lg border border-dashed p-10 text-center text-muted-foreground"
      >
        <p className="font-medium text-foreground">Something went wrong loading products</p>
        <p className="text-sm">This is on us, not you. Try again in a moment.</p>
        <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => reset()}>
          Try again
        </Button>
      </div>
    </section>
  );
}
