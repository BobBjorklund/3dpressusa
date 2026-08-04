import SpecPlate from "@/components/SpecPlate";

export default function CoasterPromoBanner() {
  return (
    <SpecPlate accent="yellow" className="mb-8 flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center sm:justify-between md:p-6">
      <div>
        <p className="font-display text-lg uppercase tracking-tight text-white">
          Don&apos;t have a hitch but still have American pride?
        </p>
        <p className="mt-1 text-sm text-brushed-aluminum">
          Coasters are fun for everyone - any design in any collection is available as a coaster set.
          Hero &amp; Patriot: 4 for $20. Everything else: 4 for $25.
        </p>
      </div>
      <span className="flex-shrink-0 rounded-sm border border-hazard-yellow/40 bg-hazard-yellow/10 px-4 py-2 font-mono text-xs uppercase tracking-wide text-hazard-yellow">
        Look for &quot;Get as Coasters&quot; on any item
      </span>
    </SpecPlate>
  );
}
