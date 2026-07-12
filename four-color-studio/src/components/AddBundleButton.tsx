"use client";

import { useState } from "react";
import { useCart } from "@/context/CartContext";
import type { CapPricingType } from "@/lib/storefront/pricing-config";
import { bundlePrice, BUNDLE_REFERENCE_PRICE, discountPercent } from "@/lib/storefront/pricing-config";

type Props = {
  item: {
    slug: string;
    name: string;
    pricingType: CapPricingType;
  };
};

// Single-click bundle: one base unit, one faceplate, and one coaster 4-pack
// of the same design, at a fixed bundle price — not the sum of the
// individually-tiered prices.
export default function AddBundleButton({ item }: Props) {
  const { addItem, openCart } = useCart();
  const [added, setAdded] = useState(false);

  const price = bundlePrice(item.pricingType);
  const pct = discountPercent(price, BUNDLE_REFERENCE_PRICE);

  function handleAdd() {
    addItem({
      id: `${item.slug}::bundle`,
      slug: item.slug,
      type: "bundle",
      quantity: 1,
      pricingType: item.pricingType,
      name: `${item.name} — Base + Faceplate + Coasters Bundle`,
    });
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      openCart();
    }, 800);
  }

  return (
    <button
      type="button"
      onClick={handleAdd}
      disabled={added}
      className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition active:scale-[0.98] disabled:opacity-50 ${
        added
          ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-100"
          : "border-amber-300/20 bg-amber-400/10 text-white hover:bg-amber-400/15"
      }`}
    >
      <div>
        <p className="text-sm font-bold">
          {added ? "Added!" : "Base + Faceplate + Coasters"}
        </p>
        {!added && (
          <p className="mt-0.5 text-xs text-white/50">
            One click — base unit, this faceplate, and a coaster 4-pack
          </p>
        )}
      </div>
      {!added && (
        <span className="flex-shrink-0 text-right text-sm font-black text-amber-200">
          ${price}
          {pct !== null && <span className="ml-1.5 text-[10px] font-bold text-emerald-300">{pct}% off</span>}
        </span>
      )}
    </button>
  );
}
