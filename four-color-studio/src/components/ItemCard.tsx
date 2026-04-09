"use client";
import Link from "next/link";

type Item = {
  slug: string;
  name: string;
  description?: string | null;
  heroOverride?: string | null;
  highDetailAvailable: boolean;
};

type Tier = {
  minQty: number;
  unitPriceCents: number;
};

export default function ItemCard({
  item,
  collectionSlug,
  tiers,
}: {
  item: Item;
  collectionSlug: string;
  tiers: Tier[];
}) {
  const priceLine = [...tiers]
    .sort((a, b) => a.minQty - b.minQty)
    .map((t) => `${t.minQty}/$${(t.unitPriceCents / 100).toFixed(0)}`)
    .join(" · ");

  const imgSrc = item.heroOverride ?? `/items/${item.slug}-hero.png`;

  return (
    <Link
      href={`/collections/${collectionSlug}/${item.slug}`}
      className="group overflow-hidden rounded-[1.5rem] border border-white/10 bg-zinc-950/60 shadow-[0_8px_24px_rgba(0,0,0,0.20)] backdrop-blur-sm transition hover:border-white/20 hover:bg-zinc-950/75 block"
    >
      <div className="relative aspect-square overflow-hidden bg-zinc-900/80">
        <img
          src={imgSrc}
          alt={item.name}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.05]"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = "/items/placeholder.png";
          }}
        />
        {/* 3D render toast */}
        <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <div className="whitespace-nowrap rounded-full border border-white/20 bg-zinc-900/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white/70 backdrop-blur-sm">
            3D render available in item view
          </div>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-black leading-tight">{item.name}</h3>
        {item.description && (
          <p className="mt-1 text-sm text-zinc-400 line-clamp-2">{item.description}</p>
        )}
        <div className="mt-3 text-xs font-bold text-amber-300">
          {priceLine}
          {item.highDetailAvailable && (
            <span className="ml-1 text-white/40">· HD +$1</span>
          )}
        </div>
      </div>
    </Link>
  );
}