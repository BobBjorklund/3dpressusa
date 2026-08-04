import ItemDisplay from "./ItemDisplay";

export default function TruckViewerCard({
  slug,
  alt,
  heroOverride,
  variant = "item",
}: {
  slug: string;
  alt: string;
  heroOverride?: string | null;
  /** "base-unit" shows full truck (object-contain, no zoom)
   *  "item" zooms into the truck bed (object-cover, scaled) */
  variant?: "base-unit" | "item";
}) {
  const isItem = variant === "item";
  return (
    <div className="relative overflow-hidden rounded-md border border-brushed-aluminum/25">
      <img
        src="/truck-bg.png"
        alt=""
        aria-hidden="true"
        className={`absolute inset-0 h-full w-full ${isItem ? "object-cover" : "object-contain"}`}
        style={
          isItem
            ? { filter: "blur(2px) brightness(1.05)", transform: "scale(1.15) translateY(18%)" }
            : { filter: "blur(3px) brightness(1.05)" }
        }
      />
      <div className="absolute inset-0 bg-white/10" />
      <div className="relative aspect-square">
        <ItemDisplay slug={slug} alt={alt} heroOverride={heroOverride} />
        {isItem && (
          <div className="pointer-events-none absolute bottom-3 left-1/2 w-[90%] -translate-x-1/2">
            <div className="rounded-sm border border-brushed-aluminum/30 bg-gunmetal/90 px-3 py-1.5 text-center font-mono text-[10px] uppercase leading-tight tracking-widest text-brushed-aluminum">
              3D render above shows exact colors
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
