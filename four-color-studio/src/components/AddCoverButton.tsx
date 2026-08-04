"use client";

import { useCart } from "@/context/CartContext";
import { useAddedFlash } from "@/lib/useAddedFlash";
import { CheckIcon, CartIcon } from "@/components/icons";
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
  const { addItem, entries } = useCart();
  const { added, flash } = useAddedFlash();

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
    flash();
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={handleAdd}
        disabled={added}
        className={`flex items-center justify-between gap-3 rounded-sm border px-4 py-3 text-left transition active:scale-[0.98] disabled:opacity-50 ${
          added
            ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-100"
            : "border-brushed-aluminum/25 bg-steel-panel text-white hover:border-brushed-aluminum/45"
        }`}
      >
        <div>
          <p className="text-sm font-semibold">
            {added ? "Added!" : alreadyInCart ? "Add another base unit" : "Don't have the base unit yet?"}
          </p>
          {!added && !alreadyInCart && (
            <p className="mt-0.5 text-xs text-brushed-aluminum">
              Receiver-mounted base + PETG clip - needed once, works with every cap
            </p>
          )}
        </div>
        {!added && (
          <span className="flex-shrink-0 text-right font-mono text-sm text-white">
            ${price}
            {pct !== null && <span className="ml-1.5 text-[10px] font-bold text-emerald-400">{pct}% off</span>}
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
        className={`flex items-center justify-center gap-2 rounded-sm px-8 py-4 font-display text-base uppercase tracking-wide transition active:scale-[0.98] disabled:opacity-50 ${
          added
            ? "bg-emerald-600 text-white"
            : "bg-plate-red text-white hover:bg-plate-red/85"
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
            {alreadyInCart
              ? "Add Another Base Unit"
              : `Add to Cart - $${price}${pct !== null ? ` (${pct}% off)` : ""}`}
          </>
        )}
      </button>
    </div>
  );
}
