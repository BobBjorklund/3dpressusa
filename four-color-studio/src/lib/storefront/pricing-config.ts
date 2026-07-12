export type CapPricingType = "standard" | "hero" | "patriotic" | "custom";
export type CartItem = {
  id: string;
  type: "cap" | "cover" | "coaster" | "bundle";
  quantity: number; // coasters: number of 4-packs; bundle: number of bundles

  pricingType?: CapPricingType; // caps, coasters, and bundles
  highDetail?: boolean; // custom only
};

// Coasters are sold in fixed 4-packs of a single design (no mixing designs
// within a pack) — any existing item can be ordered this way using its own
// artwork as the reference, with no separate Item/collection/page needed.
export const COASTER_PACK_SIZE = 4;
export const COASTER_PACK_PRICE_HERO = 30; // hero/patriotic collections
export const COASTER_PACK_PRICE_STANDARD = 35; // everything else

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

// "Base + Faceplate + Coasters" bundle — one base unit, one faceplate, and
// one coaster 4-pack of the same design, single click. Fixed bundle price,
// not the sum of the individually-tiered prices — doesn't interact with the
// per-cap quantity tiers at all.
export const BUNDLE_PRICE_HERO = 42; // hero/patriotic designs
export const BUNDLE_PRICE_STANDARD = 48; // everything else

export function bundlePrice(pricingType?: CapPricingType): number {
  return pricingType === "hero" || pricingType === "patriotic"
    ? BUNDLE_PRICE_HERO
    : BUNDLE_PRICE_STANDARD;
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

// Reference ("full price") baseline for the bundle's discount badge: each
// component priced individually at its own non-discounted rate — 1 cap at
// the standard 1-cap tier, 1 base unit standalone, 1 coaster pack standard —
// used for both the standard and sale bundle SKUs.
export const BUNDLE_REFERENCE_PRICE =
  getTierPrice(STANDARD_TIERS, 1) + COVER_PRICE_STANDALONE + COASTER_PACK_PRICE_STANDARD;