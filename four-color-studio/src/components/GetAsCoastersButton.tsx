"use client";

import { useState } from "react";
import { useCart } from "@/context/CartContext";
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
  const { addItem, openCart } = useCart();
  const [packs, setPacks] = useState(1);
  const [added, setAdded] = useState(false);

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
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      openCart();
    }, 800);
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
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPacks((p) => Math.max(1, p - 1))}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-white/70 transition hover:bg-white/[0.12]"
            aria-label="Fewer packs"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
            </svg>
          </button>
          <span className="w-20 text-center text-sm font-bold">
            {packs} pack{packs > 1 ? "s" : ""}
          </span>
          <button
            type="button"
            onClick={() => setPacks((p) => p + 1)}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-white/70 transition hover:bg-white/[0.12]"
            aria-label="More packs"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

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
