export type CapPricingType = "standard" | "hero" | "patriotic" | "custom";
export type CartItem = {
  id: string;
  type: "cap" | "cover" | "coaster";
  quantity: number; // coasters: number of 4-packs

  pricingType?: CapPricingType; // caps and coasters
  highDetail?: boolean; // custom only
};

// Coasters are sold in fixed 4-packs of a single design (no mixing designs
// within a pack) — any existing item can be ordered this way using its own
// artwork as the reference, with no separate Item/collection/page needed.
export const COASTER_PACK_SIZE = 4;
export const COASTER_PACK_PRICE_HERO = 20; // hero/patriotic collections
export const COASTER_PACK_PRICE_STANDARD = 25; // everything else

export function coasterPackPrice(pricingType?: CapPricingType): number {
  return pricingType === "hero" || pricingType === "patriotic"
    ? COASTER_PACK_PRICE_HERO
    : COASTER_PACK_PRICE_STANDARD;
}

export type Tier = {
  minQty: number;
  price: number;
};

export const STANDARD_TIERS: Tier[] = [
  { minQty: 5, price: 8 },
  { minQty: 3, price: 9 },
  { minQty: 1, price: 10 },
];

export const HERO_TIERS: Tier[] = [
  { minQty: 5, price: 7 },
  { minQty: 3, price: 8 },
  { minQty: 1, price: 9 },
];

export function getTierPrice(tiers: Tier[], qty: number): number {
  return tiers.find((t) => qty >= t.minQty)!.price;
}

// Base unit (cover) price: $10 bought standalone (no caps in the order at
// all), $9 as an add-on to standard caps, $8 as an add-on to hero/patriotic
// caps. capPricingTypes should be every cap-type cart entry's pricingType.
export const COVER_PRICE_STANDALONE = 10;
export const COVER_PRICE_ADDON_STANDARD = 9;
export const COVER_PRICE_ADDON_HERO = 8;

export function coverPrice(capPricingTypes: (CapPricingType | undefined)[]): number {
  if (capPricingTypes.length === 0) return COVER_PRICE_STANDALONE;
  if (capPricingTypes.some((t) => t === "hero" || t === "patriotic")) return COVER_PRICE_ADDON_HERO;
  return COVER_PRICE_ADDON_STANDARD;
}

// Returns display tiers derived from the hardcoded config — always in sync with checkout.
// schemeName: "heroes" → hero tiers, anything else → standard tiers
export function configTiersForDisplay(schemeName: string): { minQty: number; unitPriceCents: number }[] {
  const source = schemeName === "heroes" ? HERO_TIERS : STANDARD_TIERS;
  return [...source].sort((a, b) => a.minQty - b.minQty).map((t) => ({
    minQty: t.minQty,
    unitPriceCents: t.price * 100,
  }));
}

// Renders configTiersForDisplay as a compact "5/$8 · 3/$9 · 1/$10" string.
// Lives here (not in collections.ts) because collections.ts imports Prisma —
// this needs to be safe to import from client components like ItemCard.
export function formatTiers(schemeName: string): string {
  return configTiersForDisplay(schemeName)
    .map((t) => `${t.minQty}/$${(t.unitPriceCents / 100).toFixed(0)}`)
    .join(" · ");
}

// ── Discount display ─────────────────────────────────────────────────────────
// "X% off" badges shown alongside every sale price, computed from the actual
// prices rather than hardcoded — so the badge always matches reality even if
// the underlying prices change. Returns null when there's nothing to show
// (price already at/above the reference, e.g. a standard-tier price shown
// next to itself).
export function discountPercent(salePrice: number, referencePrice: number): number | null {
  if (referencePrice <= 0 || salePrice >= referencePrice) return null;
  return Math.round((1 - salePrice / referencePrice) * 100);
}