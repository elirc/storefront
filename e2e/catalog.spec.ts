import { test, expect } from "@playwright/test";

// S02's catalog behavior, end-to-end against the seeded database: images with real alt text, the
// category nav filtering via the URL, "from" pricing on a price range, and the empty state as a
// distinct, calm state (not an error). Like the smoke spec, these assert behavior a shopper sees.

test("product cards render images with descriptive alt text", async ({ page }) => {
  await page.goto("/products");
  // The alt is the product's real name (from the DB), not a filename — so it's the image's
  // accessible name. (The <img> element is present regardless of whether optimization runs.)
  await expect(page.getByRole("img", { name: "Aurora Desk Lamp" }).first()).toBeVisible();
});

test("a multi-priced product shows a 'from' price", async ({ page }) => {
  await page.goto("/products");
  // Solstice Smart Bulb is seeded at 1200 (single) and 3900 (4-pack) → a real range → "From $12.00".
  await expect(page.getByText("From $12.00").first()).toBeVisible();
});

test("the category nav filters the catalog through the URL", async ({ page }) => {
  await page.goto("/products");

  const nav = page.getByRole("navigation", { name: "Product categories" });
  await nav.getByRole("link", { name: "Audio" }).click();

  await expect(page).toHaveURL(/\/products\?category=audio$/);
  // An audio product is present; a lighting product is not — the filter ran in SQL, not the UI.
  await expect(page.getByRole("heading", { name: "Resonant Over-Ear Headphones" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Aurora Desk Lamp" })).toHaveCount(0);
});

test("an empty result shows the empty state, not an error", async ({ page }) => {
  await page.goto("/products?category=this-category-does-not-exist");

  // Empty means "valid request, zero results" — it reads calmly and offers no retry. The error
  // boundary (which DOES have a "Try again") is a different state entirely.
  await expect(page.getByText(/No products/)).toBeVisible();
  await expect(page.getByRole("button", { name: /try again/i })).toHaveCount(0);
});
