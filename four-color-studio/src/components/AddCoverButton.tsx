"use client";

import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { coverPrice, discountPercent, COVER_PRICE_STANDALONE, type CapPricingType } from "@/lib/storefront/pricing-config";

export default function AddCoverButton({
  compact = false,
  contextPricingType,
}: {
  compact?: boolean;
  // The item being viewed, if this button is shown on an item detail page —
  // included in the price calc even before its cap is actually in the cart,
  // so the shown price reflects "if you get this item's cap too," not
  // whatever unrelated items happen to already be in the cart.
  contextPricingType?: CapPricingType;
}) {
  const { addItem, openCart, entries } = useCart();
  const [added, setAdded] = useState(false);

  const alreadyInCart = entries.some((e) => e.type === "cover");
  const capPricingTypes = entries.filter((e) => e.type === "cap").map((e) => e.pricingType);
  if (contextPricingType) capPricingTypes.push(contextPricingType);
  const price = coverPrice(capPricingTypes);
  const pct = discountPercent(price, COVER_PRICE_STANDALONE);

  function handleAdd() {
    addItem({
      slug: "base-unit",
      type: "cover",
      quantity: 1,
      name: "Hitch Cover Base Unit",
    });
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      openCart();
    }, 800);
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={handleAdd}
        disabled={added}
        className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition active:scale-[0.98] disabled:opacity-50 ${
          added
            ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-100"
            : "border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]"
        }`}
      >
        <div>
          <p className="text-sm font-bold">
            {added ? "Added!" : alreadyInCart ? "Add another base unit" : "Don't have the base unit yet?"}
          </p>
          {!added && !alreadyInCart && (
            <p className="mt-0.5 text-xs text-white/50">
              Receiver-mounted base + PETG clip — needed once, works with every cap
            </p>
          )}
        </div>
        {!added && (
          <span className="flex-shrink-0 text-right text-sm font-black text-white/80">
            ${price}
            {pct !== null && <span className="ml-1.5 text-[10px] font-bold text-emerald-300">{pct}% off</span>}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3">
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
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Added!
          </>
        ) : (
          <>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 9m12-9l2 9M9 21a1 1 0 100-2 1 1 0 000 2zm10 0a1 1 0 100-2 1 1 0 000 2z" />
            </svg>
            {alreadyInCart
              ? "Add Another Base Unit"
              : `Add to Cart — $${price}${pct !== null ? ` (${pct}% off)` : ""}`}
          </>
        )}
      </button>
    </div>
  );
}
