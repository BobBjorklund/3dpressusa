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
  { minQty: 5, price: 5 },
  { minQty: 3, price: 6 },
  { minQty: 1, price: 7 },
];

export const HERO_TIERS: Tier[] = [
  { minQty: 5, price: 4 },
  { minQty: 3, price: 5 },
  { minQty: 1, price: 6 },
];

export function getTierPrice(tiers: Tier[], qty: number): number {
  return tiers.find((t) => qty >= t.minQty)!.price;
}