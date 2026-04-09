"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type CarouselSlide = {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  priceLine: string;
  bgClass: string;
  backgroundImageUrl?: string;
  productImageUrl?: string;
};

function SlideCard({ slide }: { slide: CarouselSlide }) {
  const hasBgImage = !!slide.backgroundImageUrl;
  const hasProductImage = !!slide.productImageUrl;

  return (
    <div
      className={`group relative min-w-full overflow-hidden rounded-[2rem] border-2 border-white/20 shadow-[0_20px_80px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.22)] ${hasBgImage ? "bg-black" : `bg-gradient-to-br ${slide.bgClass}`
        }`}
    >
      {hasBgImage && (
        <img
          src={slide.backgroundImageUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-45 transition duration-500 group-hover:scale-[1.02]"
        />
      )}

      {!hasBgImage && (
        <>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.10),transparent_35%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.05),transparent_40%,rgba(255,255,255,0.02))]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(239,68,68,0.18),transparent_22%),radial-gradient(circle_at_75%_20%,rgba(59,130,246,0.14),transparent_24%),radial-gradient(circle_at_55%_80%,rgba(245,158,11,0.12),transparent_20%)]" />
        </>
      )}
      <div className="pointer-events-none absolute inset-0 rounded-[2rem] ring-1 ring-white/10" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.78)_0%,rgba(0,0,0,0.56)_38%,rgba(0,0,0,0.24)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-28 bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.35))]" />

      <div className="relative grid min-h-[360px] gap-6 p-6 md:grid-cols-[1.15fr_0.85fr] md:p-8">
        <div className="flex flex-col justify-center">
          <div className="w-fit rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em] text-white/80 backdrop-blur-sm">
            {slide.eyebrow}
          </div>

          <h2 className="mt-4 max-w-3xl text-2xl font-black leading-tight tracking-tight text-white line-clamp-3 md:text-3xl">
            {slide.title}
          </h2>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/85 line-clamp-3 md:text-base">
            {slide.body}
          </p>

          <div className="mt-5 inline-flex w-fit rounded-full border border-amber-300/30 bg-amber-400/15 px-4 py-2 text-sm font-bold text-amber-100 shadow-[0_0_0_1px_rgba(251,191,36,0.08)]">
            {slide.priceLine}
          </div>

          <div className="mt-6">
            <Link
              href={slide.ctaHref}
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-black text-black transition hover:bg-zinc-200"
            >
              {slide.ctaLabel}
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        {hasProductImage && (
          <div className="flex items-center justify-center">
            <div className="relative">
              <div className="absolute inset-0 scale-95 rounded-full bg-red-400/10 blur-3xl" />
              <div className="absolute inset-0 scale-90 rounded-full bg-blue-400/10 blur-3xl" />
              <img
                src={slide.productImageUrl}
                alt=""
                className="relative max-h-[250px] w-auto object-contain drop-shadow-[0_12px_30px_rgba(0,0,0,0.55)] md:max-h-[270px]"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function HomeCarousel({ slides }: { slides: CarouselSlide[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeSlide = useMemo(() => slides[activeIndex], [activeIndex, slides]);

  function goPrev() {
    setActiveIndex((i) => (i - 1 + slides.length) % slides.length);
  }
  function goNext() {
    setActiveIndex((i) => (i + 1) % slides.length);
  }

  return (
    <>
      <div className="relative">
        <SlideCard slide={activeSlide} />

        {/* Prev — full-height touch target, clipped visual child */}
        <button
          type="button"
          onClick={goPrev}
          aria-label="Previous slide"
          className="absolute left-0 top-1/2 -translate-y-1/2 flex h-36 w-8 items-center justify-center"
        >
          <span
            aria-hidden="true"
            style={{
              clipPath: "polygon(0 8%, 100% 18%, 100% 82%, 0 92%)",
              background: "linear-gradient(to right, rgba(255,255,255,0.22), rgba(255,255,255,0.06))",
              boxShadow: "inset -1px 0 0 rgba(255,255,255,0.18)",
            }}
            className="absolute inset-0 backdrop-blur-sm transition"
          />
          <span className="relative text-lg font-black text-white/80">‹</span>
        </button>

        {/* Next — full-height touch target, clipped visual child */}
        <button
          type="button"
          onClick={goNext}
          aria-label="Next slide"
          className="absolute right-0 top-1/2 -translate-y-1/2 flex h-36 w-8 items-center justify-center"
        >
          <span
            aria-hidden="true"
            style={{
              clipPath: "polygon(0 18%, 100% 8%, 100% 92%, 0 82%)",
              background: "linear-gradient(to left, rgba(255,255,255,0.22), rgba(255,255,255,0.06))",
              boxShadow: "inset 1px 0 0 rgba(255,255,255,0.18)",
            }}
            className="absolute inset-0 backdrop-blur-sm transition"
          />
          <span className="relative text-lg font-black text-white/80">›</span>
        </button>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
        <div className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-sm font-semibold text-zinc-200 backdrop-blur-sm">
          {activeIndex + 1} / {slides.length}
        </div>

        <div className="flex flex-wrap gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-2 backdrop-blur-sm">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Go to ${slide.title}`}
              className={`h-3 rounded-full transition ${index === activeIndex ? "w-10 bg-white" : "w-3 bg-white/40 hover:bg-white/60"
                }`}
            />
          ))}
        </div>
      </div>
    </>
  );
}
