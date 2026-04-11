export type CapPricingType = "standard" | "hero" | "patriotic" | "custom";
export type CartItem = {
  id: string;
  type: "cap" | "cover";
  quantity: number;

  pricingType?: CapPricingType; // caps only
  highDetail?: boolean; // custom only
};

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

// Returns display tiers derived from the hardcoded config — always in sync with checkout.
// schemeName: "heroes" → hero tiers, anything else → standard tiers
export function configTiersForDisplay(schemeName: string): { minQty: number; unitPriceCents: number }[] {
  const source = schemeName === "heroes" ? HERO_TIERS : STANDARD_TIERS;
  return [...source].sort((a, b) => a.minQty - b.minQty).map((t) => ({
    minQty: t.minQty,
    unitPriceCents: t.price * 100,
  }));
}