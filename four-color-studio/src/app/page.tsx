"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type CarouselSlide = {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  priceLine: string;
  bgClass: string;
  backgroundLabel: string;
  productLabel: string;
  backgroundImageUrl?: string;
  productImageUrl?: string;
};

const slides: CarouselSlide[] = [
  {
    id: "main-cover",
    eyebrow: "Core Product",
    title: "A modular hitch cover built to look better, last longer, and cost less to keep fresh.",
    body:
      "Swap the placard, not the whole unit. Built for outdoor use, designed for easy replacement, and made to give your truck a better-looking, better-fitting cover system.",
    ctaLabel: "Shop Bundles",
    ctaHref: "/bundles",
    priceLine: "Cover + cap: $15",
    bgClass: "from-zinc-900 via-neutral-900 to-black",
    backgroundLabel: "Background art placeholder: Americana / truck detail / product lifestyle",
    productLabel: "Product image placeholder: cover + cap mounted on truck",
  },
  {
    id: "main-pricing",
    eyebrow: "Bundle Pricing",
    title: "Start simple. Swap often. Keep the hardware.",
    body:
      "Cover + cap for $15, cover + 2 caps for $20, and bulk pricing that rewards people actually buying more than one.",
    ctaLabel: "See Bundle Options",
    ctaHref: "/bundles",
    priceLine: "3-cap bundle: $18 • 5-cap bundle: $25",
    bgClass: "from-slate-900 via-stone-900 to-zinc-950",
    backgroundLabel: "Background art placeholder: pricing / layered placards / truck rear view",
    productLabel: "Product image placeholder: spread of covers and caps",
  },
  {
    id: "holiday",
    eyebrow: "Holiday Collections",
    title: "Holiday placards without committing your whole hitch to one season.",
    body:
      "Keep the same cover and rotate in seasonal placards when the mood hits. Easier to store, easier to swap, and a lot cheaper than replacing the whole thing.",
    ctaLabel: "View Collections",
    ctaHref: "/collections/holiday",
    priceLine: "Standard caps: 1 / 3 / 5 = $7 / $6 / $5",
    bgClass: "from-emerald-950 via-zinc-900 to-red-950",
    backgroundLabel: "Background art placeholder: holiday themed texture / seasonal flag tones",
    productLabel: "Product image placeholder: holiday cap lineup",
  },
  {
    id: "hero-collection",
    eyebrow: "Hero Collection",
    title: "Built to support first responders with designs that actually mean something.",
    body:
      "Police, fire, EMS, memorial, and support-forward placards designed for pride, remembrance, and everyday visibility.",
    ctaLabel: "Shop Hero Collection",
    ctaHref: "/collections/hero",
    priceLine: "Hero caps: 1 / 3 / 5 = $6 / $5 / $4 • add cover: +$7",
    bgClass: "from-blue-950 via-zinc-900 to-black",
    backgroundLabel: "Background art placeholder: thin blue line / first responder flag theme",
    productLabel: "Product image placeholder: hero collection caps",
    productImageUrl: "/heroCollection.png",
    backgroundImageUrl: "/heroBg.png",
  },
  {
    id: "patriotic",
    eyebrow: "Patriotic Collection",
    title: "Patriotic designs for people who don’t need imported junk to wave the flag.",
    body:
      "Flags, Americana, and red-white-and-blue-heavy designs built for trucks, tailgates, and everyday flexing of extremely obvious values.",
    ctaLabel: "Shop Patriotic",
    ctaHref: "/collections/patriotic",
    priceLine: "Patriotic caps: 1 / 3 / 5 = $6 / $5 / $4 • add cover: +$7",
    bgClass: "from-red-950 via-zinc-900 to-blue-950",
    backgroundLabel: "Background art placeholder: American flag texture",
    productLabel: "Product image placeholder: patriotic cap collection",
    productImageUrl: "/patrioticCollection.png",
    backgroundImageUrl: "/patrioticBg.png",
  },
  {
    id: "outdoors",
    eyebrow: "Outdoorsmanship",
    title: "For hunters, outdoorsmen, range folks.  Truck owners who use their trucks.",
    body:
      "Rugged style, easy swaps, and designs that fit right in at the range, the woods, the water, or the tailgate.",
    ctaLabel: "Shop Outdoors",
    ctaHref: "/collections/outdoors",
    priceLine: "Standard caps: 1 / 3 / 5 = $7 / $6 / $5",
    bgClass: "from-green-950 via-zinc-900 to-stone-950",
    backgroundLabel: "Background art placeholder: camo / woods / outdoor texture",
    productLabel: "Product image placeholder: outdoors placard lineup",
  },
  {
    id: "design-tool",
    eyebrow: "Design Your Own",
    title: "Don’t see anything you like?",
    body:
      "Build your own placard. Great for sports-inspired designs, names, numbers, rec league ideas, and custom looks you want on your truck.",
    ctaLabel: "Open Design Tool",
    ctaHref: "/design",
    priceLine: "Standard pricing • high-detail mode: +$1 per cap",
    bgClass: "from-orange-950 via-zinc-900 to-neutral-950",
    backgroundLabel: "Background art placeholder: bold custom graphic texture",
    productLabel: "Product image placeholder: custom design preview",
  },
  {
    id: "bundle-pricing",
    eyebrow: "Build Your Bundle",
    title: "Mix collections, house designs, and custom caps your way.",
    body:
      "The more caps you buy, the better the pricing gets. Buy across collections, keep the discounts, and build the setup you actually want.",
    ctaLabel: "Build a Bundle",
    ctaHref: "/bundles",
    priceLine: "Standard cover add-on: +$8 • Hero/Patriotic cover add-on: +$7",
    bgClass: "from-neutral-950 via-zinc-900 to-neutral-800",
    backgroundLabel: "Background art placeholder: multi-collection collage",
    productLabel: "Product image placeholder: mixed bundle layout",
  },
];

function SlideCard({
  slide,
}: {
  slide: CarouselSlide;
}) {
  const hasBgImage = !!slide.backgroundImageUrl;
  const hasProductImage = !!slide.productImageUrl;

  return (
    <div
      className={`relative min-w-full overflow-hidden rounded-3xl border border-white/10 ${hasBgImage
        ? "bg-black"
        : `bg-gradient-to-br ${slide.bgClass}`
        }`}
    >
      {/* Background image (if present) */}
      {hasBgImage && (
        <img
          src={slide.backgroundImageUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-30"
        />
      )}

      {/* Overlay to keep text readable */}
      <div className="absolute inset-0 bg-black/40" />

      <div className="relative grid min-h-[360px] gap-6 p-6 md:grid-cols-[1.3fr_0.9fr] md:p-8">
        {/* LEFT CONTENT */}
        <div className="flex flex-col justify-center">
          <div className="text-[11px] font-black uppercase tracking-[0.28em] text-white/60">
            {slide.eyebrow}
          </div>

          <h2 className="mt-3 max-w-3xl text-2xl font-black leading-tight tracking-tight text-white md:text-3xl line-clamp-3">
            {slide.title}
          </h2>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/80 md:text-base line-clamp-3">
            {slide.body}
          </p>

          <div className="mt-5 inline-flex w-fit rounded-full border border-amber-400/40 bg-amber-500/10 px-4 py-2 text-sm font-bold text-amber-200">
            {slide.priceLine}
          </div>

          <div className="mt-6">
            <Link
              href={slide.ctaHref}
              className="inline-flex rounded-full bg-white px-6 py-3 text-sm font-black text-black transition hover:bg-zinc-200"
            >
              {slide.ctaLabel}
            </Link>
          </div>
        </div>

        {/* RIGHT SIDE (product image ONLY if exists) */}
        {hasProductImage && (
          <div className="flex items-center justify-center">
            <img
              src={slide.productImageUrl}
              alt=""
              className="max-h-[260px] w-auto object-contain drop-shadow-2xl"
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default function HomePage() {
  const [activeIndex, setActiveIndex] = useState(0);

  const activeSlide = useMemo(() => slides[activeIndex], [activeIndex]);

  // useEffect(() => {
  //   const timer = window.setInterval(() => {
  //     setActiveIndex((current) => (current + 1) % slides.length);
  //   }, 10000);

  //   return () => window.clearInterval(timer);
  // }, []);

  function goToSlide(index: number) {
    setActiveIndex(index);
  }

  function goPrev() {
    setActiveIndex((current) => (current - 1 + slides.length) % slides.length);
  }

  function goNext() {
    setActiveIndex((current) => (current + 1) % slides.length);
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <section className="border-b border-white/10">
        <div className="mx-auto max-w-7xl px-6 py-6 md:px-8 md:py-8">
          <div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
            <div className="max-w-4xl">
              <div className="text-[11px] font-black uppercase tracking-[0.3em] text-red-300">
                3D Press, USA • East Windsor, NJ
              </div>

              <h1 className="mt-3 max-w-4xl text-3xl font-black tracking-tight text-white md:text-4xl lg:text-4xl">
                A better hitch cover system that is modular, customizable, and built
                to last.
              </h1>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-300 md:text-base">
                Swap the placard without replacing the whole unit. Built for outdoor
                use, easier replacement, cleaner fit, and a better-looking setup on
                the back of your truck.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 lg:self-end">
              {[
                "Swap the placard, not the whole unit",
                "Built for outdoor use and cheaper replacement",
                "Protective boot included for a cleaner fit and finish",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm font-semibold text-zinc-200"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-white/10">
        <div className="mx-auto max-w-7xl px-6 py-8 md:px-8 md:py-10">
          <div className="relative">
            <SlideCard slide={activeSlide} />

            <button
              type="button"
              onClick={goPrev}
              aria-label="Previous slide"
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-black/40 px-4 py-3 text-sm font-black text-white transition hover:bg-black/60"
            >
              ←
            </button>

            <button
              type="button"
              onClick={goNext}
              aria-label="Next slide"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-black/40 px-4 py-3 text-sm font-black text-white transition hover:bg-black/60"
            >
              →
            </button>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
            <div className="text-sm font-semibold text-zinc-400">
              {activeIndex + 1} / {slides.length}
            </div>

            <div className="flex flex-wrap gap-2">
              {slides.map((slide, index) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => goToSlide(index)}
                  aria-label={`Go to ${slide.title}`}
                  className={`h-3 rounded-full transition ${index === activeIndex
                    ? "w-10 bg-white"
                    : "w-3 bg-white/30 hover:bg-white/50"
                    }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-white/10">
        <div className="mx-auto max-w-7xl px-6 py-12 md:px-8">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="text-xs font-black uppercase tracking-[0.2em] text-white/50">
                Better by design
              </div>
              <h2 className="mt-3 text-2xl font-black">Not disposable junk</h2>
              <p className="mt-3 text-zinc-300">
                Most hitch covers are one-piece throwaways. Ours is a modular
                system, so you keep the good hardware and swap the front when you
                want something new.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="text-xs font-black uppercase tracking-[0.2em] text-white/50">
                Built for the real world
              </div>
              <h2 className="mt-3 text-2xl font-black">Made for weather, wear, and cheap refreshes</h2>
              <p className="mt-3 text-zinc-300">
                Built with high-quality materials chosen for outdoor use, fit,
                protection, and easy replacement when you want a new look without
                rebuying the whole setup.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="text-xs font-black uppercase tracking-[0.2em] text-white/50">
                Your lane, your way
              </div>
              <h2 className="mt-3 text-2xl font-black">House designs or custom work</h2>
              <p className="mt-3 text-zinc-300">
                Shop ready-made collections or head into the design tool for
                sports-inspired designs, names, numbers, rec league ideas, and
                your own custom look.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-7xl px-6 py-12 md:px-8">
          <div className="rounded-3xl border border-orange-500/30 bg-orange-500/10 p-8">
            <div className="text-xs font-black uppercase tracking-[0.25em] text-orange-300">
              Custom work
            </div>
            <h2 className="mt-3 text-3xl font-black tracking-tight">
              Don’t see anything you like?
            </h2>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-orange-100/85">
              Build your own placard with the design tool. It is a great fit for
              sports-style ideas, team colors, names, numbers, rec leagues, and
              custom concepts you want to make your own.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/design"
                className="rounded-full bg-white px-6 py-3 text-sm font-black text-black transition hover:bg-zinc-200"
              >
                Open Design Tool
              </Link>
              <div className="rounded-full border border-orange-300/30 px-4 py-3 text-sm font-bold text-orange-100">
                Standard pricing • high-detail mode +$1 per cap
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}