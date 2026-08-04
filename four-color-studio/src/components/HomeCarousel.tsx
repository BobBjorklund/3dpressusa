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
    <div className="group relative min-w-full overflow-hidden rounded-md border border-brushed-aluminum/25 bg-steel-panel">
      {hasBgImage ? (
        <>
          <img
            src={slide.backgroundImageUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gunmetal/55" />
        </>
      ) : (
        <div className="plate-texture absolute inset-0" />
      )}

      <span className="rivet left-3 top-3" aria-hidden="true" />
      <span className="rivet right-3 top-3" aria-hidden="true" />
      <span className="rivet left-3 bottom-3" aria-hidden="true" />
      <span className="rivet right-3 bottom-3" aria-hidden="true" />

      <div className="relative grid min-h-[300px] gap-5 px-14 py-6 md:grid-cols-[1.15fr_0.85fr] md:px-16 md:py-8">
        <div className="flex flex-col justify-center">
          <div className="w-fit font-mono text-[10px] uppercase tracking-[0.3em] text-hazard-yellow">
            {slide.eyebrow}
          </div>

          <h2 className="mt-3 max-w-3xl font-display text-2xl uppercase leading-[0.95] tracking-tight text-white line-clamp-3 md:text-3xl">
            {slide.title}
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-brushed-aluminum line-clamp-3 md:text-base">
            {slide.body}
          </p>

          <div className="mt-4 inline-flex w-fit rounded-sm border border-hazard-yellow/40 bg-hazard-yellow/10 px-4 py-2 font-mono text-sm text-hazard-yellow">
            {slide.priceLine}
          </div>

          <div className="mt-5">
            <Link
              href={slide.ctaHref}
              className="inline-flex items-center gap-2 rounded-sm bg-plate-red px-6 py-2.5 font-display text-sm uppercase tracking-wide text-white transition hover:bg-plate-red/85"
            >
              {slide.ctaLabel}
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        {hasProductImage && (
          <div className="flex items-center justify-center">
            <img
              src={slide.productImageUrl}
              alt=""
              className="max-h-[210px] w-auto object-contain md:max-h-[230px]"
            />
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

        <button
          type="button"
          onClick={goPrev}
          aria-label="Previous slide"
          className="absolute left-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-sm border border-brushed-aluminum/30 bg-gunmetal/80 text-white transition hover:border-brushed-aluminum focus-visible:outline focus-visible:outline-2 focus-visible:outline-hazard-yellow"
        >
          <span aria-hidden="true" className="text-lg">‹</span>
        </button>

        <button
          type="button"
          onClick={goNext}
          aria-label="Next slide"
          className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-sm border border-brushed-aluminum/30 bg-gunmetal/80 text-white transition hover:border-brushed-aluminum focus-visible:outline focus-visible:outline-2 focus-visible:outline-hazard-yellow"
        >
          <span aria-hidden="true" className="text-lg">›</span>
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
        <div className="font-mono text-sm text-brushed-aluminum">
          {String(activeIndex + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Go to ${slide.title}`}
              className={`h-1.5 rounded-full transition ${index === activeIndex ? "w-8 bg-plate-red" : "w-1.5 bg-brushed-aluminum/40 hover:bg-brushed-aluminum/70"
                }`}
            />
          ))}
        </div>
      </div>
    </>
  );
}
