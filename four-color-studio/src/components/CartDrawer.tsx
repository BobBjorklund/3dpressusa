"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useCart } from "@/context/CartContext";
import { calculateCart } from "@/lib/storefront/pricing";
import BuyButton from "./BuyButton";

const ThreeMFStatic = dynamic(() => import("./ThreeMFStatic"), { ssr: false });

export default function CartDrawer() {
  const { entries, cartItems, isOpen, closeCart, removeItem, updateQty, itemCount, subtotal, capCount } = useCart();

  // Per-entry unit prices from the breakdown (tier depends on full order qty)
  const breakdown = entries.length > 0 ? calculateCart(cartItems).breakdown : [];
  const breakdownById = Object.fromEntries(breakdown.map((b: any) => [b.id, b]));

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
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col bg-zinc-900 shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <h2 className="text-base font-black tracking-tight">
            Cart{" "}
            {itemCount > 0 && (
              <span className="ml-1 text-sm font-normal text-white/40">
                ({itemCount} {itemCount === 1 ? "item" : "items"})
              </span>
            )}
          </h2>
          <button
            type="button"
            onClick={closeCart}
            aria-label="Close cart"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-white/60 transition hover:bg-white/[0.12] hover:text-white"
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
              <svg className="h-12 w-12 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 9m12-9l2 9M9 21a1 1 0 100-2 1 1 0 000 2zm10 0a1 1 0 100-2 1 1 0 000 2z" />
              </svg>
              <p className="text-sm text-white/40">Your cart is empty.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {entries.map((entry) => {
                const b = breakdownById[entry.id];
                return (
                  <div
                    key={entry.id}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
                  >
                    <div className="flex items-start gap-3">
                      {/* 3MF thumbnail */}
                      <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl border border-white/10 bg-zinc-800">
                        <ThreeMFStatic
                          url={`/items/${entry.slug}.3mf`}
                          className="h-full w-full"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold leading-snug">{entry.name}</p>
                        {entry.highDetail && (
                          <p className="mt-0.5 text-xs text-amber-300">+ High Detail</p>
                        )}
                      </div>

                      {/* Unit price */}
                      {b && (
                        <div className="text-right text-sm flex-shrink-0">
                          <span className="font-bold">${b.unitPrice.toFixed(0)}</span>
                          <span className="text-white/40"> ea</span>
                        </div>
                      )}
                    </div>

                    {/* Qty controls + line total + remove */}
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateQty(entry.id, -1)}
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-white/70 transition hover:bg-white/[0.12]"
                        >
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                          </svg>
                        </button>
                        <span className="w-5 text-center text-sm font-bold">{entry.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQty(entry.id, +1)}
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-white/70 transition hover:bg-white/[0.12]"
                        >
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                      </div>

                      <div className="flex items-center gap-3">
                        {b && (
                          <span className="text-sm font-bold">${b.itemTotal.toFixed(2)}</span>
                        )}
                        <button
                          type="button"
                          onClick={() => removeItem(entry.id)}
                          className="text-white/30 transition hover:text-red-400"
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

              {/* Base unit upsell */}
              {!entries.some((e) => e.type === "cover") && (
                <Link
                  href="/base-unit"
                  onClick={closeCart}
                  className="flex items-center gap-3 rounded-2xl border border-amber-300/20 bg-amber-400/10 px-4 py-3 transition hover:bg-amber-400/15"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-amber-200">Complete your setup</p>
                    <p className="text-xs text-white/50 mt-0.5">Add a base unit — receiver mount + TPU boot + PETG clip</p>
                  </div>
                  <span className="text-sm font-black text-amber-200 flex-shrink-0">$10 →</span>
                </Link>
              )}

              {/* Tier hint — caps only, cover doesn't count toward discount */}
              {capCount > 0 && capCount < 3 && (
                <p className="rounded-xl bg-amber-400/10 px-4 py-2 text-xs text-amber-300">
                  Add {3 - capCount} more cap{3 - capCount > 1 ? "s" : ""} to unlock the 3-cap price.
                </p>
              )}
              {capCount >= 3 && capCount < 5 && (
                <p className="rounded-xl bg-amber-400/10 px-4 py-2 text-xs text-amber-300">
                  Add {5 - capCount} more cap{5 - capCount > 1 ? "s" : ""} to unlock the best price.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {entries.length > 0 && (
          <div className="border-t border-white/10 px-6 py-5">
            <div className="mb-1 flex items-baseline justify-between text-sm">
              <span className="text-white/60">Subtotal</span>
              <span className="text-lg font-black">${subtotal.toFixed(2)}</span>
            </div>
            <p className="mb-4 text-xs text-white/30">Shipping + tax calculated at checkout</p>
            <BuyButton />
          </div>
        )}
      </div>
    </>
  );
}
