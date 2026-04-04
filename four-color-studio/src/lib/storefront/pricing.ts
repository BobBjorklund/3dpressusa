import { STANDARD_TIERS, HERO_TIERS, getTierPrice, CartItem } from "./pricing-config";
export function calculateCart(items: CartItem[]) {
  const capItems = items.filter((i) => i.type === "cap");
  const coverItems = items.filter((i) => i.type === "cover");

  const totalCaps = capItems.reduce((sum, i) => sum + i.quantity, 0);

  let subtotal = 0;

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

  // COVER
  // $10 standalone (no caps), $7 bundled with on-sale caps, $8 bundled with standard caps
  if (coverItems.length > 0) {
    const coverPrice =
      totalCaps === 0
        ? 10
        : capItems.some((c) => c.pricingType === "hero" || c.pricingType === "patriotic")
        ? 7
        : 8;

    for (const cover of coverItems) {
      const itemTotal = coverPrice * cover.quantity;
      subtotal += itemTotal;

      breakdown.push({
        ...cover,
        unitPrice: coverPrice,
        itemTotal,
      });
    }
  }

  return {
    totalCaps,
    subtotal,
    breakdown,
  };
}

