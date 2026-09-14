// These Hero collection variants are still built from the old rect-grid
// generator (pixelated logos/backgrounds) and haven't been regenerated with
// the smooth-path pipeline yet. Flag them until that batch is redone.
const PIXELATED_VARIANT_SUFFIXES = [
  "-battle-tested",
  "-support",
  "-stand-with",
];

export function needsPixelationDisclaimer(slug: string): boolean {
  return PIXELATED_VARIANT_SUFFIXES.some((suffix) => slug.endsWith(suffix));
}

export const PIXELATION_DISCLAIMER_TEXT =
  "Pixelated artwork is not representative of product quality - images are being updated to reflect true product look.";
