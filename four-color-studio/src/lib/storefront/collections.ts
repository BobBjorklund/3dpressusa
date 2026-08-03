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

export async function getItemsBySlugs(slugs: string[]) {
  return prisma.item.findMany({
    where: { slug: { in: slugs } },
    include: { collection: true },
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
// Re-exported for convenience so server pages that already import collection
// helpers from here don't need a second import line. ItemCard (a component
// that ends up in client bundles) imports formatTiers directly from
// pricing-config.ts instead, since this file pulls in Prisma.
export { formatTiers } from './pricing-config';
