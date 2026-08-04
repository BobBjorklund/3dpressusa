import Link from "next/link";
import { formatCapTierLine, formatCoasterLine } from "@/lib/storefront/pricing-config";
import { needsPixelationDisclaimer, PIXELATION_DISCLAIMER_TEXT } from "@/lib/storefront/pixelation-disclaimer";
import SpecPlate from "@/components/SpecPlate";

type Item = {
  slug: string;
  name: string;
  description?: string | null;
  heroOverride?: string | null;
  highDetailAvailable: boolean;
};

export default function ItemCard({
  item,
  collectionSlug,
  schemeName,
}: {
  item: Item;
  collectionSlug: string;
  schemeName: string;
}) {
  // Delegates to the shared formatter so this always matches checkout pricing.
  const capTierLine = formatCapTierLine(schemeName);
  const coasterLine = formatCoasterLine(schemeName);

  const imgSrc = item.heroOverride ?? `/items/${item.slug}-hero.png`;
  const showPixelationDisclaimer = needsPixelationDisclaimer(item.slug);

  return (
    <Link href={`/collections/${collectionSlug}/${item.slug}`} className="group block">
      <SpecPlate className="transition group-hover:border-brushed-aluminum/45">
        {/* Plate margin above the photo so the top bolts sit on real plate, not the artwork */}
        <div className="px-3 pt-9">
          <div className="relative aspect-square overflow-hidden rounded-sm bg-steel-panel">
            <img
              src={imgSrc}
              alt={item.name}
              loading="lazy"
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.05]"
            />
            {/* 3D render toast */}
            <div className="pointer-events-none absolute bottom-3 left-1/2 w-[90%] -translate-x-1/2 translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
              <div className="rounded-sm border border-brushed-aluminum/30 bg-gunmetal/90 px-3 py-1.5 text-center font-mono text-[10px] uppercase leading-tight tracking-widest text-brushed-aluminum">
                Photo is reference art - exact colors shown in 3D render
              </div>
            </div>
          </div>
        </div>
        <div className="px-5 pb-6 pt-4">
          {showPixelationDisclaimer && (
            <div className="mb-2 rounded-sm border border-hazard-yellow/30 bg-hazard-yellow/10 px-2.5 py-1.5 text-[10px] font-semibold leading-snug text-hazard-yellow">
              {PIXELATION_DISCLAIMER_TEXT}
            </div>
          )}
          <h3 className="text-center font-display text-lg uppercase leading-tight text-plate-ink">{item.name}</h3>
          {item.description && (
            <p className="mt-1 text-center text-sm text-brushed-aluminum line-clamp-2">{item.description}</p>
          )}
          <div className="mt-3 text-center font-mono text-xs text-hazard-yellow">
            <div>
              {capTierLine}
              {item.highDetailAvailable && (
                <span className="ml-1 text-brushed-aluminum/60">· HD +$1</span>
              )}
            </div>
            <div className="mt-0.5">{coasterLine}</div>
          </div>
        </div>
      </SpecPlate>
    </Link>
  );
}
