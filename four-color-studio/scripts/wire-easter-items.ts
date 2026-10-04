// One-off: wire the Easter designs (public/items/easter-*) into the holiday
// collection. HolidayAccordion groups by slug prefix, so "easter-*" slugs land
// in the Easter drawer. Field defaults are copied from the existing
// christmas-* items in the same collection.
//
//   npx tsx --env-file=.env scripts/wire-easter-items.ts          # dry run
//   npx tsx --env-file=.env scripts/wire-easter-items.ts --apply  # upsert

import { prisma } from "../src/lib/prisma";

const EASTER_ITEMS: [slug: string, name: string][] = [
  ["easter-blue-basket", "Blue Easter Basket"],
  ["easter-chocolate-bunny", "Chocolate Bunny"],
  ["easter-bunny", "Easter Bunny"],
  ["easter-empty-tomb", "Empty Tomb"],
  ["easter-he-is-risen", "He Is Risen"],
  ["easter-jesus-crown", "Jesus Crown"],
  ["easter-john-3-16", "John 3:16"],
  ["easter-pink-basket", "Pink Easter Basket"],
];

const apply = process.argv.includes("--apply");

async function main() {
  const holiday = await prisma.collection.findUnique({
    where: { slug: "holiday" },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });
  if (!holiday) throw new Error("holiday collection not found");

  const christmas = holiday.items.filter((i) => i.slug.startsWith("christmas-"));
  const template = christmas[0];
  if (!template) throw new Error("no christmas-* items to copy defaults from");

  console.log(`holiday collection: id=${holiday.id} active=${holiday.active} items=${holiday.items.length}`);
  console.log("christmas template sample:");
  for (const i of christmas.slice(0, 3)) {
    console.log(" ", JSON.stringify({ slug: i.slug, name: i.name, description: i.description, pricingType: i.pricingType, highDetailAvailable: i.highDetailAvailable, availableColorKeys: i.availableColorKeys, sortOrder: i.sortOrder, active: i.active }));
  }

  const existing = await prisma.item.findMany({ where: { slug: { in: EASTER_ITEMS.map(([s]) => s) } }, select: { slug: true, collectionId: true } });
  console.log("already in DB:", existing.length ? existing : "none");

  let sortOrder = Math.max(0, ...holiday.items.map((i) => i.sortOrder)) + 1;
  const rows = EASTER_ITEMS.map(([slug, name]) => ({
    slug,
    name,
    collectionId: holiday.id,
    pricingType: template.pricingType,
    highDetailAvailable: template.highDetailAvailable,
    availableColorKeys: template.availableColorKeys,
    sortOrder: sortOrder++,
    active: true,
  }));

  console.log(`\n${apply ? "UPSERTING" : "DRY RUN — would upsert"} ${rows.length} items:`);
  for (const r of rows) console.log(" ", JSON.stringify(r));

  if (apply) {
    for (const { slug, ...data } of rows) {
      await prisma.item.upsert({ where: { slug }, create: { slug, ...data }, update: data });
    }
    const count = await prisma.item.count({ where: { collectionId: holiday.id, slug: { startsWith: "easter-" }, active: true } });
    console.log(`\ndone — active easter-* items in holiday: ${count}`);
  }
}

main().finally(() => prisma.$disconnect());
