'use client';

import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { coverPrice } from '@/lib/storefront/pricing-config';

export default function BuyButton() {
  const { entries, cartItems, clearCart, capCount, addItem } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const hasCover = entries.some((e) => e.type === 'cover');
  const baseUnitPrice = coverPrice(entries.filter((e) => e.type === 'cap').map((e) => e.pricingType));

  function handleCheckoutClick() {
    if (cartItems.length === 0) return;
    if (capCount > 0 && !hasCover) {
      setShowModal(true);
      return;
    }
    doCheckout();
  }

  async function doCheckout() {
    setLoading(true);
    setError(null);
    try {
      // Collect stick family slot configs keyed by a short index so the webhook
      // can reconstruct the preview image (Stripe metadata limit: 500 chars/value)
      const sfEntries = entries.filter((e) => e.stickFamilySlots?.length);
      const stickFamilyConfigs = Object.fromEntries(
        sfEntries.map((e, i) => [
          `sf_${i}`,
          e.stickFamilySlots!.map((s) => `${s.line}:${s.variant}:${s.halo ? '1' : '0'}`).join('|'),
        ])
      );

      // Same pattern for pet-coaster orders: requestId + the 4 approved
      // design URLs, so the webhook can mark the request "ordered" and list
      // the chosen designs in the fulfillment email.
      const petEntries = entries.filter((e) => e.type === 'petCoaster' && e.requestId);
      const petCoasterConfigs = Object.fromEntries(
        petEntries.map((e, i) => [
          `pc_${i}`,
          [e.requestId, ...(e.petCoasterSelections ?? [])].join('|'),
        ])
      );

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cartItems,
          displayNames: Object.fromEntries(entries.map((e) => [e.id, e.name])),
          stickFamilyConfigs,
          petCoasterConfigs,
        }),
      });

      if (!res.ok) {
        const { error: msg } = await res.json().catch(() => ({}));
        throw new Error(msg ?? 'Checkout failed');
      }

      const { url } = await res.json();
      clearCart();
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
    }
  }

  function handleAddBaseUnit() {
    addItem({ id: 'base-unit', slug: 'base-unit', type: 'cover', quantity: 1, name: 'Base Unit' });
    setShowModal(false);
  }

  return (
    <>
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          <div className="relative z-10 w-full max-w-sm rounded-md border border-brushed-aluminum/25 bg-steel-panel p-6 shadow-2xl">
            <div className="mb-3 text-3xl">🚗</div>
            <h3 className="mb-2 font-display text-lg uppercase tracking-wide leading-snug text-white">
              Do you already own a base unit?
            </h3>
            <p className="mb-6 text-sm leading-relaxed text-brushed-aluminum">
              Each faceplate clips onto our hitch receiver mount. If you don't
              already own one, you'll need it to use your new cap.
            </p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleAddBaseUnit}
                className="flex w-full items-center justify-center gap-2 rounded-sm bg-plate-red px-6 py-3 font-display text-sm uppercase tracking-wide text-white transition hover:bg-plate-red/85 active:scale-[0.98]"
              >
                Add base unit - ${baseUnitPrice}
              </button>
              <button
                type="button"
                onClick={() => { setShowModal(false); doCheckout(); }}
                className="w-full rounded-sm border border-brushed-aluminum/25 px-6 py-3 text-sm font-medium text-brushed-aluminum transition hover:bg-white/[0.06] hover:text-white"
              >
                I already own one - continue
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={handleCheckoutClick}
          disabled={loading || cartItems.length === 0}
          className="flex w-full items-center justify-center gap-2 rounded-sm bg-plate-red px-6 py-3.5 font-display text-sm uppercase tracking-wide text-white transition hover:bg-plate-red/85 active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? (
            <>
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z" />
              </svg>
              Redirecting to Stripe…
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
              Checkout
            </>
          )}
        </button>
        {error && (
          <p className="text-center text-xs text-plate-red">{error}</p>
        )}
      </div>
    </>
  );
}
