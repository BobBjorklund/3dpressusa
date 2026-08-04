import Link from "next/link";
import HomeCarousel, { CarouselSlide } from "@/components/HomeCarousel";
import { getCollections, getItemsBySlugs, collectionCarouselBg, collectionProductImg, itemHeroImg, formatTiers } from "@/lib/storefront/collections";
import BestSellersSidebar, { type BestSellerItem } from "@/components/BestSellersSidebar";
import SpecPlate from "@/components/SpecPlate";

const BEST_SELLER_SLUGS = [
  "patriot-rwb-eagle",
  "patriot-250",
  "patriot-stars-stripes-and-spine-male",
  "patriot-freedom-isnt-free",
];

// ── Static slides (non-collection) ───────────────────────────────────────────

const INTRO_SLIDES: CarouselSlide[] = [
  {
    id: "main-cover",
    eyebrow: "The System",
    title: "Buy the base once. Swap the look whenever the mood hits.",
    body: "Our modular hitch cover keeps the receiver-mounted hardware on your truck for good. The placard up front? That's the fun part - change it as often as your team's winning streak.",
    ctaLabel: "Shop Collections",
    ctaHref: "/collections",
    priceLine: "Full set: $20 · Base unit: $10 · Cap: $10",
    bgClass: "from-zinc-900 via-neutral-900 to-black",
  },
  {
    id: "base-unit",
    eyebrow: "The Hardware",
    title: "The piece that stays on forever.",
    body: "Receiver-mounted base with a PETG retaining clip. Installs once, stays put, and never asks you to replace it - just the cap up front.",
    ctaLabel: "Get the Base Unit",
    ctaHref: "/base-unit",
    priceLine: "$10 standalone · $9 with a standard cap · $8 with hero or patriotic caps",
    bgClass: "from-zinc-900 via-neutral-900 to-black",
    backgroundImageUrl: "/truck-bg.png",
    productImageUrl: "/collections/base-unit-product.png",
  },
  {
    id: "main-pricing",
    eyebrow: "Quantity Pricing",
    title: "The more looks you grab, the less each one runs.",
    body: "Pick anything from any collection. Pricing tiers are based on your total quantity - mix and match freely. Stack the savings without touching a coupon code.",
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
    priceLine: "Standard cover add-on: +$9 · Hero/Patriotic cover add-on: +$8",
    bgClass: "from-neutral-950 via-zinc-900 to-neutral-800",
  },
];

// ── UI helpers ────────────────────────────────────────────────────────────────

function FeatureCard({
  eyebrow,
  title,
  body,
  accent,
}: {
  eyebrow: string;
  title: string;
  body: string;
  accent: "red" | "blue" | "yellow";
}) {
  return (
    <SpecPlate accent={accent} className="p-6">
      <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-brushed-aluminum">{eyebrow}</div>
      <h2 className="mt-3 font-display text-2xl uppercase leading-tight tracking-tight text-white">{title}</h2>
      <p className="mt-3 leading-6 text-brushed-aluminum">{body}</p>
    </SpecPlate>
  );
}

function ExplodedDiagram() {
  return (
    <div className="relative flex flex-col items-center gap-4 py-4">
      <SpecPlate accent="blue" className="w-full max-w-[260px] px-5 py-4 text-center">
        <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-federal-blue">Part 01 - Permanent</div>
        <div className="mt-1 font-display text-xl uppercase text-white">Base Unit</div>
        <div className="mt-1 text-xs text-brushed-aluminum">Receiver-mounted</div>
      </SpecPlate>
      <svg width="2" height="28" aria-hidden="true">
        <line x1="1" y1="0" x2="1" y2="28" stroke="var(--color-brushed-aluminum)" strokeOpacity="0.4" strokeDasharray="3 3" />
      </svg>
      <SpecPlate accent="red" className="w-full max-w-[260px] px-5 py-4 text-center">
        <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-plate-red">Part 02 - Swappable</div>
        <div className="mt-1 font-display text-xl uppercase text-white">Placard Cap</div>
        <div className="mt-1 text-xs text-brushed-aluminum">Change it with the season</div>
      </SpecPlate>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

// Collections/items only change when we ship a batch and redeploy — no
// time-based revalidation needed. Static until the next `next build`.
export const revalidate = false;

export default async function HomePage() {
  const collections = await getCollections();

  const bestSellerItems = await getItemsBySlugs(BEST_SELLER_SLUGS);
  const bestSellerBySlug = new Map(bestSellerItems.map((item) => [item.slug, item]));
  const bestSellers: BestSellerItem[] = BEST_SELLER_SLUGS
    .map((slug) => bestSellerBySlug.get(slug))
    .filter((item): item is NonNullable<typeof item> => item !== undefined)
    .map((item) => ({
      slug: item.slug,
      name: item.name,
      collectionSlug: item.collection.slug,
      heroImg: itemHeroImg(item),
    }));

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
    <main className="relative min-h-screen bg-gunmetal text-white">
      {/* Disabled for now — covered too much of the page on real viewports. */}
      {/* <BestSellersSidebar items={bestSellers} /> */}

      <div className="flex flex-col gap-6 py-6 md:gap-8 md:py-8">

      {/* Hero — the thesis: one part stays, one part swaps */}
      <section className="relative">
        <div className="mx-auto max-w-7xl px-6 md:px-8">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <div className="font-mono text-xs uppercase tracking-[0.3em] text-brushed-aluminum">
                3D Press, USA - Est. East Windsor, NJ
              </div>
              <h1 className="mt-4 font-display text-3xl uppercase leading-[0.95] tracking-tight text-white md:text-4xl lg:text-5xl">
                Your hitch cover is embarrassing you.
              </h1>
              <p className="mt-2 font-display text-2xl uppercase tracking-tight text-plate-red md:text-3xl">
                We fixed that.
              </p>
              <p className="mt-4 max-w-xl leading-7 text-brushed-aluminum">
                3D-printed right here in New Jersey. Our modular system keeps the base on your truck and lets you swap the placard whenever the mood changes - new season, new look, no problem. Built tough. Priced right. Made in America.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/collections"
                  className="rounded-sm bg-plate-red px-6 py-3 font-display text-sm uppercase tracking-wide text-white transition hover:bg-plate-red/85"
                >
                  Shop Collections
                </Link>
                <Link
                  href="/base-unit"
                  className="rounded-sm border border-brushed-aluminum/40 px-6 py-3 font-display text-sm uppercase tracking-wide text-white transition hover:border-brushed-aluminum"
                >
                  Get the Base Unit
                </Link>
              </div>
            </div>

            <ExplodedDiagram />
          </div>
        </div>
      </section>

      {/* Carousel */}
      <section>
        <div className="mx-auto max-w-7xl px-6 md:px-8">
          <HomeCarousel slides={slides} />
        </div>
      </section>

      {/* No-hitch / coaster promo */}
      <section>
        <div className="mx-auto max-w-7xl px-6 md:px-8">
          <SpecPlate accent="yellow" className="flex flex-col items-start gap-4 p-5 sm:flex-row sm:items-center sm:justify-between md:p-6">
            <div>
              <h2 className="font-display text-2xl uppercase leading-tight text-white md:text-3xl">
                Don&apos;t have a hitch but still have American pride? No problem.
              </h2>
              <p className="mt-3 max-w-2xl text-brushed-aluminum">
                Every single design on this site - every branch, every holiday, every one-off - is also available as a coaster set. No truck required.
                Hero &amp; Patriot: 4 for $20. Everything else: 4 for $25.
              </p>
            </div>
            <Link
              href="/collections"
              className="flex-shrink-0 rounded-sm bg-white px-6 py-3 font-display text-sm uppercase tracking-wide text-gunmetal transition hover:bg-brushed-aluminum"
            >
              Browse Designs →
            </Link>
          </SpecPlate>
        </div>
      </section>

      {/* Feature grid */}
      <section>
        <div className="mx-auto max-w-7xl px-6 md:px-8">
          <div className="grid gap-6 md:grid-cols-3">
            <FeatureCard
              accent="red"
              eyebrow="Better by design"
              title="Not the junk you've seen before"
              body="Most hitch covers are one-piece throwaways from overseas. Ours is a modular system - keep the good hardware, swap the placard when you want something fresh. Your wallet will notice."
            />
            <FeatureCard
              accent="blue"
              eyebrow="Built for the real world"
              title="Weather's got nothing on this"
              body="UV, rain, road grime, the neighbor's opinion - our covers handle it all. High-quality materials, tight fit, and easy replacement that won't make you regret buying American."
            />
            <FeatureCard
              accent="yellow"
              eyebrow="The hardware"
              title="One base. Infinite looks."
              body="Receiver-mounted base with a PETG retaining clip. Installs once. Stays forever. Swap caps anytime - $10 standalone, $9 with a standard cap, $8 with hero or patriotic caps."
            />
          </div>
        </div>
      </section>

      {/* Custom work CTA */}
      <section>
        <div className="mx-auto max-w-7xl px-6 md:px-8">
          <SpecPlate accent="red" className="p-8">
            <div className="font-mono text-xs uppercase tracking-[0.25em] text-plate-red">Custom Work</div>
            <h2 className="mt-3 font-display text-3xl uppercase tracking-tight text-white">Got an idea that doesn&apos;t fit in a square?</h2>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-brushed-aluminum">
              Good news - we&apos;re not square. We can print custom shapes, sizes, and designs. Round, oval, state-shaped, your company logo, your kid&apos;s drawing from the fridge - if it fits on a hitch, we want to hear about it. Drop us an email and let&apos;s talk.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="mailto:designs@3dpressusa.com"
                className="rounded-sm bg-white px-6 py-3 font-display text-sm uppercase tracking-wide text-gunmetal transition hover:bg-brushed-aluminum"
              >
                designs@3dpressusa.com
              </Link>
              <div className="rounded-sm border border-plate-red/40 px-4 py-3 font-mono text-sm text-brushed-aluminum">
                Any shape · Any design · Standard pricing
              </div>
            </div>
          </SpecPlate>
        </div>
      </section>

      </div>
    </main>
  );
}
