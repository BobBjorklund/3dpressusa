import AddCoverButton from "@/components/AddCoverButton";
import Breadcrumb from "@/components/Breadcrumb";
import ContentCard from "@/components/ContentCard";
import EyebrowBadge from "@/components/EyebrowBadge";
import PricingTierCards from "@/components/PricingTierCards";
import TruckViewerCard from "@/components/TruckViewerCard";

export default function BaseUnitPage() {
  return (
    <main className="relative min-h-screen text-white">
      <div className="fixed inset-0 -z-10 bg-zinc-950" />

      <div className="mx-auto max-w-7xl px-6 pt-8 md:px-8">
        <Breadcrumb crumbs={[
          { label: "Collections", href: "/collections" },
          { label: "Base Unit" },
        ]} />
      </div>

      <section className="mx-auto max-w-7xl px-6 py-10 md:px-8">
        <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-start">

          <TruckViewerCard slug="base-unit" alt="Hitch cover base unit" variant="base-unit" />

          <div className="flex flex-col gap-6">

            <EyebrowBadge>Core Hardware</EyebrowBadge>

            <div>
              <h1 className="text-3xl font-black tracking-tight md:text-4xl">Hitch Cover Base Unit</h1>
              <p className="mt-3 text-lg leading-7 text-zinc-300">
                The receiver-mounted base that makes the whole system work. Includes the TPU protective boot and PETG retaining clip. Buy it once — swap caps forever.
              </p>
            </div>

            <ContentCard>
              <div className="text-[10px] font-black uppercase tracking-[0.25em] text-white/50 mb-3">What&apos;s Included</div>
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
            </ContentCard>

            <PricingTierCards
              tiers={[
                { price: "$10", label: "standard" },
                { price: "$9", label: "w/ hero caps" },
              ]}
              note="Discount applies automatically when hero or patriotic caps are in your order."
            />

            <AddCoverButton />
          </div>
        </div>
      </section>
    </main>
  );
}
