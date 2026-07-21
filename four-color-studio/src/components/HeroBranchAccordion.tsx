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

// Known multi-word branch prefixes must come first so the longest match wins.
const BRANCH_LABELS: [string, string][] = [
  ["coastguard", "Coast Guard"],
  ["spaceforce", "Space Force"],
  ["airforce", "Air Force"],
  ["marines", "Marines"],
  ["police", "Police"],
  ["army", "Army"],
  ["navy", "Navy"],
  ["fire", "Fire"],
  ["ems", "EMS"],
];

function splitBranch(slug: string): { branch: string; label: string } {
  // Wife-themed designs (branch-specific or generic) get pulled into one shared
  // group instead of being scattered under their branch or standing alone.
  if (slug === "military-wife" || slug.endsWith("-wife")) {
    return { branch: "the-wives", label: "The Wives" };
  }

  for (const [prefix, label] of BRANCH_LABELS) {
    if (slug === prefix || slug.startsWith(prefix + "-")) {
      return { branch: prefix, label };
    }
  }
  // No known branch prefix (e.g. standalone "scott") — treat the whole slug as its own group.
  return { branch: slug, label: slug.charAt(0).toUpperCase() + slug.slice(1) };
}

export default function HeroBranchAccordion({
  items,
  collectionSlug,
  schemeName,
}: {
  items: Item[];
  collectionSlug: string;
  schemeName: string;
}) {
  const groups = new Map<string, { label: string; items: Item[] }>();

  for (const item of items) {
    const { branch, label } = splitBranch(item.slug);
    const group = groups.get(branch);
    if (group) group.items.push(item);
    else groups.set(branch, { label, items: [item] });
  }

  // Fixed tile order within each branch. Anything outside this standard set
  // (a branch-only extra like -wife, or police's honor-fallen drafts) isn't
  // in STANDARD_TILE_ORDER and sorts first instead, in whatever relative
  // order it arrived in (stable sort).
  const STANDARD_TILE_ORDER = [
    "male", "female", "thin-line", "trad-logo",
    "camo-rwb", "camo-trad", "camo-snow", "camo-urban",
    "honor-fallen", "parent", "support", "stand-with", "battle-tested",
  ];

  function tileRank(slug: string, branch: string): number {
    const suffix = slug.slice(branch.length + 1);
    const idx = STANDARD_TILE_ORDER.indexOf(suffix);
    return idx === -1 ? -1 : idx;
  }

  for (const [branch, group] of groups) {
    group.items.sort((a, b) => tileRank(a.slug, branch) - tileRank(b.slug, branch));
  }

  const groupList = [...groups.entries()].sort((a, b) => a[1].label.localeCompare(b[1].label));

  const [openBranch, setOpenBranch] = useState<string | null>(groupList[0]?.[0] ?? null);

  return (
    <div className="flex flex-col gap-3">
      {groupList.map(([branch, group]) => {
        const isOpen = openBranch === branch;
        return (
          <div
            key={branch}
            className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-zinc-950/60 backdrop-blur-sm"
          >
            <button
              type="button"
              onClick={() => setOpenBranch(isOpen ? null : branch)}
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
                <div className="grid gap-5 border-t border-white/10 p-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {(() => {
                    // Branch-only extras (not in STANDARD_TILE_ORDER) pack into
                    // the grid normally among themselves, but the first standard
                    // tile is forced onto a fresh row instead of filling out
                    // whatever's left of the extras' last row.
                    const firstStandardIdx = group.items.findIndex(
                      (item) => tileRank(item.slug, branch) !== -1
                    );
                    return group.items.map((item, i) => (
                      <div
                        key={item.id}
                        className={i === firstStandardIdx ? "sm:col-start-1 lg:col-start-1 xl:col-start-1" : undefined}
                      >
                        <ItemCard
                          item={item}
                          collectionSlug={collectionSlug}
                          schemeName={schemeName}
                        />
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
