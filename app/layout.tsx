import type { Metadata } from "next";
import "./globals.css";

// The root layout — the one <html>/<body> for every route. It is a Server Component (no
// "use client"), so nothing here ships to the browser except the markup it produces.
export const metadata: Metadata = {
  title: {
    default: "Storefront",
    template: "%s · Storefront",
  },
  description: "A production-shaped e-commerce storefront, built as a course.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
