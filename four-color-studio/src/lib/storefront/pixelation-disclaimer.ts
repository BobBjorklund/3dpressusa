// These Hero collection variants are still built from the old rect-grid
// generator (pixelated logos/backgrounds) and haven't been regenerated with
// the smooth-path pipeline yet. Flag them until that batch is redone.
const PIXELATED_VARIANT_SUFFIXES = [
  "-camo-trad",
  "-camo-urban",
  "-camo-snow",
  "-camo-rwb",
  "-battle-tested",
  "-honor-fallen",
  "-support",
  "-stand-with",
  "-parent",
];

// Branches whose camo-* variants have already been redone with the
// smooth-path pipeline, ahead of the rest of that suffix group.
const FIXED_CAMO_BRANCHES = ["airforce", "navy", "fire", "marines", "army", "coastguard"];

export function needsPixelationDisclaimer(slug: string): boolean {
  if (
    slug.includes("-camo-") &&
    FIXED_CAMO_BRANCHES.some((branch) => slug.startsWith(`${branch}-camo-`))
  ) {
    return false;
  }
  return PIXELATED_VARIANT_SUFFIXES.some((suffix) => slug.endsWith(suffix));
}

export const PIXELATION_DISCLAIMER_TEXT =
  "Pixelated artwork is not representative of product quality - images are being updated to reflect true product look.";
