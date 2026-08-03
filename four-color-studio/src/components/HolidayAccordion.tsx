import GroupedItemAccordion, { type AccordionGroup } from "@/components/GroupedItemAccordion";

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

  const accordionGroups: AccordionGroup[] = [...groups.entries()]
    .sort((a, b) => a[1].daysUntil - b[1].daysUntil)
    .map(([key, group]) => ({
      key,
      label: group.label,
      items: group.items,
      emptyMessage: "No items yet — coming soon.",
    }));

  return (
    <GroupedItemAccordion
      groups={accordionGroups}
      collectionSlug={collectionSlug}
      schemeName={schemeName}
    />
  );
}
