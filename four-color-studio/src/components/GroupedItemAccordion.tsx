"use client";

import { useState } from "react";
import ItemCard from "@/components/ItemCard";

type Item = {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  heroOverride?: string | null;
  highDetailAvailable: boolean;
};

export type AccordionGroup = {
  key: string;
  label: string;
  items: Item[];
  // Shown instead of the item grid when items is empty (e.g. "coming soon").
  // Omit to just render an empty grid.
  emptyMessage?: string;
  // Index of the item that should be forced onto a fresh grid row (used to
  // separate "extra" items from the start of the standard tile ordering).
  // Omit for no forced break.
  forceRowBreakAt?: number;
};

// Shared shell for "collapsible groups of ItemCards" — the open/close state,
// chevron button, and grid-rows expand animation are identical between
// HeroBranchAccordion and HolidayAccordion; only how items get grouped and
// sorted differs, so that logic stays in each caller and this component just
// renders whatever group list it's handed.
export default function GroupedItemAccordion({
  groups,
  collectionSlug,
  schemeName,
}: {
  groups: AccordionGroup[];
  collectionSlug: string;
  schemeName: string;
}) {
  const [openKey, setOpenKey] = useState<string | null>(groups[0]?.key ?? null);

  return (
    <div className="flex flex-col gap-3">
      {groups.map((group) => {
        const isOpen = openKey === group.key;
        return (
          <div
            key={group.key}
            className="overflow-hidden rounded-md border border-brushed-aluminum/25 bg-gunmetal"
          >
            <button
              type="button"
              onClick={() => setOpenKey(isOpen ? null : group.key)}
              className="flex w-full items-center justify-between px-6 py-4 text-left transition hover:bg-white/[0.04]"
            >
              <span className="flex items-center gap-3">
                <span className="font-display text-lg uppercase tracking-tight text-white">{group.label}</span>
                <span className="rounded-sm border border-brushed-aluminum/25 px-2.5 py-0.5 font-mono text-xs text-brushed-aluminum">
                  {group.items.length}
                </span>
              </span>
              <svg
                className={`h-4 w-4 flex-shrink-0 text-brushed-aluminum transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <div
              className={`grid transition-all duration-300 ease-in-out ${
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <div className="overflow-hidden">
                {group.items.length === 0 && group.emptyMessage ? (
                  <p className="border-t border-brushed-aluminum/15 p-6 text-sm text-brushed-aluminum">
                    {group.emptyMessage}
                  </p>
                ) : (
                  <div className="grid gap-5 border-t border-brushed-aluminum/15 p-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {group.items.map((item, i) => (
                      <div
                        key={item.id}
                        className={i === group.forceRowBreakAt ? "sm:col-start-1 lg:col-start-1 xl:col-start-1" : undefined}
                      >
                        <ItemCard
                          item={item}
                          collectionSlug={collectionSlug}
                          schemeName={schemeName}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
