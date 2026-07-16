import { test, expect } from "@playwright/test";

// The walking skeleton's one E2E: the pages render real, seeded products end-to-end —
// browser → Next server → catalog service → Postgres. It asserts *behavior a user sees*
// (a heading, a visible product name, a link that navigates), not implementation detail.
// The browse → cart → checkout flagship flow grows onto this file over the next sprints.

test("home page renders and links to the catalog", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  await page.getByRole("link", { name: "Browse all products" }).click();
  await expect(page).toHaveURL(/\/products$/);
});

test("product grid renders a seeded product", async ({ page }) => {
  await page.goto("/products");

  await expect(page.getByRole("heading", { name: "Products", level: 1 })).toBeVisible();

  // A product the seed guarantees exists. Asserting a concrete name proves the full read path
  // (service → data → Postgres) actually returned rows, not just that the page shell rendered.
  await expect(page.getByRole("link", { name: "Aurora Desk Lamp" })).toBeVisible();

  // Money is formatted at the edge — the grid shows a currency string, never raw cents.
  await expect(page.getByText("$59.00").first()).toBeVisible();
});

test("the add-to-cart affordance is present but disabled (cart lands in S04)", async ({
  page,
}) => {
  await page.goto("/products");
  const firstAddButton = page.getByRole("button", { name: /Add to cart|Out of stock/ }).first();
  await expect(firstAddButton).toBeVisible();
  await expect(firstAddButton).toBeDisabled();
});
