"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export type BestSellerItem = {
  slug: string;
  name: string;
  collectionSlug: string;
  heroImg: string;
};

// Full-height fixed panel — uses the same static hero PNG as ItemCard.
// Only a handful of items ever show up here, so a plain <Image> is plenty;
// no need to fetch/unzip/render the live .3mf just for a thumbnail.
// Links straight to the real item detail page at /collections/[slug]/[item-slug].
// Collapsible: it's a fixed overlay, not part of page flow, so on real-world
// viewport widths it can sit on top of content the visitor actually wants.
export default function BestSellersSidebar({ items }: { items: BestSellerItem[] }) {
  const [open, setOpen] = useState(true);

  if (items.length === 0) return null;

  return (
    <aside
      className={`pointer-events-none fixed right-0 top-0 z-30 hidden h-screen w-72 flex-col transition-transform duration-300 ease-in-out xl:flex ${
        open ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Collapse best sellers" : "Expand best sellers"}
        aria-expanded={open}
        className="pointer-events-auto absolute right-full top-20 flex h-10 w-8 items-center justify-center rounded-l-sm border border-r-0 border-brushed-aluminum/25 bg-gunmetal/95 text-brushed-aluminum transition hover:text-white"
      >
        <svg className={`h-4 w-4 transition-transform duration-200 ${open ? "" : "rotate-180"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <div className="pointer-events-auto flex h-full flex-col border-l border-brushed-aluminum/20 bg-gunmetal/95 p-4">
        <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.25em] text-hazard-yellow">
          Best Sellers
        </div>
        <div className="flex flex-1 flex-col gap-3">
          {items.map((item) => (
            <Link
              key={item.slug}
              href={`/collections/${item.collectionSlug}/${item.slug}`}
              className="group flex flex-1 flex-col overflow-hidden rounded-sm border border-brushed-aluminum/25 bg-steel-panel transition hover:border-brushed-aluminum/45"
            >
              <div className="relative flex-1 min-h-0 bg-white">
                <Image
                  src={item.heroImg}
                  alt={item.name}
                  fill
                  sizes="18rem"
                  className="object-contain"
                />
              </div>
              <div className="px-3 py-2">
                <p className="truncate text-xs font-semibold leading-snug text-plate-ink">{item.name}</p>
                <p className="mt-0.5 font-mono text-[10px] text-hazard-yellow/0 transition group-hover:text-hazard-yellow">
                  Shop now →
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
}
