export default function CoasterPromoBanner() {
  return (
    <div className="mb-10 flex flex-col items-start gap-3 rounded-[1.75rem] border border-amber-300/20 bg-amber-400/10 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-black text-amber-200">
          Don&apos;t have a hitch but still have American pride?
        </p>
        <p className="mt-1 text-sm text-white/70">
          Coasters are fun for everyone — any design in any collection is available as a coaster set.
          Hero &amp; Patriot: 4 for $20. Everything else: 4 for $25.
        </p>
      </div>
      <span className="flex-shrink-0 rounded-full border border-amber-300/30 bg-amber-400/15 px-4 py-2 text-xs font-black uppercase tracking-wide text-amber-200">
        Look for &quot;Get as Coasters&quot; on any item
      </span>
    </div>
  );
}
