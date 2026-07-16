import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

// 📘 [Author] The explicit **empty** state, as a tiny reusable presentational component. "Empty"
// means a valid request returned zero results — a category with nothing in it, a fresh database.
// It is deliberately NOT the error state (that's `error.tsx`, with a retry): different meaning,
// different copy. Pulling it into its own component makes it unit-testable in isolation and keeps
// the page readable — the page decides *what* the message says (it knows the active category),
// this decides *how* an empty state looks.
export function EmptyState({
  title,
  children,
  className,
}: {
  title: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-dashed p-10 text-center text-muted-foreground",
        className,
      )}
    >
      <p className="font-medium text-foreground">{title}</p>
      {children ? <p className="mt-1 text-sm">{children}</p> : null}
    </div>
  );
}
