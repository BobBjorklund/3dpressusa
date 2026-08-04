"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useCart } from "@/context/CartContext";

export type NavCollection = {
  slug: string;
  name: string;
};

function CartButton({ onClick, itemCount, className }: { onClick: () => void; itemCount: number; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Open cart"
      className={`relative flex h-9 w-9 items-center justify-center rounded-sm border border-brushed-aluminum/25 bg-steel-panel text-white transition hover:border-brushed-aluminum/50 ${className ?? ""}`}
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 9m12-9l2 9M9 21a1 1 0 100-2 1 1 0 000 2zm10 0a1 1 0 100-2 1 1 0 000 2z" />
      </svg>
      {itemCount > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-plate-red font-mono text-[10px] font-bold text-white">
          {itemCount > 9 ? "9+" : itemCount}
        </span>
      )}
    </button>
  );
}

export default function NavBar({
  saleCollections,
  allCollections,
}: {
  saleCollections: NavCollection[];
  allCollections: NavCollection[];
}) {
  const [open, setOpen] = useState(false);
  const [saleOpen, setSaleOpen] = useState(false);
  const [collectionsOpen, setCollectionsOpen] = useState(false);
  const saleRef = useRef<HTMLDivElement>(null);
  const collectionsRef = useRef<HTMLDivElement>(null);
  const { itemCount, openCart } = useCart();

  // Close dropdowns on outside click (touch-friendly)
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (saleRef.current && !saleRef.current.contains(e.target as Node)) {
        setSaleOpen(false);
      }
      if (collectionsRef.current && !collectionsRef.current.contains(e.target as Node)) {
        setCollectionsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-brushed-aluminum/20 bg-gunmetal/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 md:px-8">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <img
            src="/brand/3dpress-usa-badge-clean-128.png"
            alt="3DPress USA"
            className="h-12 w-12"
            width={128}
            height={128}
          />
          <span className="font-display text-xl uppercase tracking-wide">
            <span className="text-white">3DPress</span>
            <span className="text-plate-red">U</span>
            <span className="text-white">S</span>
            <span className="text-federal-blue">A</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {saleCollections.length > 0 && (
            <div
              ref={saleRef}
              className="relative"
              onMouseEnter={() => setSaleOpen(true)}
              onMouseLeave={() => setSaleOpen(false)}
            >
              <button
                onClick={() => setSaleOpen((v) => !v)}
                className="flex items-center gap-1 rounded-sm border border-hazard-yellow/40 bg-hazard-yellow/10 px-4 py-2 font-display text-sm uppercase tracking-wide text-hazard-yellow transition hover:bg-hazard-yellow/20"
              >
                Sale
                <svg className={`h-3 w-3 transition-transform duration-200 ${saleOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {/* pt-1 bridges the gap between button and menu so onMouseLeave doesn't fire mid-travel */}
              <div
                className={`absolute right-0 top-full pt-1 min-w-[180px] transition-all duration-200 ${
                  saleOpen ? "pointer-events-auto opacity-100 translate-y-0" : "pointer-events-none opacity-0 -translate-y-1"
                }`}
              >
                <div className="overflow-hidden rounded-sm border border-brushed-aluminum/25 bg-steel-panel">
                {saleCollections.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/collections/${c.slug}`}
                    onClick={() => setSaleOpen(false)}
                    className="block px-4 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/[0.06] hover:text-white"
                  >
                    {c.name}
                  </Link>
                ))}
                </div>
              </div>
            </div>
          )}

          <div
            ref={collectionsRef}
            className="relative"
            onMouseEnter={() => setCollectionsOpen(true)}
            onMouseLeave={() => setCollectionsOpen(false)}
          >
            <button
              onClick={() => setCollectionsOpen((v) => !v)}
              className="flex items-center gap-1 rounded-sm px-4 py-2 text-sm font-semibold text-white/70 transition hover:bg-white/[0.06] hover:text-white"
            >
              Collections
              <svg className={`h-3 w-3 transition-transform duration-200 ${collectionsOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {/* pt-1 bridges the gap between button and menu so onMouseLeave doesn't fire mid-travel */}
            <div
              className={`absolute right-0 top-full pt-1 min-w-[200px] transition-all duration-200 ${
                collectionsOpen ? "pointer-events-auto opacity-100 translate-y-0" : "pointer-events-none opacity-0 -translate-y-1"
              }`}
            >
              <div className="overflow-hidden rounded-sm border border-brushed-aluminum/25 bg-steel-panel">
                <Link
                  href="/collections"
                  onClick={() => setCollectionsOpen(false)}
                  className="block border-b border-brushed-aluminum/15 px-4 py-3 font-display text-sm uppercase tracking-wide text-white/90 transition hover:bg-white/[0.06]"
                >
                  All Collections
                </Link>
                {allCollections.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/collections/${c.slug}`}
                    onClick={() => setCollectionsOpen(false)}
                    className="block px-4 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/[0.06] hover:text-white"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <CartButton onClick={openCart} itemCount={itemCount} className="ml-1" />
        </nav>

        {/* Mobile right side — cart always visible + hamburger */}
        <div className="flex items-center gap-2 md:hidden">
          <CartButton onClick={openCart} itemCount={itemCount} />
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-sm border border-brushed-aluminum/25 bg-steel-panel text-white transition hover:border-brushed-aluminum/50"
          >
            <svg
              className="h-5 w-5 transition-transform duration-200"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
              style={{ transform: open ? "rotate(45deg)" : "rotate(0deg)" }}
            >
              {open ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu — animated slide */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out md:hidden ${
          open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <nav className="border-t border-brushed-aluminum/20 bg-gunmetal px-6 pb-6 pt-4">
          {saleCollections.length > 0 && (
            <>
              <div className="mb-1 px-2 font-mono text-[10px] uppercase tracking-[0.25em] text-hazard-yellow">
                Sale
              </div>
              {saleCollections.map((c) => (
                <Link
                  key={c.slug}
                  href={`/collections/${c.slug}`}
                  onClick={() => setOpen(false)}
                  className="block rounded-sm px-3 py-3 text-sm font-semibold text-hazard-yellow transition hover:bg-white/[0.06]"
                >
                  {c.name}
                </Link>
              ))}
              <div className="my-3 border-t border-brushed-aluminum/20" />
            </>
          )}

          <div className="mb-1 px-2 font-mono text-[10px] uppercase tracking-[0.25em] text-white/40">
            Collections
          </div>
          <Link
            href="/collections"
            onClick={() => setOpen(false)}
            className="block rounded-sm px-3 py-3 font-display text-sm uppercase tracking-wide text-white/90 transition hover:bg-white/[0.06]"
          >
            All Collections
          </Link>
          {allCollections.map((c) => (
            <Link
              key={c.slug}
              href={`/collections/${c.slug}`}
              onClick={() => setOpen(false)}
              className="block rounded-sm px-3 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/[0.06]"
            >
              {c.name}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
