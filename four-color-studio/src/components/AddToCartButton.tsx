"use client";

import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { useAddedFlash } from "@/lib/useAddedFlash";
import { CheckIcon, CartIcon } from "@/components/icons";
import type { CapPricingType } from "@/lib/storefront/pricing-config";

type Props = {
  item: {
    slug: string;
    name: string;
    pricingType: CapPricingType;
    highDetailAvailable: boolean;
  };
};

export default function AddToCartButton({ item }: Props) {
  const { addItem } = useCart();
  const [highDetail, setHighDetail] = useState(false);
  const { added, flash } = useAddedFlash();

  function handleAdd() {
    addItem({
      slug: item.slug,
      type: "cap",
      quantity: 1,
      pricingType: item.pricingType,
      highDetail: item.highDetailAvailable && highDetail ? true : undefined,
      name: item.name,
    });

    flash();
  }

  return (
    <div className="flex flex-col gap-4">

      {/* High detail toggle — custom caps only */}
      {item.highDetailAvailable && item.pricingType === "custom" && (
        <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
          <div className="relative">
            <input
              type="checkbox"
              className="sr-only"
              checked={highDetail}
              onChange={(e) => setHighDetail(e.target.checked)}
            />
            <div
              className={`h-5 w-9 rounded-full transition ${
                highDetail ? "bg-amber-400" : "bg-white/20"
              }`}
            />
            <div
              className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                highDetail ? "translate-x-4" : "translate-x-0.5"
              }`}
            />
          </div>
          <div>
            <span className="text-sm font-bold">High Detail</span>
            <span className="ml-2 text-xs text-amber-300">+$1 per cap</span>
          </div>
        </label>
      )}

      <button
        type="button"
        onClick={handleAdd}
        disabled={added}
        className={`flex items-center justify-center gap-2 rounded-full px-8 py-4 text-base font-black transition active:scale-[0.98] disabled:opacity-50 ${
          added
            ? "bg-emerald-500 text-white"
            : "bg-white text-black hover:bg-zinc-200"
        }`}
      >
        {added ? (
          <>
            <CheckIcon />
            Added!
          </>
        ) : (
          <>
            <CartIcon />
            Add to Cart
          </>
        )}
      </button>
    </div>
  );
}
