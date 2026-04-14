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
    <div className="relative overflow-hidden rounded-[2rem] border border-white/10">
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
      </div>
    </div>
  );
}
