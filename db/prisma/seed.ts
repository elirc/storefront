// Demo catalog seed. Runs via `pnpm db:seed` (locally after `pnpm db:migrate`) and in CI's
// e2e job after `prisma migrate deploy`. Idempotent — upsert by the natural keys (product
// slug, variant sku) — so it is safe to run repeatedly on the same database.
//
// NOTE: this is a build/ops script, not application code, so it imports PrismaClient directly
// rather than going through `server/data` (which is `server-only` and would refuse to load in
// a plain Node process). The layering rule is scoped to app + server source, not scripts.
//
// Prices are integer cents (ADR-0002). Numbers are illustrative, never a real catalog.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type SeedVariant = { name: string; sku: string; priceCents: number; stock: number };
type SeedProduct = {
  slug: string;
  name: string;
  description: string;
  variants: SeedVariant[];
};

const CATALOG: SeedProduct[] = [
  {
    slug: "aurora-desk-lamp",
    name: "Aurora Desk Lamp",
    description: "A warm, dimmable LED desk lamp with a brushed-aluminium arm.",
    variants: [
      { name: "Graphite", sku: "LAMP-AUR-GRAPHITE", priceCents: 5900, stock: 42 },
      { name: "Ivory", sku: "LAMP-AUR-IVORY", priceCents: 5900, stock: 30 },
    ],
  },
  {
    slug: "meridian-backpack",
    name: "Meridian Backpack",
    description: "A 22L water-resistant commuter backpack with a padded laptop sleeve.",
    variants: [
      { name: "Slate 22L", sku: "BAG-MER-SLATE-22", priceCents: 12900, stock: 18 },
      { name: "Olive 22L", sku: "BAG-MER-OLIVE-22", priceCents: 12900, stock: 12 },
    ],
  },
  {
    slug: "harbor-ceramic-mug",
    name: "Harbor Ceramic Mug",
    description: "A 350ml stoneware mug with a comfortable full-loop handle.",
    variants: [{ name: "350ml", sku: "MUG-HAR-350", priceCents: 1800, stock: 120 }],
  },
  {
    slug: "cadence-wireless-earbuds",
    name: "Cadence Wireless Earbuds",
    description: "Bluetooth 5.3 earbuds with 28-hour case battery and a low-latency mode.",
    variants: [{ name: "Standard", sku: "AUD-CAD-STD", priceCents: 8900, stock: 0 }],
  },
  {
    slug: "trailhead-water-bottle",
    name: "Trailhead Water Bottle",
    description: "A 750ml vacuum-insulated bottle that keeps cold drinks cold for 24 hours.",
    variants: [
      { name: "750ml Storm", sku: "BTL-TRA-750-STORM", priceCents: 3200, stock: 64 },
      { name: "750ml Sand", sku: "BTL-TRA-750-SAND", priceCents: 3200, stock: 51 },
    ],
  },
  {
    slug: "atlas-notebook",
    name: "Atlas Dot-Grid Notebook",
    description: "A5 hardcover notebook, 192 dot-grid pages, lay-flat binding.",
    variants: [{ name: "A5 Dot-Grid", sku: "STA-ATL-A5", priceCents: 1450, stock: 200 }],
  },
];

async function main() {
  for (const p of CATALOG) {
    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: { name: p.name, description: p.description },
      create: { slug: p.slug, name: p.name, description: p.description },
    });

    for (const v of p.variants) {
      await prisma.productVariant.upsert({
        where: { sku: v.sku },
        update: {
          name: v.name,
          priceCents: v.priceCents,
          stock: v.stock,
          productId: product.id,
        },
        create: {
          name: v.name,
          sku: v.sku,
          priceCents: v.priceCents,
          currency: "USD",
          stock: v.stock,
          productId: product.id,
        },
      });
    }
  }

  const products = await prisma.product.count();
  const variants = await prisma.productVariant.count();
  console.log(`Seeded ${products} products / ${variants} variants.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
