"use client";

import { useState } from "react";

export default function AddToCartButton({
  item,
}: {
  item: { slug: string; name: string };
}) {
  const [clicked, setClicked] = useState(false);

  function handleClick() {
    setClicked(true);
    setTimeout(() => setClicked(false), 2500);
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={handleClick}
        className="flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-base font-black text-black transition hover:bg-zinc-200 active:scale-[0.98]"
      >
        {clicked ? (
          <>
            <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Got it!
          </>
        ) : (
          <>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 9m12-9l2 9M9 21a1 1 0 100-2 1 1 0 000 2zm10 0a1 1 0 100-2 1 1 0 000 2z" />
            </svg>
            Add to Cart
          </>
        )}
      </button>

      {clicked && (
        <p className="text-center text-sm text-white/50">
          I promise I'm working as hard as I can to be able to take your money ;) — we&apos;re almost there!
        </p>
      )}

      {!clicked && (
        <p className="text-center text-xs text-white/30">
          Full checkout coming soon · Questions?{" "}
          <a href="mailto:info@3dpressusa.com" className="underline underline-offset-2 hover:text-white/60 transition">
            Contact us
          </a>
        </p>
      )}
    </div>
  );
}
