import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { money } from "@/lib/money";
import type { ProductListItem } from "@/server/services/catalog";
import { ProductGrid } from "@/components/storefront/product-grid";
import { EmptyState } from "@/components/storefront/empty-state";

function item(id: string, name: string, slug: string): ProductListItem {
  return {
    id,
    slug,
    name,
    price: money(1999),
    priceVaries: false,
    inStock: true,
    image: { url: "/images/products/placeholder-01.png", alt: name },
  };
}

describe("ProductGrid", () => {
  it("renders one card per product", () => {
    const products = [
      item("1", "Aurora Desk Lamp", "aurora-desk-lamp"),
      item("2", "Meridian Backpack", "meridian-backpack"),
      item("3", "Harbor Ceramic Mug", "harbor-ceramic-mug"),
    ];
    render(<ProductGrid products={products} />);

    expect(screen.getAllByRole("article")).toHaveLength(3);
    expect(screen.getByRole("heading", { name: "Aurora Desk Lamp" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Meridian Backpack" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Harbor Ceramic Mug" })).toBeInTheDocument();
  });

  it("marks only the first card's image as priority (the single LCP)", () => {
    // next/image lazy-loads by default; a `priority` image opts OUT of lazy loading (it's the LCP,
    // so it should start fetching immediately). So exactly the first image is non-lazy.
    render(
      <ProductGrid products={[item("1", "First", "first"), item("2", "Second", "second")]} />,
    );
    const imgs = screen.getAllByRole("img");
    expect(imgs[0]).not.toHaveAttribute("loading", "lazy");
    expect(imgs[1]).toHaveAttribute("loading", "lazy");
  });
});

describe("EmptyState", () => {
  it("shows its title and message when a listing has zero results", () => {
    render(
      <EmptyState title="No products in Audio">
        Try browsing all products.
      </EmptyState>,
    );
    expect(screen.getByText("No products in Audio")).toBeInTheDocument();
    expect(screen.getByText(/browsing all products/i)).toBeInTheDocument();
  });
});
