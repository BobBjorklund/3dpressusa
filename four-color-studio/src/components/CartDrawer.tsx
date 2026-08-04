"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useCart } from "@/context/CartContext";
import { calculateCart } from "@/lib/storefront/pricing";
import { coverPrice } from "@/lib/storefront/pricing-config";
import { estimateShippingCents, FREE_SHIPPING_THRESHOLD } from "@/lib/storefront/shipping";
import { CartIcon } from "@/components/icons";
import QuantityStepper from "@/components/QuantityStepper";
import BuyButton from "./BuyButton";

const ThreeMFStatic = dynamic(() => import("./ThreeMFStatic"), { ssr: false });

export default function CartDrawer() {
  const { entries, cartItems, isOpen, closeCart, removeItem, updateQty, itemCount, subtotal, capCount } = useCart();

  // Per-entry unit prices from the breakdown (tier depends on full order qty)
  const breakdown = entries.length > 0 ? calculateCart(cartItems).breakdown : [];
  const breakdownById = Object.fromEntries(breakdown.map((b: any) => [b.id, b]));

  // Same estimator checkout/route.ts uses server-side, so this can never
  // show a number the customer won't actually be charged.
  const shippingCents = entries.length > 0 ? estimateShippingCents(cartItems, subtotal) : 0;
  const freeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={closeCart}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col bg-gunmetal shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-brushed-aluminum/20 px-6 py-4">
          <h2 className="font-display text-lg uppercase tracking-wide text-white">
            Cart{" "}
            {itemCount > 0 && (
              <span className="ml-1 font-mono text-sm font-normal text-brushed-aluminum">
                ({itemCount} {itemCount === 1 ? "item" : "items"})
              </span>
            )}
          </h2>
          <button
            type="button"
            onClick={closeCart}
            aria-label="Close cart"
            className="flex h-8 w-8 items-center justify-center rounded-sm border border-brushed-aluminum/25 bg-steel-panel text-brushed-aluminum transition hover:border-brushed-aluminum/45 hover:text-white"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {entries.length === 0 ? (
            <div className="flex flex-col items-center gap-3 pt-12 text-center">
              <CartIcon className="h-12 w-12 text-brushed-aluminum/30" strokeWidth={1.5} />
              <p className="text-sm text-brushed-aluminum">Your cart is empty.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {entries.map((entry) => {
                const b = breakdownById[entry.id];
                return (
                  <div
                    key={entry.id}
                    className="rounded-sm border border-brushed-aluminum/25 bg-steel-panel p-4"
                  >
                    <div className="flex items-start gap-3">
                      {/* Thumbnail — SVG preview for color-configured items, 3MF otherwise */}
                      <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-sm border border-brushed-aluminum/25 bg-white">
                        <ThreeMFStatic
                          url={`/items/${entry.slug}.3mf`}
                          className="h-full w-full"
                          layerColors={entry.colorHexes
                            ? { placard: entry.colorHexes[1], bg: entry.colorHexes[1], logo: entry.colorHexes[0] }
                            : undefined}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold leading-snug text-white">{entry.name}</p>
                        {entry.highDetail && (
                          <p className="mt-0.5 text-xs text-hazard-yellow">+ High Detail</p>
                        )}
                      </div>

                      {/* Unit price */}
                      {b && (
                        <div className="text-right font-mono text-sm flex-shrink-0 text-white">
                          <span>${b.unitPrice.toFixed(0)}</span>
                          <span className="text-brushed-aluminum"> ea</span>
                        </div>
                      )}
                    </div>

                    {/* Qty controls + line total + remove */}
                    <div className="mt-3 flex items-center justify-between">
                      <QuantityStepper
                        value={entry.quantity}
                        onDelta={(d) => updateQty(entry.id, d)}
                      />

                      <div className="flex items-center gap-3">
                        {b && (
                          <span className="font-mono text-sm text-white">${b.itemTotal.toFixed(2)}</span>
                        )}
                        <button
                          type="button"
                          onClick={() => removeItem(entry.id)}
                          className="text-brushed-aluminum/60 transition hover:text-plate-red"
                          aria-label="Remove item"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Base unit upsell — only relevant once there's a cap in the cart to attach it to */}
              {capCount > 0 && !entries.some((e) => e.type === "cover") && (() => {
                const basePrice = coverPrice(entries.filter((e) => e.type === "cap").map((e) => e.pricingType));
                return (
                  <Link
                    href="/base-unit"
                    onClick={closeCart}
                    className="flex items-center gap-3 rounded-sm border border-hazard-yellow/30 bg-hazard-yellow/10 px-4 py-3 transition hover:bg-hazard-yellow/15"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-xs uppercase tracking-wide text-hazard-yellow">Complete your setup</p>
                      <p className="text-xs text-brushed-aluminum mt-0.5">Add a base unit - receiver mount + PETG clip</p>
                    </div>
                    <span className="font-mono text-sm text-hazard-yellow flex-shrink-0">${basePrice} →</span>
                  </Link>
                );
              })()}

              {/* Tier hint — caps only, cover doesn't count toward discount */}
              {capCount > 0 && capCount < 3 && (
                <p className="rounded-sm bg-hazard-yellow/10 px-4 py-2 text-xs text-hazard-yellow">
                  Add {3 - capCount} more cap{3 - capCount > 1 ? "s" : ""} to unlock the 3-cap price.
                </p>
              )}
              {capCount >= 3 && capCount < 5 && (
                <p className="rounded-sm bg-hazard-yellow/10 px-4 py-2 text-xs text-hazard-yellow">
                  Add {5 - capCount} more cap{5 - capCount > 1 ? "s" : ""} to unlock the best price.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {entries.length > 0 && (
          <div className="border-t border-brushed-aluminum/20 px-6 py-5">
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-brushed-aluminum">Subtotal</span>
              <span className="font-mono text-white">${subtotal.toFixed(2)}</span>
            </div>
            <div className="mt-1 flex items-baseline justify-between text-sm">
              <span className="text-brushed-aluminum">Shipping (est.)</span>
              <span className="font-mono text-white">
                {freeShipping ? "Free" : `$${(shippingCents / 100).toFixed(2)}`}
              </span>
            </div>
            <div className="mt-2 flex items-baseline justify-between border-t border-brushed-aluminum/15 pt-2">
              <span className="text-sm text-brushed-aluminum">Estimated total</span>
              <span className="font-display text-lg uppercase text-white">
                ${(subtotal + shippingCents / 100).toFixed(2)}
              </span>
            </div>
            <p className="mb-4 mt-1 text-xs text-brushed-aluminum/60">Exact shipping + tax calculated at checkout</p>
            <BuyButton />
          </div>
        )}
      </div>
    </>
  );
}
