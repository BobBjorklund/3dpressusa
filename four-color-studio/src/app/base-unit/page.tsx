import Link from "next/link";
import AddCoverButton from "@/components/AddCoverButton";
import ItemDisplay from "@/components/ItemDisplay";

export default function BaseUnitPage() {
  return (
    <main className="relative min-h-screen text-white">
      <div className="fixed inset-0 -z-10 bg-zinc-950" />

      {/* Breadcrumb */}
      <div className="mx-auto max-w-7xl px-6 pt-8 md:px-8">
        <nav className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-white/40">
          <Link href="/collections" className="transition hover:text-white/70">Collections</Link>
          <span>/</span>
          <span className="text-white/60">Base Unit</span>
        </nav>
      </div>

      <section className="mx-auto max-w-7xl px-6 py-10 md:px-8">
        <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-start">

          {/* 3MF viewer */}
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10">
            {/* Blurred truck background */}
            <img
              src="/truck-bg.png"
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-contain"
              style={{ filter: "blur(3px) brightness(1.05)" }}
            />
            {/* Light scrim so the model pops */}
            <div className="absolute inset-0 bg-white/20" />
            <div className="relative aspect-square">
              <ItemDisplay slug="base-unit" alt="Hitch cover base unit" />
            </div>
          </div>

          {/* Details */}
          <div className="flex flex-col gap-6">

            <div className="w-fit rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em] text-white/70 backdrop-blur-sm">
              Core Hardware
            </div>

            <div>
              <h1 className="text-3xl font-black tracking-tight md:text-4xl">Hitch Cover Base Unit</h1>
              <p className="mt-3 text-lg leading-7 text-zinc-300">
                The receiver-mounted base that makes the whole system work. Includes the TPU protective boot and PETG retaining clip. Buy it once — swap caps forever.
              </p>
            </div>

            {/* What's included */}
            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm">
              <div className="text-[10px] font-black uppercase tracking-[0.25em] text-white/50 mb-3">What's Included</div>
              <ul className="flex flex-col gap-2">
                {[
                  { label: "Hitch cover base", detail: "77g — fits standard 2\" receiver" },
                  { label: "TPU protective boot", detail: "30g — weatherproof seal, cleaner fit" },
                  { label: "PETG retaining clip", detail: "5g — keeps it locked in place" },
                ].map((item) => (
                  <li key={item.label} className="flex items-start gap-3">
                    <svg className="mt-1 h-4 w-4 flex-shrink-0 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <div>
                      <span className="text-sm font-bold">{item.label}</span>
                      <span className="ml-2 text-xs text-white/50">{item.detail}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Pricing */}
            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm">
              <div className="text-[10px] font-black uppercase tracking-[0.25em] text-white/50 mb-3">Pricing</div>
              <div className="flex flex-wrap gap-3">
                <div className="rounded-2xl border border-amber-300/20 bg-amber-400/10 px-4 py-3 text-center">
                  <div className="text-xl font-black text-amber-200">$10</div>
                  <div className="text-[10px] font-bold text-white/50 mt-0.5">standard</div>
                </div>
                <div className="rounded-2xl border border-amber-300/20 bg-amber-400/10 px-4 py-3 text-center">
                  <div className="text-xl font-black text-amber-200">$9</div>
                  <div className="text-[10px] font-bold text-white/50 mt-0.5">w/ hero caps</div>
                </div>
              </div>
              <p className="mt-3 text-xs text-white/40 leading-5">
                Discount applies automatically when hero or patriotic caps are in your order.
              </p>
            </div>

            <AddCoverButton />
          </div>
        </div>
      </section>
    </main>
  );
}
