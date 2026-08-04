"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/context/CartContext";
import { useAddedFlash } from "@/lib/useAddedFlash";
import { CheckIcon, CartIcon } from "@/components/icons";
import type { CapPricingType } from "@/lib/storefront/pricing-config";

type InventoryColor = { id: string; name: string; hex: string };

type Item = {
  slug: string;
  name: string;
  description?: string | null;
  pricingType: string;
};

// Title Cases a name, leaving short all-caps acronyms (PETG, PLA, ABS, TPU...)
// alone instead of mangling them into "Petg".
function properCase(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((word) => {
      if (word.length <= 4 && word === word.toUpperCase() && /[A-Z]/.test(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

// Short label for color name (last meaningful word, e.g. "Fuchsia" from
// "Creality PETG Basic Fuchsia").
function shortName(name: string) {
  const parts = properCase(name).split(" ").filter(Boolean);
  return parts[parts.length - 1] ?? name;
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
      className="relative w-full max-w-xs aspect-square rounded-md border border-brushed-aluminum/25 transition-colors duration-300 flex items-center justify-center p-8"
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
  const { addItem } = useCart();
  const { added, flash } = useAddedFlash();

  const [colors, setColors] = useState<InventoryColor[]>([]);
  const [loadingColors, setLoadingColors] = useState(true);

  const [selectedItem, setSelectedItem] = useState<Item | null>(items[0] ?? null);
  const [logoColor, setLogoColor] = useState<InventoryColor | null>(null);
  const [bgColor, setBgColor] = useState<InventoryColor | null>(null);
  const [qty, setQty] = useState(1);

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
    const displayName = `${selectedItem.name} - ${colorDesc}`;
    const id = `${selectedItem.slug}::${logoColor.id}::${bgColor.id}`;

    addItem({
      id,
      slug: selectedItem.slug,
      type: "cap",
      quantity: qty,
      pricingType: selectedItem.pricingType as CapPricingType,
      name: displayName,
      colorKeys: [logoColor.id, bgColor.id],
      colorHexes: [logoColor.hex, bgColor.hex],
    });

    flash();
  }

  const canAdd = !!selectedItem && !!logoColor && !!bgColor && !loadingColors;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_auto]">

      {/* LEFT — preview */}
      <div className="flex flex-col gap-3">
        <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-brushed-aluminum">
          Preview
        </div>
        <LogoPreview
          itemSlug={selectedItem?.slug ?? (items[0]?.slug ?? "")}
          logoHex={logoColor?.hex ?? "#f0f0f0"}
          bgHex={bgColor?.hex ?? "#1a1a1a"}
        />
        {selectedItem?.slug === "truck-guys-jeep" && (
          <p className="text-xs text-hazard-yellow/90">
            Due to technical limitations, the preview is incomplete - however &ldquo;JEEP&rdquo; is written in the windshield. Trust us, it&rsquo;ll be there on your print.
          </p>
        )}
        <p className="text-xs text-brushed-aluminum/60">
          Approximate color preview - actual print may vary slightly by filament batch.
        </p>
      </div>

      {/* RIGHT — controls: 3 tall columns + add button below */}
      <div className="flex flex-col gap-4">

        {/* Three columns: brand | logo color | bg color */}
        <div className="grid grid-cols-3 gap-3">

          {/* Brand */}
          <div className="flex flex-col gap-1">
            <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.2em] text-brushed-aluminum">
              Brand
            </div>
            {items.map((item) => (
              <button
                key={item.slug}
                type="button"
                onClick={() => setSelectedItem(item)}
                className={`rounded-sm border px-3 py-2.5 text-left transition ${
                  selectedItem?.slug === item.slug
                    ? "border-plate-red/50 bg-plate-red/10 text-white"
                    : "border-brushed-aluminum/20 bg-white/[0.03] text-brushed-aluminum hover:border-brushed-aluminum/40 hover:text-white/80"
                }`}
              >
                <div className="text-sm font-semibold">{item.name}</div>
              </button>
            ))}
          </div>

          {/* Logo Color */}
          <div className="flex flex-col">
            <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.2em] text-brushed-aluminum">
              Logo
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {colors.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setLogoColor(c)}
                  title={properCase(c.name)}
                  className={`flex items-center gap-1.5 rounded-sm px-1.5 py-1.5 text-left transition ${
                    logoColor?.id === c.id
                      ? "bg-plate-red/10 text-white"
                      : "text-brushed-aluminum hover:bg-white/[0.05] hover:text-white/80"
                  }`}
                >
                  <span
                    className="h-4 w-4 flex-shrink-0 rounded-full border border-brushed-aluminum/30"
                    style={{ backgroundColor: c.hex }}
                  />
                  <span className="truncate text-xs font-medium">{shortName(c.name)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Background Color */}
          <div className="flex flex-col">
            <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.2em] text-brushed-aluminum">
              Base
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {colors.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setBgColor(c)}
                  title={properCase(c.name)}
                  className={`flex items-center gap-1.5 rounded-sm px-1.5 py-1.5 text-left transition ${
                    bgColor?.id === c.id
                      ? "bg-plate-red/10 text-white"
                      : "text-brushed-aluminum hover:bg-white/[0.05] hover:text-white/80"
                  }`}
                >
                  <span
                    className="h-4 w-4 flex-shrink-0 rounded-full border border-brushed-aluminum/30"
                    style={{ backgroundColor: c.hex }}
                  />
                  <span className="truncate text-xs font-medium">{shortName(c.name)}</span>
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Quantity + Add to Cart */}
        <div className="flex items-center gap-3 pt-1">
          <div className="flex items-center rounded-sm border border-brushed-aluminum/25 bg-steel-panel">
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="flex h-10 w-10 items-center justify-center text-brushed-aluminum transition hover:text-white"
            >
              −
            </button>
            <span className="w-8 text-center font-mono text-sm text-white">{qty}</span>
            <button
              type="button"
              onClick={() => setQty((q) => Math.min(20, q + 1))}
              className="flex h-10 w-10 items-center justify-center text-brushed-aluminum transition hover:text-white"
            >
              +
            </button>
          </div>

          <button
            type="button"
            onClick={handleAdd}
            disabled={!canAdd || added}
            className={`flex flex-1 items-center justify-center gap-2 rounded-sm px-8 py-4 font-display text-base uppercase tracking-wide transition active:scale-[0.98] disabled:opacity-50 ${
              added
                ? "bg-emerald-600 text-white"
                : "bg-plate-red text-white hover:bg-plate-red/85"
            }`}
          >
            {added ? (
              <>
                <CheckIcon />
                Added!
              </>
            ) : (
              <>
                <CartIcon />
                Add to Cart
              </>
            )}
          </button>
        </div>
      </div>

    </div>
  );
}
