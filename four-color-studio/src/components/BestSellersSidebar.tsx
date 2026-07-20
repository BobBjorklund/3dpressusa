"use client";

import Link from "next/link";
import dynamic from "next/dynamic";

const ThreeMFStatic = dynamic(() => import("./ThreeMFStatic"), { ssr: false });

export type BestSellerItem = {
  slug: string;
  name: string;
  collectionSlug: string;
};

// Full-height fixed panel — not the standard ItemCard (which shows a static
// hero PNG). Loads each item's actual .3mf and renders it live via three.js,
// same as the cart drawer thumbnails. Only a handful of items ever show up
// here, so the extra render cost per card is a non-issue. Links straight to
// the real item detail page at /collections/[slug]/[item-slug].
export default function BestSellersSidebar({ items }: { items: BestSellerItem[] }) {
  if (items.length === 0) return null;

  return (
    <aside className="pointer-events-none fixed right-0 top-0 z-30 hidden h-screen w-72 flex-col border-l border-white/10 bg-zinc-950/90 backdrop-blur-md xl:flex">
      <div className="pointer-events-auto flex h-full flex-col p-4">
        <div className="mb-3 text-[10px] font-black uppercase tracking-[0.25em] text-amber-300">
          Best Sellers
        </div>
        <div className="flex flex-1 flex-col gap-3">
          {items.map((item) => (
            <Link
              key={item.slug}
              href={`/collections/${item.collectionSlug}/${item.slug}`}
              className="group flex flex-1 flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] transition hover:border-white/25 hover:bg-white/[0.08]"
            >
              <div className="flex-1 min-h-0 bg-white">
                <ThreeMFStatic url={`/items/${item.slug}.3mf`} className="h-full w-full" />
              </div>
              <div className="px-3 py-2">
                <p className="truncate text-xs font-bold leading-snug text-white">{item.name}</p>
                <p className="mt-0.5 text-[10px] font-bold text-amber-300/0 transition group-hover:text-amber-300">
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
