"use client";

import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { useAddedFlash } from "@/lib/useAddedFlash";
import QuantityStepper from "@/components/QuantityStepper";
import type { CapPricingType } from "@/lib/storefront/pricing-config";
import { coasterPackPrice, COASTER_PACK_SIZE, COASTER_PACK_PRICE_STANDARD, discountPercent } from "@/lib/storefront/pricing-config";

type Props = {
  item: {
    slug: string;
    name: string;
    pricingType: CapPricingType;
  };
};

// Every item can also be ordered as a set of coasters instead of (or in
// addition to) a hitch cap — always sold in fixed 4-packs of this one
// design, no mixing designs within a pack. Reuses the item's own 3MF/artwork
// as the reference, so no separate item page or DB row is needed.
export default function GetAsCoastersButton({ item }: Props) {
  const { addItem } = useCart();
  const [packs, setPacks] = useState(1);
  const { added, flash } = useAddedFlash();

  const packPrice = coasterPackPrice(item.pricingType);
  const pct = discountPercent(packPrice, COASTER_PACK_PRICE_STANDARD);

  function handleAdd() {
    addItem({
      id: `${item.slug}::coaster`,
      slug: item.slug,
      type: "coaster",
      quantity: packs,
      pricingType: item.pricingType,
      name: `${item.name} — Coasters (${COASTER_PACK_SIZE}-pack)`,
    });
    flash();
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <div>
        <p className="text-sm font-bold">Get as Coasters</p>
        <p className="mt-0.5 text-xs text-white/50">
          Same design, {COASTER_PACK_SIZE} for ${packPrice} — no hitch required.
          {pct !== null && <span className="ml-1.5 font-bold text-emerald-300">{pct}% off</span>}
        </p>
      </div>

      <div className="flex items-center justify-between">
        <QuantityStepper
          value={packs}
          onDelta={(d) => setPacks((p) => Math.max(1, p + d))}
          label={`${packs} pack${packs > 1 ? "s" : ""}`}
          widthClassName="w-20"
        />

        <button
          type="button"
          onClick={handleAdd}
          disabled={added}
          className={`rounded-full px-5 py-2.5 text-sm font-black transition active:scale-[0.98] disabled:opacity-50 ${
            added
              ? "bg-emerald-500 text-white"
              : "bg-white/10 text-white hover:bg-white/20"
          }`}
        >
          {added ? "Added!" : `Add — $${(packPrice * packs).toFixed(0)}`}
        </button>
      </div>
    </div>
  );
}
