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

// Fixed set of planned holidays — containers render for all of these even
// before any items exist, so the page structure is ready ahead of content.
// Longer/multi-word prefixes must come first so the longest match wins.
// month/day are approximate for holidays that move year to year (Easter,
// Thanksgiving, Hanukkah) — close enough for chronological ordering purposes.
const HOLIDAY_LABELS: [string, string, number, number][] = [
  ["valentines-day", "Valentine's Day", 2, 14],
  ["st-patricks-day", "St. Patrick's Day", 3, 17],
  ["easter", "Easter", 4, 5],
  ["fourth-of-july", "Fourth of July", 7, 4],
  ["halloween", "Halloween", 10, 31],
  ["thanksgiving", "Thanksgiving", 11, 24],
  ["hanukkah", "Hanukkah", 12, 10],
  ["christmas", "Christmas", 12, 25],
];

// Days until this holiday's next occurrence from today (wraps to next year
// if it already passed), so the soonest-upcoming holiday sorts first.
function daysUntilNext(month: number, day: number): number {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let next = new Date(now.getFullYear(), month - 1, day);
  if (next < today) next = new Date(now.getFullYear() + 1, month - 1, day);
  return Math.round((next.getTime() - today.getTime()) / 86400000);
}

function splitHoliday(slug: string): { key: string; label: string } {
  for (const [prefix, label] of HOLIDAY_LABELS) {
    if (slug === prefix || slug.startsWith(prefix + "-")) {
      return { key: prefix, label };
    }
  }
  // No known holiday prefix — treat the whole slug as its own group.
  return { key: slug, label: slug.charAt(0).toUpperCase() + slug.slice(1) };
}

export default function HolidayAccordion({
  items,
  collectionSlug,
  schemeName,
}: {
  items: Item[];
  collectionSlug: string;
  schemeName: string;
}) {
  const groups = new Map<string, { label: string; items: Item[]; daysUntil: number }>();

  // Seed every planned holiday as its own container, even with no items yet.
  for (const [prefix, label, month, day] of HOLIDAY_LABELS) {
    groups.set(prefix, { label, items: [], daysUntil: daysUntilNext(month, day) });
  }

  for (const item of items) {
    const { key, label } = splitHoliday(item.slug);
    const group = groups.get(key);
    if (group) group.items.push(item);
    else groups.set(key, { label, items: [item], daysUntil: Number.MAX_SAFE_INTEGER });
  }

  const groupList = [...groups.entries()].sort(
    (a, b) => a[1].daysUntil - b[1].daysUntil
  );

  const [openHoliday, setOpenHoliday] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-3">
      {groupList.map(([key, group]) => {
        const isOpen = openHoliday === key;
        return (
          <div
            key={key}
            className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-zinc-950/60 backdrop-blur-sm"
          >
            <button
              type="button"
              onClick={() => setOpenHoliday(isOpen ? null : key)}
              className="flex w-full items-center justify-between px-6 py-4 text-left transition hover:bg-white/[0.04]"
            >
              <span className="flex items-center gap-3">
                <span className="text-lg font-black tracking-tight">{group.label}</span>
                <span className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-0.5 text-xs font-bold text-white/50">
                  {group.items.length}
                </span>
              </span>
              <svg
                className={`h-4 w-4 flex-shrink-0 text-white/50 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
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
                {group.items.length === 0 ? (
                  <p className="border-t border-white/10 p-6 text-sm text-zinc-500">
                    No items yet — coming soon.
                  </p>
                ) : (
                  <div className="grid gap-5 border-t border-white/10 p-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {group.items.map((item) => (
                      <ItemCard
                        key={item.id}
                        item={item}
                        collectionSlug={collectionSlug}
                        schemeName={schemeName}
                      />
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
