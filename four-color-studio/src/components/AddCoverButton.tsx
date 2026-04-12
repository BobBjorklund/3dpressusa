"use client";

import { useState } from "react";
import { useCart } from "@/context/CartContext";

export default function AddCoverButton() {
  const { addItem, openCart, entries } = useCart();
  const [added, setAdded] = useState(false);

  const alreadyInCart = entries.some((e) => e.type === "cover");

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
            {alreadyInCart ? "Add Another Base Unit" : "Add to Cart — $10"}
          </>
        )}
      </button>
    </div>
  );
}
