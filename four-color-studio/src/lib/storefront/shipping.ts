import type { CartItem } from "./pricing-config";

// The single source of truth for shipping cost — called from both the
// client (CartDrawer, for the live estimate shown before checkout) and the
// server (checkout/route.ts, to build the actual Stripe shipping_options) so
// the number shown to the customer can never drift from what's charged.

// Unit weights in grams (measured)
// coaster: per 4-pack (29g each)
export const WEIGHT_G = { cap: 29, cover: 80, coaster: 116 } as const; // cover = base + retaining clip combo
export const PACKAGING_G = 40; // bubble mailer

export function orderWeightG(items: CartItem[]): number {
  const itemWeight = items.reduce((sum, item) => {
    const unit = WEIGHT_G[item.type as keyof typeof WEIGHT_G] ?? WEIGHT_G.cap;
    return sum + unit * item.quantity;
  }, 0);
  return itemWeight + PACKAGING_G;
}

// USPS Ground Advantage via Pirateship — calibrated against real shipping receipts.
// Tweak at: pirateship.com/rate-calculator
export function groundAdvantageCents(weightG: number): number {
  const oz = weightG / 28.3495;
  if (oz <=  4) return 450;
  if (oz <=  8) return 749;
  if (oz <= 12) return 799;
  if (oz <= 16) return 849;
  // Over 1 lb
  const lbs = Math.ceil(weightG / 453.592);
  if (lbs <= 2) return 899;
  if (lbs <= 3) return 949;
  if (lbs <= 5) return 999;
  return 999 + (lbs - 5) * 50;
}

export const FREE_SHIPPING_THRESHOLD = 50; // dollars

// Shipping cost in cents for a cart, given its items and already-computed
// subtotal (dollars) — 0 once the order qualifies for free shipping.
export function estimateShippingCents(items: CartItem[], subtotal: number): number {
  if (subtotal >= FREE_SHIPPING_THRESHOLD) return 0;
  return groundAdvantageCents(orderWeightG(items));
}
