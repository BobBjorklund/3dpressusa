import Link from "next/link";
import HomeCarousel, { CarouselSlide } from "@/components/HomeCarousel";
import { getCollections, collectionCarouselBg, collectionProductImg, formatTiers } from "@/lib/storefront/collections";

// ── Static slides (non-collection) ───────────────────────────────────────────

const INTRO_SLIDES: CarouselSlide[] = [
  {
    id: "main-cover",
    eyebrow: "The System",
    title: "Buy the base once. Swap the look whenever the mood hits.",
    body: "Our modular hitch cover keeps the receiver-mounted hardware on your truck for good. The placard up front? That's the fun part — change it as often as your team's winning streak.",
    ctaLabel: "Shop Collections",
    ctaHref: "/collections",
    priceLine: "Full set: $20 · Base unit: $10 · Cap: $10",
    bgClass: "from-zinc-900 via-neutral-900 to-black",
  },
  {
    id: "base-unit",
    eyebrow: "The Hardware",
    title: "The piece that stays on forever.",
    body: "Receiver-mounted base with TPU protective boot and PETG retaining clip. Installs once, stays put, and never asks you to replace it — just the cap up front.",
    ctaLabel: "Get the Base Unit",
    ctaHref: "/base-unit",
    priceLine: "$10 standard · $9 with hero or patriotic caps",
    bgClass: "from-zinc-900 via-neutral-900 to-black",
    backgroundImageUrl: "/truck-bg.png",
    productImageUrl: "/collections/base-unit-product.png",
  },
  {
    id: "main-pricing",
    eyebrow: "Quantity Pricing",
    title: "The more looks you grab, the less each one runs.",
    body: "Pick anything from any collection. Pricing tiers are based on your total quantity — mix and match freely. Stack the savings without touching a coupon code.",
    ctaLabel: "Browse Collections",
    ctaHref: "/collections",
    priceLine: "1 cap: $10 · 3 caps: $9 · 5+ caps: $8",
    bgClass: "from-slate-900 via-stone-900 to-zinc-950",
  },
];

const OUTRO_SLIDES: CarouselSlide[] = [
  {
    id: "mix-and-match",
    eyebrow: "Mix & Match",
    title: "No bundles. No kits. Just pick what you actually want.",
    body: "Buy across collections, keep the quantity discount, and build the exact setup you actually want. We're not here to upsell you a bundle you didn't ask for.",
    ctaLabel: "Browse Collections",
    ctaHref: "/collections",
    priceLine: "Standard cover add-on: +$8 · Hero/Patriotic cover add-on: +$7",
    bgClass: "from-neutral-950 via-zinc-900 to-neutral-800",
  },
];

// ── UI helpers ────────────────────────────────────────────────────────────────

function GlobalBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-zinc-950" />
      <div className="absolute inset-0 opacity-[0.22]">
        <div className="absolute -left-16 top-8 h-64 w-64 rotate-[-12deg] rounded-[2rem] border border-red-400/20 bg-gradient-to-br from-red-500/30 to-transparent shadow-[0_0_60px_rgba(239,68,68,0.20)]" />
        <div className="absolute left-[16%] top-28 h-56 w-56 rotate-[8deg] rounded-[2rem] border border-blue-400/20 bg-gradient-to-br from-blue-500/25 to-transparent shadow-[0_0_60px_rgba(59,130,246,0.18)]" />
        <div className="absolute left-[34%] top-10 h-60 w-60 rotate-[14deg] rounded-[2rem] border border-orange-300/20 bg-gradient-to-br from-amber-400/25 to-transparent shadow-[0_0_60px_rgba(251,191,36,0.16)]" />
        <div className="absolute right-[28%] top-24 h-52 w-52 rotate-[-10deg] rounded-[2rem] border border-green-400/20 bg-gradient-to-br from-emerald-500/25 to-transparent shadow-[0_0_60px_rgba(16,185,129,0.14)]" />
        <div className="absolute right-16 top-12 h-64 w-64 rotate-[10deg] rounded-[2rem] border border-red-300/20 bg-gradient-to-br from-rose-400/20 to-transparent shadow-[0_0_60px_rgba(251,113,133,0.14)]" />
      </div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(239,68,68,0.16),transparent_22%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.14),transparent_24%),radial-gradient(circle_at_50%_35%,rgba(245,158,11,0.12),transparent_20%),radial-gradient(circle_at_25%_70%,rgba(16,185,129,0.10),transparent_18%),radial-gradient(circle_at_80%_75%,rgba(236,72,153,0.08),transparent_20%)]" />
      <div className="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:36px_36px]" />
    </div>
  );
}

function SectionGlow({
  className = "",
  color = "from-red-500/14 via-orange-400/10 to-transparent",
}: {
  className?: string;
  color?: string;
}) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      <div className={`absolute -left-24 top-0 h-72 w-72 rounded-full bg-gradient-to-br blur-3xl ${color}`} />
      <div className="absolute right-0 top-1/3 h-56 w-56 rounded-full bg-fuchsia-400/10 blur-3xl" />
      <div className="absolute left-1/3 bottom-0 h-40 w-40 rounded-full bg-sky-400/10 blur-3xl" />
    </div>
  );
}

function FeatureCard({ eyebrow, title, body, tintClass }: { eyebrow: string; title: string; body: string; tintClass: string }) {
  return (
    <div className={`rounded-[1.75rem] border border-white/10 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.18)] backdrop-blur-sm transition hover:border-white/15 ${tintClass}`}>
      <div className="text-xs font-black uppercase tracking-[0.2em] text-white/60">{eyebrow}</div>
      <h2 className="mt-3 text-2xl font-black leading-tight">{title}</h2>
      <p className="mt-3 text-zinc-200/90">{body}</p>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const collections = await getCollections();

  const collectionSlides: CarouselSlide[] = collections.map((c) => ({
    id: c.slug,
    eyebrow: c.eyebrow ?? c.name,
    title: c.subtitle ?? c.name,
    body: c.description ?? "",
    ctaLabel: `Shop ${c.name}`,
    ctaHref: `/collections/${c.slug}`,
    priceLine: formatTiers(c.pricingScheme.name),
    bgClass: "from-zinc-900 via-neutral-900 to-black",
    backgroundImageUrl: collectionCarouselBg(c),
    productImageUrl: collectionProductImg(c),
  }));

  const slides = [...INTRO_SLIDES, ...collectionSlides, ...OUTRO_SLIDES];

  return (
    <main className="relative min-h-screen overflow-hidden bg-zinc-950 text-white">
      <GlobalBackdrop />

      <section className="relative border-b border-white/10 overflow-hidden">
        <SectionGlow />
        <div className="relative mx-auto max-w-7xl px-6 py-6 md:px-8 md:py-8">
          <div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
            <div className="max-w-4xl">
              <div className="text-[11px] font-black uppercase tracking-[0.3em] text-red-300">
                3D Press, USA • East Windsor, NJ
              </div>
              <h1 className="mt-3 max-w-4xl text-3xl font-black tracking-tight text-white md:text-4xl lg:text-4xl">
                Your hitch cover is embarrassing you. We fixed that.
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-200 md:text-base">
                3D-printed right here in New Jersey. Our modular system keeps the base on your truck and lets you swap the placard whenever the mood changes — new season, new look, no problem. Built tough. Priced right. Made in America.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 lg:self-end">
              {[
                { text: "Swap the look. Keep the hardware.", cls: "border-red-400/20 bg-red-500/15 text-red-50" },
                { text: "Printed in New Jersey. Tough enough to say so.", cls: "border-blue-400/20 bg-blue-500/15 text-blue-50" },
                { text: "TPU boot protects your receiver. Because it deserves it.", cls: "border-amber-300/20 bg-amber-500/15 text-amber-50" },
              ].map((item) => (
                <div key={item.text} className={`rounded-2xl border p-4 text-sm font-semibold shadow-[0_8px_24px_rgba(0,0,0,0.18)] backdrop-blur-sm ${item.cls}`}>
                  {item.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative border-b border-white/10 overflow-hidden">
        <SectionGlow color="from-blue-500/14 via-red-400/10 to-transparent" />
        <div className="relative mx-auto max-w-7xl px-6 py-8 md:px-8 md:py-10">
          <HomeCarousel slides={slides} />
        </div>
      </section>

      <section className="relative border-b border-white/10 overflow-hidden">
        <SectionGlow color="from-orange-400/12 via-emerald-400/8 to-transparent" />
        <div className="relative mx-auto max-w-7xl px-6 py-12 md:px-8">
          <div className="grid gap-6 md:grid-cols-3">
            <FeatureCard
              eyebrow="Better by design"
              title="Not the junk you've seen before"
              body="Most hitch covers are one-piece throwaways from overseas. Ours is a modular system — keep the good hardware, swap the placard when you want something fresh. Your wallet will notice."
              tintClass="bg-gradient-to-br from-red-500/14 via-white/[0.06] to-white/[0.03]"
            />
            <FeatureCard
              eyebrow="Built for the real world"
              title="Weather's got nothing on this"
              body="UV, rain, road grime, the neighbor's opinion — our covers handle it all. High-quality materials, tight fit, and easy replacement that won't make you regret buying American."
              tintClass="bg-gradient-to-br from-blue-500/14 via-white/[0.06] to-white/[0.03]"
            />
            <FeatureCard
              eyebrow="The hardware"
              title="One base. Infinite looks."
              body="Receiver-mounted base with TPU boot and PETG retaining clip. Installs once. Stays forever. Swap caps anytime — $10 to start, $9 with hero or patriotic caps."
              tintClass="bg-gradient-to-br from-amber-400/16 via-white/[0.06] to-white/[0.03]"
            />
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden">
        <SectionGlow color="from-orange-500/18 via-red-400/8 to-transparent" />
        <div className="relative mx-auto max-w-7xl px-6 py-12 md:px-8">
          <div className="relative overflow-hidden rounded-[2rem] border border-orange-400/20 bg-[linear-gradient(135deg,rgba(146,64,14,0.42),rgba(120,53,15,0.35),rgba(67,20,7,0.72))] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.28)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.18),transparent_28%)]" />
            <div className="absolute inset-y-0 right-0 w-1/3 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.04))]" />
            <div className="absolute -bottom-12 left-10 h-36 w-36 rounded-full bg-red-500/10 blur-3xl" />
            <div className="absolute -top-10 right-20 h-40 w-40 rounded-full bg-amber-400/10 blur-3xl" />
            <div className="relative">
              <div className="text-xs font-black uppercase tracking-[0.25em] text-orange-300">Custom Work</div>
              <h2 className="mt-3 text-3xl font-black tracking-tight">Got an idea that doesn&apos;t fit in a square?</h2>
              <p className="mt-4 max-w-3xl text-lg leading-8 text-orange-50/90">
                Good news — we&apos;re not square. We can print custom shapes, sizes, and designs. Round, oval, state-shaped, your company logo, your kid&apos;s drawing from the fridge — if it fits on a hitch, we want to hear about it. Drop us an email and let&apos;s talk.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="mailto:designs@3dpressusa.com"
                  className="rounded-full bg-white px-6 py-3 text-sm font-black text-black transition hover:bg-zinc-200"
                >
                  designs@3dpressusa.com
                </Link>
                <div className="rounded-full border border-orange-300/25 bg-orange-400/15 px-4 py-3 text-sm font-bold text-orange-50">
                  Any shape · Any design · Standard pricing
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
