"use client";

import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";

// 📘 [Author] The first Client Component in the codebase — and it is deliberately a *stub*.
//
// "use client" marks the boundary: this file (and only this file, not the page that renders
// it) hydrates and runs in the browser. In S04 it grows real state and an event handler — an
// optimistic add-to-cart via TanStack Query, with a rollback on the error path. Shipping the
// island now, disabled, keeps the seam visible: the page around it is a Server Component that
// ships zero JS, and the interactivity is pushed down to this small leaf.
//
// GOTCHA: because this is a Client Component, it must NOT import `server/**`. It takes the
// data it needs (here, just whether the variant is buyable) as props from its server parent.
export function AddToCart({ inStock }: { inStock: boolean }) {
  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      disabled
      aria-disabled="true"
      title="Cart lands in Sprint 04"
      className="w-full"
    >
      <ShoppingCart className="size-4" aria-hidden="true" />
      {inStock ? "Add to cart" : "Out of stock"}
      <span className="text-xs font-normal opacity-70">(S04)</span>
    </Button>
  );
}
