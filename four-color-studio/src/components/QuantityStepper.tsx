"use client";

import { MinusIcon, PlusIcon } from "@/components/icons";

// Circular +/- stepper used by the cart line-item rows and the coaster
// pack picker — same buttons, same icons, just different width/label.
// Clamping (e.g. "don't go below 1") is left to the caller's onDelta, since
// CartDrawer intentionally lets qty hit 0 to remove the line item while
// GetAsCoastersButton floors at 1 instead.
export default function QuantityStepper({
  value,
  onDelta,
  label,
  widthClassName = "w-5",
}: {
  value: number;
  onDelta: (delta: 1 | -1) => void;
  // Custom text instead of the bare number, e.g. "3 packs".
  label?: string;
  widthClassName?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onDelta(-1)}
        className="flex h-7 w-7 items-center justify-center rounded-sm border border-brushed-aluminum/25 bg-steel-panel text-brushed-aluminum transition hover:border-brushed-aluminum/45 hover:text-white"
        aria-label="Decrease quantity"
      >
        <MinusIcon />
      </button>
      <span className={`${widthClassName} text-center font-mono text-sm text-white`}>{label ?? value}</span>
      <button
        type="button"
        onClick={() => onDelta(1)}
        className="flex h-7 w-7 items-center justify-center rounded-sm border border-brushed-aluminum/25 bg-steel-panel text-brushed-aluminum transition hover:border-brushed-aluminum/45 hover:text-white"
        aria-label="Increase quantity"
      >
        <PlusIcon />
      </button>
    </div>
  );
}
