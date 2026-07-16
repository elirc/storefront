// Demo catalog seed. Runs via `pnpm db:seed` (locally after `pnpm db:migrate`) and in CI's
// e2e job after `prisma migrate deploy`. Idempotent — upsert by natural keys (category slug,
// product slug, variant sku) and rebuild each product's images by (productId, position) — so it
// is safe to run repeatedly on the same database.
//
// NOTE: this is a build/ops script, not application code, so it imports PrismaClient directly
// rather than going through `server/data` (which is `server-only` and would refuse to load in a
// plain Node process). The layering rule is scoped to app + server source, not scripts.
//
// Prices are integer cents (ADR-0002). Numbers, names, and images are illustrative — a shape,
// not a real catalog. The images are seeded local placeholders under /public; real upload and
// on-the-fly variants are S10.
import { PrismaClient, type Prisma } from "@prisma/client";

const prisma = new PrismaClient();

const CATEGORIES = [
  { slug: "lighting", name: "Lighting" },
  { slug: "bags", name: "Bags" },
  { slug: "drinkware", name: "Drinkware" },
  { slug: "audio", name: "Audio" },
  { slug: "stationery", name: "Stationery" },
  { slug: "outdoor", name: "Outdoor" },
  { slug: "home", name: "Home" },
] as const;

type SeedVariant = {
  name: string;
  sku: string;
  priceCents: number;
  stock: number;
  attributes?: Prisma.InputJsonValue;
};
type SeedProduct = {
  slug: string;
  name: string;
  description: string;
  categorySlugs: string[];
  /** Placeholder tile numbers (1–8). First is the primary image; empty = no images (fallback). */
  img: number[];
  variants: SeedVariant[];
};

// 24 products across 7 categories. A few deliberate shapes the read surface (and its tests)
// depend on:
//   * variants at DIFFERENT prices → the card shows "From $X" (solstice, cargo, tumbler, pulse,
//     grove); variants at the SAME price show a plain price (aurora, meridian, ...).
//   * cadence-wireless-earbuds has stock 0 everywhere → "Out of stock" affordance.
//   * nimbus-throw-blanket has NO images → the card falls back gracefully (the missing-image
//     test and exercise both exist because this row does).
const CATALOG: SeedProduct[] = [
  // --- Lighting ---------------------------------------------------------------------------
  {
    slug: "aurora-desk-lamp",
    name: "Aurora Desk Lamp",
    description: "A warm, dimmable LED desk lamp with a brushed-aluminium arm.",
    categorySlugs: ["lighting"],
    img: [1, 4],
    variants: [
      { name: "Graphite", sku: "LAMP-AUR-GRAPHITE", priceCents: 5900, stock: 42, attributes: { color: "Graphite" } },
      { name: "Ivory", sku: "LAMP-AUR-IVORY", priceCents: 5900, stock: 30, attributes: { color: "Ivory" } },
    ],
  },
  {
    slug: "lumen-floor-lamp",
    name: "Lumen Floor Lamp",
    description: "A slim uplight floor lamp with a stepless dimmer and a weighted base.",
    categorySlugs: ["lighting"],
    img: [2, 5],
    variants: [{ name: "Standard", sku: "LAMP-LUM-STD", priceCents: 14900, stock: 15 }],
  },
  {
    slug: "halo-bedside-light",
    name: "Halo Bedside Light",
    description: "A soft-glow bedside lamp with a tap-to-dim touch base.",
    categorySlugs: ["lighting"],
    img: [3, 6],
    variants: [
      { name: "Warm White", sku: "LAMP-HAL-WARM", priceCents: 3400, stock: 60, attributes: { temperature: "2700K" } },
      { name: "Cool White", sku: "LAMP-HAL-COOL", priceCents: 3400, stock: 48, attributes: { temperature: "4000K" } },
    ],
  },
  {
    slug: "solstice-smart-bulb",
    name: "Solstice Smart Bulb",
    description: "A tunable-white smart bulb; buy one or a value four-pack.",
    categorySlugs: ["lighting"],
    img: [4, 7],
    variants: [
      { name: "Single (E27)", sku: "BULB-SOL-1", priceCents: 1200, stock: 200, attributes: { pack: 1, base: "E27" } },
      { name: "4-pack (E27)", sku: "BULB-SOL-4", priceCents: 3900, stock: 80, attributes: { pack: 4, base: "E27" } },
    ],
  },
  // --- Bags -------------------------------------------------------------------------------
  {
    slug: "meridian-backpack",
    name: "Meridian Backpack",
    description: "A 22L water-resistant commuter backpack with a padded laptop sleeve.",
    categorySlugs: ["bags"],
    img: [5, 8],
    variants: [
      { name: "Slate 22L", sku: "BAG-MER-SLATE-22", priceCents: 12900, stock: 18, attributes: { color: "Slate", size: "22L" } },
      { name: "Olive 22L", sku: "BAG-MER-OLIVE-22", priceCents: 12900, stock: 12, attributes: { color: "Olive", size: "22L" } },
    ],
  },
  {
    slug: "cargo-duffel",
    name: "Cargo Duffel",
    description: "A rugged weekender duffel with a wet-kit pocket, in two capacities.",
    categorySlugs: ["bags", "outdoor"],
    img: [6, 1],
    variants: [
      { name: "40L", sku: "BAG-CAR-40", priceCents: 8900, stock: 22, attributes: { size: "40L" } },
      { name: "60L", sku: "BAG-CAR-60", priceCents: 10900, stock: 14, attributes: { size: "60L" } },
    ],
  },
  {
    slug: "everyday-tote",
    name: "Everyday Tote",
    description: "A structured canvas tote with an internal zip pocket.",
    categorySlugs: ["bags"],
    img: [7, 2],
    variants: [{ name: "Natural", sku: "BAG-EVE-NAT", priceCents: 4500, stock: 70, attributes: { color: "Natural" } }],
  },
  {
    slug: "transit-sling",
    name: "Transit Sling",
    description: "A low-profile crossbody sling for a phone, keys, and a battery pack.",
    categorySlugs: ["bags"],
    img: [8, 3],
    variants: [
      { name: "Black", sku: "BAG-TRA-BLK", priceCents: 3900, stock: 40, attributes: { color: "Black" } },
      { name: "Sand", sku: "BAG-TRA-SAND", priceCents: 3900, stock: 33, attributes: { color: "Sand" } },
    ],
  },
  // --- Drinkware --------------------------------------------------------------------------
  {
    slug: "harbor-ceramic-mug",
    name: "Harbor Ceramic Mug",
    description: "A 350ml stoneware mug with a comfortable full-loop handle.",
    categorySlugs: ["drinkware"],
    img: [1, 5],
    variants: [{ name: "350ml", sku: "MUG-HAR-350", priceCents: 1800, stock: 120 }],
  },
  {
    slug: "trailhead-water-bottle",
    name: "Trailhead Water Bottle",
    description: "A 750ml vacuum-insulated bottle that keeps cold drinks cold for 24 hours.",
    categorySlugs: ["drinkware", "outdoor"],
    img: [2, 6],
    variants: [
      { name: "750ml Storm", sku: "BTL-TRA-750-STORM", priceCents: 3200, stock: 64, attributes: { color: "Storm", size: "750ml" } },
      { name: "750ml Sand", sku: "BTL-TRA-750-SAND", priceCents: 3200, stock: 51, attributes: { color: "Sand", size: "750ml" } },
    ],
  },
  {
    slug: "atlas-travel-tumbler",
    name: "Atlas Travel Tumbler",
    description: "A leak-resistant travel tumbler with a magnetic slide lid.",
    categorySlugs: ["drinkware"],
    img: [3, 7],
    variants: [
      { name: "350ml", sku: "TUM-ATL-350", priceCents: 2400, stock: 90, attributes: { size: "350ml" } },
      { name: "500ml", sku: "TUM-ATL-500", priceCents: 2800, stock: 76, attributes: { size: "500ml" } },
    ],
  },
  {
    slug: "daybreak-french-press",
    name: "Daybreak French Press",
    description: "A 600ml borosilicate French press with a stainless double filter.",
    categorySlugs: ["drinkware", "home"],
    img: [4, 8],
    variants: [{ name: "600ml", sku: "PRESS-DAY-600", priceCents: 3600, stock: 38 }],
  },
  // --- Audio ------------------------------------------------------------------------------
  {
    slug: "cadence-wireless-earbuds",
    name: "Cadence Wireless Earbuds",
    description: "Bluetooth 5.3 earbuds with 28-hour case battery and a low-latency mode.",
    categorySlugs: ["audio"],
    img: [5, 1],
    variants: [{ name: "Standard", sku: "AUD-CAD-STD", priceCents: 8900, stock: 0 }],
  },
  {
    slug: "resonant-over-ear",
    name: "Resonant Over-Ear Headphones",
    description: "Closed-back over-ear headphones with 40mm drivers and plush earpads.",
    categorySlugs: ["audio"],
    img: [6, 2],
    variants: [
      { name: "Black", sku: "AUD-RES-BLK", priceCents: 19900, stock: 20, attributes: { color: "Black" } },
      { name: "Sand", sku: "AUD-RES-SAND", priceCents: 19900, stock: 16, attributes: { color: "Sand" } },
    ],
  },
  {
    slug: "pulse-portable-speaker",
    name: "Pulse Portable Speaker",
    description: "A splash-proof Bluetooth speaker in compact and max sizes.",
    categorySlugs: ["audio"],
    img: [7, 3],
    variants: [
      { name: "Compact", sku: "AUD-PUL-CMP", priceCents: 5500, stock: 44, attributes: { size: "Compact" } },
      { name: "Max", sku: "AUD-PUL-MAX", priceCents: 9900, stock: 26, attributes: { size: "Max" } },
    ],
  },
  {
    slug: "echo-clip-mic",
    name: "Echo Clip Mic",
    description: "A clip-on omnidirectional mic for calls and voice notes.",
    categorySlugs: ["audio"],
    img: [8, 4],
    variants: [{ name: "Standard", sku: "AUD-ECH-STD", priceCents: 4200, stock: 55 }],
  },
  // --- Stationery -------------------------------------------------------------------------
  {
    slug: "atlas-notebook",
    name: "Atlas Dot-Grid Notebook",
    description: "A5 hardcover notebook, 192 dot-grid pages, lay-flat binding.",
    categorySlugs: ["stationery"],
    img: [1, 6],
    variants: [{ name: "A5 Dot-Grid", sku: "STA-ATL-A5", priceCents: 1450, stock: 200 }],
  },
  {
    slug: "summit-fountain-pen",
    name: "Summit Fountain Pen",
    description: "A brass-bodied fountain pen with a smooth stainless nib.",
    categorySlugs: ["stationery"],
    img: [2, 7],
    variants: [
      { name: "Fine nib", sku: "STA-SUM-F", priceCents: 5400, stock: 34, attributes: { nib: "Fine" } },
      { name: "Medium nib", sku: "STA-SUM-M", priceCents: 5400, stock: 29, attributes: { nib: "Medium" } },
    ],
  },
  {
    slug: "field-notes-set",
    name: "Field Notes Set",
    description: "A three-pack of pocket memo books with a soft kraft cover.",
    categorySlugs: ["stationery"],
    img: [3, 8],
    variants: [{ name: "3-pack", sku: "STA-FLD-3", priceCents: 1200, stock: 150, attributes: { pack: 3 } }],
  },
  {
    slug: "horizon-desk-mat",
    name: "Horizon Desk Mat",
    description: "A large felt-and-cork desk mat with a stitched edge.",
    categorySlugs: ["stationery", "home"],
    img: [4, 1],
    variants: [{ name: "Large", sku: "STA-HOR-L", priceCents: 3800, stock: 47, attributes: { size: "Large" } }],
  },
  // --- Outdoor ----------------------------------------------------------------------------
  {
    slug: "cirrus-camp-chair",
    name: "Cirrus Camp Chair",
    description: "A packable aluminium camp chair that folds to bottle size.",
    categorySlugs: ["outdoor"],
    img: [5, 2],
    variants: [{ name: "Standard", sku: "OUT-CIR-STD", priceCents: 6400, stock: 28 }],
  },
  {
    slug: "summit-headlamp",
    name: "Summit Headlamp",
    description: "A 400-lumen rechargeable headlamp with a red night mode.",
    categorySlugs: ["outdoor"],
    img: [6, 3],
    variants: [{ name: "Standard", sku: "OUT-SUM-STD", priceCents: 2900, stock: 9 }],
  },
  // --- Home -------------------------------------------------------------------------------
  {
    slug: "nimbus-throw-blanket",
    name: "Nimbus Throw Blanket",
    description: "A brushed-fleece throw — cloud-soft, machine washable. (Photography pending.)",
    categorySlugs: ["home"],
    img: [], // intentionally no images: exercises the card's graceful fallback
    variants: [{ name: "Standard", sku: "HOM-NIM-STD", priceCents: 4900, stock: 52 }],
  },
  {
    slug: "grove-planter-pot",
    name: "Grove Planter Pot",
    description: "A self-watering ceramic planter with a matte glaze, in two sizes.",
    categorySlugs: ["home"],
    img: [7, 4],
    variants: [
      { name: "Small", sku: "HOM-GRO-S", priceCents: 1900, stock: 64, attributes: { size: "Small" } },
      { name: "Large", sku: "HOM-GRO-L", priceCents: 2600, stock: 41, attributes: { size: "Large" } },
    ],
  },
];

function imageUrl(n: number): string {
  return `/images/products/placeholder-${String(n).padStart(2, "0")}.png`;
}

async function main() {
  // Categories first — products connect to them by slug.
  for (const c of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name },
      create: { slug: c.slug, name: c.name },
    });
  }

  for (const p of CATALOG) {
    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name,
        description: p.description,
        // `set` replaces the whole link set, so re-seeding after a category change is exact.
        categories: { set: p.categorySlugs.map((slug) => ({ slug })) },
      },
      create: {
        slug: p.slug,
        name: p.name,
        description: p.description,
        categories: { connect: p.categorySlugs.map((slug) => ({ slug })) },
      },
    });

    for (const v of p.variants) {
      await prisma.productVariant.upsert({
        where: { sku: v.sku },
        update: {
          name: v.name,
          priceCents: v.priceCents,
          stock: v.stock,
          attributes: v.attributes ?? {},
          productId: product.id,
        },
        create: {
          name: v.name,
          sku: v.sku,
          priceCents: v.priceCents,
          currency: "USD",
          stock: v.stock,
          attributes: v.attributes ?? {},
          productId: product.id,
        },
      });
    }

    // Rebuild images idempotently: clear this product's rows, then recreate from the seed. This
    // also removes images dropped from the seed, which an upsert-only approach would leave behind.
    await prisma.productImage.deleteMany({ where: { productId: product.id } });
    if (p.img.length > 0) {
      await prisma.productImage.createMany({
        data: p.img.map((n, i) => ({
          productId: product.id,
          url: imageUrl(n),
          // Real, descriptive alt — never the filename (that would be an a11y bug).
          alt: i === 0 ? p.name : `${p.name} — alternate view`,
          position: i,
          isPrimary: i === 0,
        })),
      });
    }
  }

  const [categories, products, variants, images] = await Promise.all([
    prisma.category.count(),
    prisma.product.count(),
    prisma.productVariant.count(),
    prisma.productImage.count(),
  ]);
  console.log(
    `Seeded ${categories} categories / ${products} products / ${variants} variants / ${images} images.`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
