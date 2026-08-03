import GroupedItemAccordion, { type AccordionGroup } from "@/components/GroupedItemAccordion";

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

export default function HeroBranchAccordion({
  items,
  collectionSlug,
  schemeName,
}: {
  items: Item[];
  collectionSlug: string;
  schemeName: string;
}) {
  // Bucket items by branch, keeping a display label alongside each bucket.
  const groups = new Map<string, { label: string; items: Item[] }>();
  for (const item of items) {
    const { branch, label } = splitBranch(item.slug);
    const group = groups.get(branch);
    if (group) group.items.push(item);
    else groups.set(branch, { label, items: [item] });
  }

  for (const [branch, group] of groups) {
    group.items.sort((a, b) => tileRank(a.slug, branch) - tileRank(b.slug, branch));
  }

  const accordionGroups: AccordionGroup[] = [...groups.entries()]
    .sort((a, b) => a[1].label.localeCompare(b[1].label))
    .map(([branch, group]) => {
      // Branch-only extras (not in STANDARD_TILE_ORDER) pack into the grid
      // normally among themselves, but the first standard tile is forced
      // onto a fresh row instead of filling out whatever's left of the
      // extras' last row.
      const firstStandardIdx = group.items.findIndex(
        (item) => tileRank(item.slug, branch) !== -1
      );
      return {
        key: branch,
        label: group.label,
        items: group.items,
        forceRowBreakAt: firstStandardIdx === -1 ? undefined : firstStandardIdx,
      };
    });

  return (
    <GroupedItemAccordion
      groups={accordionGroups}
      collectionSlug={collectionSlug}
      schemeName={schemeName}
    />
  );
}
