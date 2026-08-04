import type { ReactNode } from "react";
import SpecPlate from "./SpecPlate";

export type PricingTier = { price: string; label: string; discountLabel?: string };

export default function PricingTierCards({
  tiers,
  note,
  children,
}: {
  tiers: PricingTier[];
  note?: string;
  children?: ReactNode;
}) {
  return (
    <SpecPlate accent="yellow" className="p-6">
      <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.25em] text-brushed-aluminum">Pricing</div>
      <div className="flex flex-wrap gap-3">
        {tiers.map((tier) => (
          <div
            key={tier.label}
            className="rounded-sm border border-hazard-yellow/30 bg-hazard-yellow/10 px-4 py-3 text-center"
          >
            <div className="font-display text-xl uppercase text-hazard-yellow">{tier.price}</div>
            <div className="mt-0.5 font-mono text-[10px] text-brushed-aluminum">{tier.label}</div>
            {tier.discountLabel && (
              <div className="mt-0.5 text-[10px] font-bold text-emerald-400">{tier.discountLabel}</div>
            )}
          </div>
        ))}
      </div>
      {note && (
        <p className="mt-3 text-xs leading-5 text-brushed-aluminum/70">{note}</p>
      )}
      {children}
    </SpecPlate>
  );
}
