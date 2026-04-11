"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/context/CartContext";

export type NavCollection = {
  slug: string;
  name: string;
};

export default function NavBar({
  saleCollections,
}: {
  saleCollections: NavCollection[];
}) {
  const [open, setOpen] = useState(false);
  const [saleOpen, setSaleOpen] = useState(false);
  const { itemCount, openCart } = useCart();

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-zinc-950/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 md:px-8">

        {/* Logo */}
        <Link href="/" className="text-lg font-black tracking-tight" onClick={() => setOpen(false)}>
          <span className="text-white">3DPress</span>
          <span className="text-red-500">U</span>
          <span className="text-white">S</span>
          <span className="text-blue-500">A</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {saleCollections.length > 0 && (
            <div
              className="relative"
              onMouseEnter={() => setSaleOpen(true)}
              onMouseLeave={() => setSaleOpen(false)}
            >
              <button className="flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-sm font-black text-amber-300 transition hover:bg-amber-400/20">
                Sale
                <svg className={`h-3 w-3 transition ${saleOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {saleOpen && (
                <div className="absolute right-0 top-full min-w-[180px] overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-[0_16px_48px_rgba(0,0,0,0.40)]">
                  {saleCollections.map((c) => (
                    <Link
                      key={c.slug}
                      href={`/collections/${c.slug}`}
                      onClick={() => setSaleOpen(false)}
                      className="block px-4 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/[0.07] hover:text-white"
                    >
                      {c.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          <Link href="/collections" className="rounded-full px-4 py-2 text-sm font-semibold text-white/70 transition hover:bg-white/[0.07] hover:text-white">
            Collections
          </Link>

          {/* <Link href="/design" className="ml-2 rounded-full bg-white px-4 py-2 text-sm font-black text-black transition hover:bg-zinc-200">
            Design Your Own
          </Link> */}

          {/* Cart button */}
          <button
            type="button"
            onClick={openCart}
            aria-label="Open cart"
            className="relative ml-1 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-white transition hover:bg-white/[0.12]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 9m12-9l2 9M9 21a1 1 0 100-2 1 1 0 000 2zm10 0a1 1 0 100-2 1 1 0 000 2z" />
            </svg>
            {itemCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white">
                {itemCount > 9 ? "9+" : itemCount}
              </span>
            )}
          </button>
        </nav>

        {/* Mobile hamburger button */}
        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-white transition hover:bg-white/[0.12] md:hidden"
        >
          {open ? (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <nav className="border-t border-white/10 bg-zinc-950 px-6 pb-6 pt-4 md:hidden">
          {saleCollections.length > 0 && (
            <>
              <div className="mb-1 px-2 text-[10px] font-black uppercase tracking-[0.25em] text-amber-400">
                Sale
              </div>
              {saleCollections.map((c) => (
                <Link
                  key={c.slug}
                  href={`/collections/${c.slug}`}
                  onClick={() => setOpen(false)}
                  className="block rounded-xl px-3 py-3 text-sm font-semibold text-amber-200 transition hover:bg-white/[0.07]"
                >
                  {c.name}
                </Link>
              ))}
              <div className="my-3 border-t border-white/10" />
            </>
          )}

          <Link href="/collections" onClick={() => setOpen(false)} className="block rounded-xl px-3 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/[0.07]">
            Collections
          </Link>

          <div className="mt-4 flex flex-col gap-3">
            <button
              type="button"
              onClick={() => { setOpen(false); openCart(); }}
              className="flex items-center justify-between rounded-full border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-bold text-white transition hover:bg-white/[0.12]"
            >
              <span>Cart</span>
              {itemCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white">
                  {itemCount > 9 ? "9+" : itemCount}
                </span>
              )}
            </button>
          </div>
        </nav>
      )}
    </header>
  );
}
