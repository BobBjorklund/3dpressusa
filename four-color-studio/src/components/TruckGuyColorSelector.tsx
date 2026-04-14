"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/context/CartContext";
import type { CapPricingType } from "@/lib/storefront/pricing-config";

type InventoryColor = { id: string; name: string; hex: string };

type Item = {
  slug: string;
  name: string;
  description?: string | null;
  pricingType: string;
};

// Short label for color name (first meaningful word)
function shortName(name: string) {
  const parts = name.split(" ");
  return parts[parts.length - 1] ?? name;
}

function ColorSwatch({
  color,
  selected,
  onClick,
}: {
  color: InventoryColor;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={color.name}
      className={`relative h-8 w-8 flex-shrink-0 rounded-full transition focus:outline-none ${
        selected ? "ring-2 ring-white ring-offset-2 ring-offset-zinc-900 scale-110" : "hover:scale-105"
      }`}
      style={{ backgroundColor: color.hex }}
    >
      {selected && (
        <span className="absolute inset-0 flex items-center justify-center">
          <svg className="h-4 w-4 drop-shadow" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </span>
      )}
    </button>
  );
}

// Cache fetched+cleaned SVG strings so we don't re-fetch on color change
const svgCache: Record<string, string> = {};

const WHITE_RE = /^(#fff|#ffffff|white)$/i;

function cleanSvg(raw: string, logoHex: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(raw, "image/svg+xml");
  const svg = doc.querySelector("svg");
  if (!svg) return raw;

  // Remove any element that is clearly a background fill:
  //   - <rect> anywhere with a white or 0,0-origin fill
  //   - <path> with an explicit white fill (background wash, not a logo element)
  svg.querySelectorAll("rect, path").forEach((el) => {
    const fill = (el.getAttribute("fill") ?? "").trim();
    if (!fill) return;
    if (WHITE_RE.test(fill)) {
      el.remove();
      return;
    }
    // Also remove 0,0 rects with any neutral fill
    if (el.tagName === "rect") {
      const x = parseFloat(el.getAttribute("x") ?? "0");
      const y = parseFloat(el.getAttribute("y") ?? "0");
      if (x === 0 && y === 0) el.remove();
    }
  });

  // Colour every remaining drawn element with the logo hex
  svg.querySelectorAll("path, circle, ellipse, polygon, polyline, rect").forEach((el) => {
    const fill = el.getAttribute("fill");
    // Only override if fill is set to something other than "none",
    // or if it's unset (inherits — treat as drawable)
    if (fill !== "none") el.setAttribute("fill", logoHex);
    const stroke = el.getAttribute("stroke");
    if (stroke && stroke !== "none") el.setAttribute("stroke", logoHex);
  });

  // Neutralise any fill set on <g> wrappers so it doesn't override our paths
  svg.querySelectorAll("g").forEach((g) => {
    if (g.getAttribute("fill") && g.getAttribute("fill") !== "none")
      g.setAttribute("fill", logoHex);
  });

  svg.setAttribute("width", "100%");
  svg.setAttribute("height", "100%");

  return svg.outerHTML;
}

function LogoPreview({ itemSlug, logoHex, bgHex }: { itemSlug: string; logoHex: string; bgHex: string }) {
  const slug = itemSlug.replace(/^truck-guys-/, "");
  const [svgHtml, setSvgHtml] = useState<string | null>(svgCache[slug] ?? null);

  useEffect(() => {
    if (svgCache[slug]) {
      setSvgHtml(svgCache[slug]);
      return;
    }
    fetch(`/truck-logos/${slug}.svg`)
      .then((r) => r.text())
      .then((text) => {
        const cleaned = cleanSvg(text, logoHex);
        svgCache[slug] = cleaned;
        setSvgHtml(cleaned);
      })
      .catch(() => setSvgHtml(null));
  // Only re-fetch when slug changes; color is applied in the DOM directly below
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  // Re-apply color whenever logoHex changes without re-fetching
  const colored = svgHtml
    ? svgHtml.replace(/fill="(?!none)[^"]*"/g, `fill="${logoHex}"`)
             .replace(/stroke="(?!none)[^"]*"/g, `stroke="${logoHex}"`)
    : null;

  return (
    <div
      className="relative w-full max-w-xs aspect-square rounded-2xl border border-white/10 transition-colors duration-300 flex items-center justify-center p-8"
      style={{ backgroundColor: bgHex }}
    >
      {colored ? (
        <div
          className="h-full w-full"
          dangerouslySetInnerHTML={{ __html: colored }}
        />
      ) : (
        <div className="h-8 w-8 animate-pulse rounded-full bg-white/20" />
      )}
    </div>
  );
}

export default function TruckGuyColorSelector({
  items,
}: {
  items: Item[];
  schemeName?: string;
  componentProps?: Record<string, unknown> | null;
}) {
  const { addItem, openCart } = useCart();

  const [colors, setColors] = useState<InventoryColor[]>([]);
  const [loadingColors, setLoadingColors] = useState(true);

  const [selectedItem, setSelectedItem] = useState<Item | null>(items[0] ?? null);
  const [logoColor, setLogoColor] = useState<InventoryColor | null>(null);
  const [bgColor, setBgColor] = useState<InventoryColor | null>(null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    fetch("/api/inventory-colors")
      .then((r) => r.json())
      .then((data: InventoryColor[]) => {
        setColors(data);
        // Default: first dark color as bg, first light/white as logo (or just first two)
        const white = data.find((c) => /white|cream|ivory/i.test(c.name));
        const black = data.find((c) => /black/i.test(c.name));
        setLogoColor(white ?? data[0] ?? null);
        setBgColor(black ?? data[1] ?? data[0] ?? null);
      })
      .finally(() => setLoadingColors(false));
  }, []);

  function handleAdd() {
    if (!selectedItem || !logoColor || !bgColor) return;

    const colorDesc = `${shortName(logoColor.name)} logo / ${shortName(bgColor.name)} base`;
    const displayName = `${selectedItem.name} — ${colorDesc}`;
    const id = `${selectedItem.slug}::${logoColor.id}::${bgColor.id}`;

    addItem({
      id,
      slug: selectedItem.slug,
      type: "cap",
      quantity: qty,
      pricingType: selectedItem.pricingType as CapPricingType,
      name: displayName,
      colorKeys: [logoColor.id, bgColor.id],
    });

    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      openCart();
    }, 800);
  }

  const canAdd = !!selectedItem && !!logoColor && !!bgColor && !loadingColors;

  return (
    <div className="flex flex-col gap-8">

      {/* Brand picker */}
      <div>
        <div className="mb-3 text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500">
          Pick Your Brand
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {items.map((item) => (
            <button
              key={item.slug}
              type="button"
              onClick={() => setSelectedItem(item)}
              className={`rounded-2xl border px-4 py-4 text-left transition ${
                selectedItem?.slug === item.slug
                  ? "border-white/40 bg-white/[0.10] text-white"
                  : "border-white/10 bg-white/[0.03] text-white/60 hover:border-white/20 hover:text-white/80"
              }`}
            >
              <div className="text-base font-black">{item.name}</div>
              {item.description && (
                <div className="mt-1 text-xs text-zinc-500 line-clamp-1">{item.description}</div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Color pickers */}
      {loadingColors ? (
        <div className="text-sm text-zinc-500">Loading colors...</div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">

          <div>
            <div className="mb-3 text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500">
              Logo Color
            </div>
            <div className="flex flex-wrap gap-2">
              {colors.map((c) => (
                <ColorSwatch
                  key={c.id}
                  color={c}
                  selected={logoColor?.id === c.id}
                  onClick={() => setLogoColor(c)}
                />
              ))}
            </div>
            {logoColor && (
              <div className="mt-2 text-xs text-zinc-500">{logoColor.name}</div>
            )}
          </div>

          <div>
            <div className="mb-3 text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500">
              Background Color
            </div>
            <div className="flex flex-wrap gap-2">
              {colors.map((c) => (
                <ColorSwatch
                  key={c.id}
                  color={c}
                  selected={bgColor?.id === c.id}
                  onClick={() => setBgColor(c)}
                />
              ))}
            </div>
            {bgColor && (
              <div className="mt-2 text-xs text-zinc-500">{bgColor.name}</div>
            )}
          </div>
        </div>
      )}

      {/* Preview */}
      {selectedItem && logoColor && bgColor && (
        <div>
          <div className="mb-3 text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500">
            Preview
          </div>
          <LogoPreview
            itemSlug={selectedItem.slug}
            logoHex={logoColor.hex}
            bgHex={bgColor.hex}
          />
          <p className="mt-2 text-xs text-zinc-600">
            Approximate color preview — actual print may vary slightly by filament batch.
          </p>
        </div>
      )}

      {/* Quantity + Add to Cart */}
      <div className="flex items-center gap-4">
        <div className="flex items-center rounded-full border border-white/10 bg-white/[0.04]">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="flex h-10 w-10 items-center justify-center rounded-full text-white/60 transition hover:text-white"
          >
            −
          </button>
          <span className="w-8 text-center text-sm font-black">{qty}</span>
          <button
            type="button"
            onClick={() => setQty((q) => Math.min(20, q + 1))}
            className="flex h-10 w-10 items-center justify-center rounded-full text-white/60 transition hover:text-white"
          >
            +
          </button>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          disabled={!canAdd || added}
          className={`flex flex-1 items-center justify-center gap-2 rounded-full px-8 py-4 text-base font-black transition active:scale-[0.98] disabled:opacity-50 ${
            added
              ? "bg-emerald-500 text-white"
              : "bg-white text-black hover:bg-zinc-200"
          }`}
        >
          {added ? (
            <>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Added!
            </>
          ) : (
            <>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 9m12-9l2 9M9 21a1 1 0 100-2 1 1 0 000 2zm10 0a1 1 0 100-2 1 1 0 000 2z" />
              </svg>
              Add to Cart
            </>
          )}
        </button>
      </div>
    </div>
  );
}
