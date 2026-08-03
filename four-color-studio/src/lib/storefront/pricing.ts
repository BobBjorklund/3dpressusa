import { STANDARD_TIERS, HERO_TIERS, getTierPrice, coasterPackPrice, coverPrice as coverPriceFor, CartItem } from "./pricing-config";

// The single source of truth for cart totals — called from both the client
// (CartContext, for the subtotal shown in the cart drawer) and the server
// (checkout/route.ts, to price the Stripe line items) so the displayed price
// and the charged price can never drift apart. All dollar prices/tiers live
// in pricing-config.ts; this file only contains the *rules* for combining
// them (tier lookup depends on total cap count, cover price depends on what
// caps are in the same order, coasters are independent).
export function calculateCart(items: CartItem[]) {
  const capItems = items.filter((i) => i.type === "cap");
  const coverItems = items.filter((i) => i.type === "cover");
  const coasterItems = items.filter((i) => i.type === "coaster");

  const totalCaps = capItems.reduce((sum, i) => sum + i.quantity, 0);

  let subtotal = 0;

  // One entry per cart item (not per unit), each original item's fields
  // spread with its computed unitPrice/itemTotal added — this is what
  // CartDrawer reads per-line-item prices from, and what checkout/route.ts
  // turns into Stripe line_items.
  const breakdown: any[] = [];

  // CAPS
  for (const item of capItems) {
    const qty = item.quantity;

    let unitPrice = 0;

    if (item.pricingType === "hero" || item.pricingType === "patriotic") {
      unitPrice = getTierPrice(HERO_TIERS, totalCaps);
    } else {
      unitPrice = getTierPrice(STANDARD_TIERS, totalCaps);
    }

    let itemTotal = unitPrice * qty;

    // custom HD
    if (item.pricingType === "custom" && item.highDetail) {
      itemTotal += qty * 1;
    }

    subtotal += itemTotal;

    breakdown.push({
      ...item,
      unitPrice,
      itemTotal,
    });
  }

  // COVER — $10 standalone, $9 add-on with standard caps, $8 add-on with hero/patriotic caps
  if (coverItems.length > 0) {
    const unitPrice = coverPriceFor(capItems.map((c) => c.pricingType));

    for (const cover of coverItems) {
      const itemTotal = unitPrice * cover.quantity;
      subtotal += itemTotal;

      breakdown.push({
        ...cover,
        unitPrice,
        itemTotal,
      });
    }
  }

  // COASTERS — fixed 4-packs of one design, no cross-item lane-mixing logic;
  // each pack is priced on its own, independent of everything else in the cart.
  for (const coaster of coasterItems) {
    const unitPrice = coasterPackPrice(coaster.pricingType);
    const itemTotal = unitPrice * coaster.quantity;
    subtotal += itemTotal;

    breakdown.push({
      ...coaster,
      unitPrice,
      itemTotal,
    });
  }

  return {
    totalCaps,
    subtotal,
    breakdown,
  };
}

