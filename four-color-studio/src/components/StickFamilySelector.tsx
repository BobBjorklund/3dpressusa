"use client";

import { useRef, useState, useEffect } from "react";
import { useCart } from "@/context/CartContext";

// ── Constants ──────────────────────────────────────────────────────────────────

export const FAMILY_LINES = [
  { id: "trad",           label: "Traditional" },
  { id: "pirate",         label: "Pirate" },
  { id: "alien",          label: "Alien" },
  { id: "astronaut",      label: "Astronaut" },
  { id: "dinosaur",       label: "Dinosaur" },
  { id: "gothic",         label: "Gothic" },
  { id: "feudal-peasant", label: "Feudal Peasant" },
  { id: "farmer",         label: "Farmer" },
  { id: "robot",          label: "Robot" },
  { id: "superhero",      label: "Superhero" },
  { id: "cowboy",         label: "Cowboy" },
  { id: "settler",        label: "Settler" },
  { id: "mouse-ears",     label: "Mouse Ears" },
  { id: "royalty",        label: "Royalty" },
  { id: "fantasy",        label: "Fantasy" },
  { id: "ninja",          label: "Ninja" },
] as const;

export type FamilyLineId = (typeof FAMILY_LINES)[number]["id"];

// aspect = w/h of the SVG viewBox for that variant
export const VARIANTS = [
  { id: "adult-male",   label: "Adult ♂",  heightRatio: 1.00, aspect: 0.5 },
  { id: "adult-female", label: "Adult ♀",  heightRatio: 1.00, aspect: 0.5 },
  { id: "teen-male",    label: "Teen ♂",   heightRatio: 0.82, aspect: 0.5 },
  { id: "teen-female",  label: "Teen ♀",   heightRatio: 0.82, aspect: 0.5 },
  { id: "kid-male",     label: "Kid ♂",    heightRatio: 0.65, aspect: 0.5 },
  { id: "kid-female",   label: "Kid ♀",    heightRatio: 0.65, aspect: 0.5 },
  { id: "infant",       label: "Infant",   heightRatio: 0.58, aspect: 1.0 },
  { id: "dog",          label: "Dog",      heightRatio: 0.62, aspect: 1.0 },
  { id: "cat",          label: "Cat",      heightRatio: 0.58, aspect: 1.0 },
] as const;

export type VariantId = (typeof VARIANTS)[number]["id"];

export type SlotConfig = {
  line: FamilyLineId;
  variant: VariantId;
  halo: boolean;
};

const MAX_SLOTS    = 12;
const MAX_PER_ROW  = 4;
const FALLBACK_SVG = "/stick-figure/trad/adult-male.svg";

function svgUrl(line: FamilyLineId, variant: VariantId) {
  return `/stick-figure/${line}/${variant}.svg`;
}

// ── Family preview ─────────────────────────────────────────────────────────────


function FamilyPreview({ slots }: { slots: SlotConfig[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [side, setSide] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSide(el.offsetWidth));
    ro.observe(el);
    setSide(el.offsetWidth);
    return () => ro.disconnect();
  }, []);

  const numRows =
    slots.length <= MAX_PER_ROW ? 1 :
    slots.length <= MAX_PER_ROW * 2 ? 2 : 3;

  const rows: SlotConfig[][] = Array.from({ length: numRows }, (_, i) =>
    slots.slice(i * MAX_PER_ROW, (i + 1) * MAX_PER_ROW)
  );

  const PAD      = side * 0.07;
  const ROW_GAP  = side * 0.02;
  const usable   = side - PAD * 2;
  const perRowH  = (usable - ROW_GAP * (numRows - 1)) / numRows;
  const perSlotW = usable / MAX_PER_ROW;

  // baseH is sized for humanoids (aspect 0.5). Square figures are then further
  // constrained by perSlotW in the per-figure calc below.
  const baseH = Math.floor(Math.min(perRowH, perSlotW / 0.5));

  return (
    <div
      ref={ref}
      className="relative w-full rounded-2xl border-4 border-black bg-white"
      style={{ aspectRatio: "1 / 1" }}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center"
           style={{ gap: ROW_GAP }}>
        {slots.length === 0 ? (
          <p className="text-xs text-zinc-400">Add family members below</p>
        ) : (
          rows.map((row, ri) => (
            <div key={ri} className="flex items-end justify-center" style={{ gap: side * 0.01 }}>
              {row.map((slot, si) => {
                const vDef = VARIANTS.find((v) => v.id === slot.variant)!;
                // Clamp height by both row height and slot width (for wide/square variants)
                const figH = Math.floor(Math.min(
                  baseH * vDef.heightRatio,
                  perSlotW / vDef.aspect,
                ));
                return (
                  <div
                    key={si}
                    className="relative flex flex-col items-center justify-end flex-shrink-0"
                    style={{ height: baseH }}
                  >
                    {slot.halo && (
                      <svg
                        className="absolute"
                        style={{
                          bottom: figH + 4,
                          width: figH * 0.38,
                          height: figH * 0.12,
                        }}
                        viewBox="0 0 32 16"
                      >
                        <ellipse cx="16" cy="8" rx="14" ry="6" fill="none" stroke="#000" strokeWidth="2.5" />
                      </svg>
                    )}
                    <img
                      src={svgUrl(slot.line, slot.variant)}
                      alt={`${slot.line} ${slot.variant}`}
                      style={{ height: figH, width: "auto" }}
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK_SVG; }}
                    />
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── Slot picker (inline panel) ─────────────────────────────────────────────────

function SlotPicker({
  slot,
  onChange,
  onClose,
  onRemove,
}: {
  slot: SlotConfig;
  onChange: (s: SlotConfig) => void;
  onClose: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-800 p-4">
      {/* Line */}
      <div className="mb-3 text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500">
        Family Line
      </div>
      <div className="mb-4 grid grid-cols-3 gap-1.5 sm:grid-cols-4">
        {FAMILY_LINES.map((line) => (
          <button
            key={line.id}
            type="button"
            onClick={() => onChange({ ...slot, line: line.id })}
            className={`rounded-lg border px-2 py-1.5 text-xs font-bold transition ${
              slot.line === line.id
                ? "border-white/40 bg-white/[0.12] text-white"
                : "border-white/10 bg-white/[0.03] text-white/50 hover:text-white/80"
            }`}
          >
            {line.label}
          </button>
        ))}
      </div>

      {/* Variant */}
      <div className="mb-3 text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500">
        Member
      </div>
      <div className="mb-4 grid grid-cols-3 gap-1.5">
        {VARIANTS.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => onChange({ ...slot, variant: v.id })}
            className={`rounded-lg border px-2 py-1.5 text-xs font-bold transition ${
              slot.variant === v.id
                ? "border-white/40 bg-white/[0.12] text-white"
                : "border-white/10 bg-white/[0.03] text-white/50 hover:text-white/80"
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* Halo + actions */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => onChange({ ...slot, halo: !slot.halo })}
          className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-black transition ${
            slot.halo
              ? "border-amber-300/40 bg-amber-400/20 text-amber-200"
              : "border-white/10 bg-white/[0.04] text-white/50 hover:text-white/80"
          }`}
        >
          <span>☁</span>
          {slot.halo ? "Halo — in memoriam" : "Add halo"}
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRemove}
            className="text-xs text-red-400/70 transition hover:text-red-400"
          >
            Remove
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-bold text-white/60 transition hover:text-white"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Slot strip ─────────────────────────────────────────────────────────────────

function SlotStrip({
  slots,
  activeIdx,
  onSelect,
  onAdd,
}: {
  slots: SlotConfig[];
  activeIdx: number | null;
  onSelect: (i: number) => void;
  onAdd: () => void;
}) {
  const THUMB_H = 48;

  return (
    <div className="flex flex-wrap items-end gap-2">
      {slots.map((slot, i) => {
        const vDef = VARIANTS.find((v) => v.id === slot.variant)!;
        const h = Math.round(Math.min(THUMB_H * vDef.heightRatio, THUMB_H / vDef.aspect));
        return (
          <button
            key={i}
            type="button"
            onClick={() => onSelect(i)}
            className={`relative flex flex-col items-center justify-end rounded-xl border px-2 pb-1 pt-3 transition ${
              activeIdx === i
                ? "border-white/40 bg-white/[0.10]"
                : "border-white/10 bg-white/[0.04] hover:border-white/20"
            }`}
            style={{ height: THUMB_H + 20 }}
          >
            {slot.halo && (
              <span className="absolute top-1 text-[9px] leading-none text-amber-300">☁</span>
            )}
            <img
              src={svgUrl(slot.line, slot.variant)}
              alt=""
              style={{ height: h, width: "auto" }}
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK_SVG; }}
            />
          </button>
        );
      })}

      {slots.length < MAX_SLOTS && (
        <button
          type="button"
          onClick={onAdd}
          className="flex h-16 w-10 items-center justify-center rounded-xl border border-dashed border-white/20 text-white/30 transition hover:border-white/40 hover:text-white/60"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      )}
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function describeName(slots: SlotConfig[]): string {
  const counts: Partial<Record<VariantId, number>> = {};
  for (const s of slots) counts[s.variant] = (counts[s.variant] ?? 0) + 1;

  const parts = VARIANTS
    .filter((v) => counts[v.id])
    .map((v) => `${counts[v.id]}× ${v.label.replace(/[♂♀]/g, "").trim()}`);

  return `Stick Family — ${parts.join(", ")}`;
}

function encodeSlots(slots: SlotConfig[]): string {
  return slots.map((s) => `${s.line}:${s.variant}:${s.halo ? "1" : "0"}`).join("|");
}

// ── Main component ─────────────────────────────────────────────────────────────

const DEFAULT_SLOT: SlotConfig = { line: "trad", variant: "adult-male", halo: false };

export default function StickFamilySelector() {
  const { addItem, openCart } = useCart();

  const [slots, setSlots]       = useState<SlotConfig[]>([{ ...DEFAULT_SLOT }]);
  const [activeIdx, setActiveIdx] = useState<number | null>(0);
  const [qty, setQty]           = useState(1);
  const [added, setAdded]       = useState(false);

  function handleSlotChange(i: number, updated: SlotConfig) {
    setSlots((prev) => prev.map((s, idx) => (idx === i ? updated : s)));
  }

  function handleAdd() {
    if (slots.length >= MAX_SLOTS) return;
    const newSlot: SlotConfig = { ...DEFAULT_SLOT };
    setSlots((prev) => [...prev, newSlot]);
    setActiveIdx(slots.length);
  }

  function handleRemove(i: number) {
    setSlots((prev) => prev.filter((_, idx) => idx !== i));
    setActiveIdx(null);
  }

  function handleAddToCart() {
    if (slots.length === 0) return;
    const encoded = encodeSlots(slots);
    const id   = `stick-family::${encoded}`;
    const name = describeName(slots);

    addItem({
      id,
      slug: "stick-family",
      type: "cap",
      quantity: qty,
      pricingType: "custom",
      name,
      stickFamilySlots: slots,
    });

    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      openCart();
    }, 800);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_auto]">

      {/* LEFT — live preview */}
      <div className="flex flex-col gap-3">
        <div className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500">
          Preview
        </div>
        <FamilyPreview slots={slots} />
        <p className="text-xs text-zinc-600">
          Approximate preview — final print uses the actual line assets at 0.2 mm/pixel.
        </p>
      </div>

      {/* RIGHT — slots + picker */}
      <div className="flex flex-col gap-4 lg:w-96">

        {/* Slot strip */}
        <div>
          <div className="mb-2 text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500">
            Your Family ({slots.length}/{MAX_SLOTS})
          </div>
          <SlotStrip
            slots={slots}
            activeIdx={activeIdx}
            onSelect={(i) => setActiveIdx(activeIdx === i ? null : i)}
            onAdd={handleAdd}
          />
        </div>

        {/* Inline picker for active slot */}
        {activeIdx !== null && slots[activeIdx] && (
          <SlotPicker
            slot={slots[activeIdx]}
            onChange={(s) => handleSlotChange(activeIdx, s)}
            onClose={() => setActiveIdx(null)}
            onRemove={() => handleRemove(activeIdx)}
          />
        )}

        {/* Qty + Add to Cart */}
        <div className="flex items-center gap-3 pt-1">
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
            onClick={handleAddToCart}
            disabled={slots.length === 0 || added}
            className={`flex flex-1 items-center justify-center gap-2 rounded-full px-8 py-4 text-base font-black transition active:scale-[0.98] disabled:opacity-50 ${
              added ? "bg-emerald-500 text-white" : "bg-white text-black hover:bg-zinc-200"
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
    </div>
  );
}
