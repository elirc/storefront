import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { money } from "@/lib/money";
import type { ProductListItem } from "@/server/services/catalog";
import { ProductCard } from "@/components/storefront/product-card";

// 🔍 [Reviewer] Component tests assert BEHAVIOR and ACCESSIBILITY — the name a shopper reads, the
// price string, the image's accessible name (its `alt`), the link target — not the markup. If a
// refactor keeps those true, the test stays green; that's the point. Zero DB, zero network: the
// card renders a plain view-model we build by hand.

function item(over: Partial<ProductListItem> = {}): ProductListItem {
  return {
    id: "p1",
    slug: "aurora-desk-lamp",
    name: "Aurora Desk Lamp",
    price: money(5900),
    priceVaries: false,
    inStock: true,
    image: { url: "/images/products/placeholder-01.png", alt: "Aurora Desk Lamp" },
    ...over,
  };
}

describe("ProductCard", () => {
  it("renders the product name as a heading whose link points to the detail route", () => {
    render(<ProductCard product={item()} />);
    // The card has two links to the product (the image and the title) — the standard storefront
    // pattern. Target the title link via its heading so the assertion is unambiguous.
    const heading = screen.getByRole("heading", { name: "Aurora Desk Lamp" });
    const link = within(heading).getByRole("link");
    expect(link).toHaveAttribute("href", "/product/aurora-desk-lamp");
  });

  it("formats the price at the edge (never raw cents)", () => {
    render(<ProductCard product={item({ price: money(5900) })} />);
    expect(screen.getByText("$59.00")).toBeInTheDocument();
    expect(screen.queryByText("5900")).not.toBeInTheDocument();
  });

  it('prefixes "From" only when the price varies across variants', () => {
    const { rerender } = render(<ProductCard product={item({ price: money(1200), priceVaries: true })} />);
    expect(screen.getByText("From $12.00")).toBeInTheDocument();

    rerender(<ProductCard product={item({ price: money(1200), priceVaries: false })} />);
    expect(screen.getByText("$12.00")).toBeInTheDocument();
    expect(screen.queryByText("From $12.00")).not.toBeInTheDocument();
  });

  it("gives the image a real, descriptive alt (its accessible name), not a filename", () => {
    render(<ProductCard product={item()} />);
    const img = screen.getByRole("img", { name: "Aurora Desk Lamp" });
    expect(img).toBeInTheDocument();
    expect(img.getAttribute("alt")).not.toMatch(/\.png$/);
  });

  it("falls back gracefully when the product has no image (no broken <img>)", () => {
    render(<ProductCard product={item({ image: null })} />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByText("No image available")).toBeInTheDocument();
  });

  it("surfaces stock state through the add-to-cart affordance", () => {
    render(<ProductCard product={item({ inStock: false })} />);
    expect(screen.getByRole("button", { name: /out of stock/i })).toBeDisabled();
  });
});
