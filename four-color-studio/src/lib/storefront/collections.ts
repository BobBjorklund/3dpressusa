import { prisma } from '../prisma';

export async function getCollections() {
  return prisma.collection.findMany({
    where: { active: true },
    include: {
      pricingScheme: {
        include: { tiers: { orderBy: { minQty: 'asc' } } },
      },
    },
    orderBy: { sortOrder: 'asc' },
  });
}

export async function getCollection(slug: string) {
  return prisma.collection.findUnique({
    where: { slug },
    include: {
      pricingScheme: {
        include: { tiers: { orderBy: { minQty: 'asc' } } },
      },
      items: {
        where: { active: true },
        orderBy: { sortOrder: 'asc' },
      },
    },
  });
}

export async function getItem(itemSlug: string) {
  return prisma.item.findUnique({
    where: { slug: itemSlug },
    include: {
      collection: {
        include: {
          pricingScheme: {
            include: { tiers: { orderBy: { minQty: 'asc' } } },
          },
        },
      },
    },
  });
}

// ── Image path helpers ────────────────────────────────────────────────────────
// Convention: /public/collections/{slug}-carousel.png, /public/collections/{slug}-product.png
// Override fields in DB take precedence.

export function collectionCarouselBg(c: { slug: string; carouselBgOverride?: string | null }) {
  return c.carouselBgOverride ?? `/collections/${c.slug}-carousel.png`;
}

export function collectionProductImg(c: { slug: string; productImageOverride?: string | null }) {
  return c.productImageOverride ?? `/collections/${c.slug}-product.png`;
}

// Convention: /public/items/{slug}-hero.png, -assembled.png, -in-use.png
export function itemHeroImg(i: { slug: string; heroOverride?: string | null }) {
  return i.heroOverride ?? `/items/${i.slug}-hero.png`;
}

export function itemAssembledImg(i: { slug: string; assembledOverride?: string | null }) {
  return i.assembledOverride ?? `/items/${i.slug}-assembled.png`;
}

export function itemInUseImg(i: { slug: string; inUseOverride?: string | null }) {
  return i.inUseOverride ?? `/items/${i.slug}-in-use.png`;
}

// ── Pricing display ───────────────────────────────────────────────────────────
// Formats tiers as "1/$7 · 3/$6 · 5/$5" (sorted ascending by minQty)
export function formatTiers(tiers: { minQty: number; unitPriceCents: number }[]) {
  return [...tiers]
    .sort((a, b) => a.minQty - b.minQty)
    .map((t) => `${t.minQty}/$${(t.unitPriceCents / 100).toFixed(0)}`)
    .join(' · ');
}
