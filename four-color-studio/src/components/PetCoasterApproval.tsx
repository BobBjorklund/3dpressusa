"use client";

import { useState } from "react";
import { useCart } from "@/context/CartContext";

const SLOT_COUNT = 4;

export default function PetCoasterApproval({
  requestId,
  approvalToken,
  proposalImageUrls,
  initialSelections,
}: {
  requestId: string;
  approvalToken: string;
  proposalImageUrls: string[];
  initialSelections: string[];
}) {
  const [slots, setSlots] = useState<(string | null)[]>(
    initialSelections.length === SLOT_COUNT ? initialSelections : Array(SLOT_COUNT).fill(null),
  );
  const [approved, setApproved] = useState(initialSelections.length === SLOT_COUNT);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addItem, openCart } = useCart();

  const allFilled = slots.every((s): s is string => s !== null);

  async function handleConfirm() {
    if (!allFilled) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/pet-design/${requestId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: approvalToken, selections: slots }),
      });
      if (!res.ok) {
        const { error: msg } = await res.json().catch(() => ({}));
        throw new Error(msg ?? "Something went wrong");
      }
      setApproved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  function handleAddToCart() {
    if (!allFilled) return;
    addItem({
      id: `pet-coaster::${requestId}`,
      slug: "pet-coaster",
      type: "petCoaster",
      quantity: 1,
      name: "Custom Pet Coasters (4-pack)",
      petCoasterSelections: slots,
      requestId,
    });
    openCart();
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-brushed-aluminum">Your Designs</div>
        <div className="mt-2 grid grid-cols-4 gap-2">
          {proposalImageUrls.map((url) => (
            <img
              key={url}
              src={url}
              alt=""
              className="aspect-square rounded-sm border border-brushed-aluminum/25 object-cover"
            />
          ))}
        </div>
      </div>

      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-brushed-aluminum">Build Your Set</div>
        <p className="mt-1 text-sm text-brushed-aluminum">
          Pick a design for each of your 4 coasters — any combination, repeats welcome.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: SLOT_COUNT }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <div className="font-mono text-[10px] uppercase text-hazard-yellow">Coaster {i + 1}</div>
              <div className="grid grid-cols-2 gap-1">
                {proposalImageUrls.map((url) => (
                  <button
                    key={url}
                    type="button"
                    disabled={approved}
                    onClick={() => setSlots((prev) => prev.map((s, si) => (si === i ? url : s)))}
                    aria-label={`Use this design for coaster ${i + 1}`}
                    className={`aspect-square overflow-hidden rounded-sm border-2 transition disabled:cursor-not-allowed ${
                      slots[i] === url
                        ? "border-plate-red"
                        : "border-brushed-aluminum/25 hover:border-brushed-aluminum/50"
                    }`}
                  >
                    <img src={url} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-plate-red">{error}</p>}

      {!approved ? (
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!allFilled || saving}
          className="w-fit rounded-sm bg-plate-red px-6 py-3 font-display text-sm uppercase tracking-wide text-white transition hover:bg-plate-red/85 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Confirm my set"}
        </button>
      ) : (
        <button
          type="button"
          onClick={handleAddToCart}
          className="w-fit rounded-sm bg-plate-red px-6 py-3 font-display text-sm uppercase tracking-wide text-white transition hover:bg-plate-red/85"
        >
          Order 4 Coasters — $35
        </button>
      )}
    </div>
  );
}
