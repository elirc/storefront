import Link from "next/link";

// The storefront shell — header + nav wrapped around every customer-facing page. It lives in
// the `(storefront)` route group so the (admin) surface (S09+) can have a different chrome
// without either group leaking into the other's URL. A Server Component: zero JS for the shell.
export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b">
        <div className="container flex h-14 items-center justify-between">
          <Link href="/" className="font-semibold tracking-tight">
            Storefront
          </Link>
          <nav aria-label="Primary" className="flex items-center gap-4 text-sm">
            <Link href="/" className="text-muted-foreground hover:text-foreground">
              Home
            </Link>
            <Link href="/products" className="text-muted-foreground hover:text-foreground">
              Products
            </Link>
          </nav>
        </div>
      </header>
      <main className="container flex-1 py-8">{children}</main>
      <footer className="border-t">
        <div className="container flex h-14 items-center text-sm text-muted-foreground">
          Storefront — a course, not a store. Numbers are illustrative.
        </div>
      </footer>
    </div>
  );
}
