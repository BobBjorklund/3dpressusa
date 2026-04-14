import type { ReactNode } from "react";
import ContentCard from "./ContentCard";

export type PricingTier = { price: string; label: string };

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
    <ContentCard>
      <div className="text-[10px] font-black uppercase tracking-[0.25em] text-white/50 mb-3">Pricing</div>
      <div className="flex flex-wrap gap-3">
        {tiers.map((tier) => (
          <div
            key={tier.label}
            className="rounded-2xl border border-amber-300/20 bg-amber-400/10 px-4 py-3 text-center"
          >
            <div className="text-xl font-black text-amber-200">{tier.price}</div>
            <div className="text-[10px] font-bold text-white/50 mt-0.5">{tier.label}</div>
          </div>
        ))}
      </div>
      {note && (
        <p className="mt-3 text-xs text-white/40 leading-5">{note}</p>
      )}
      {children}
    </ContentCard>
  );
}
