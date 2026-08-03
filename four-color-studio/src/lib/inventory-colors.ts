import { prisma } from './prisma';

export type InventoryColor = {
  id: string;
  name: string;
  hex: string;
};

// Fields that distinguish one "color" from another for dedup/display purposes.
// A spool's filament spec (brand/material/subtype/finish) plus its color name
// together identify a distinct pickable color — two spools with the same
// values here are treated as interchangeable.
function colorFields(spool: any): (string | null | undefined)[] {
  return [
    spool.filamentSpec.brand,
    spool.filamentSpec.material,
    spool.filamentSpec.subtype,
    spool.filamentSpec.finish,
    spool.colorName,
  ];
}

// Case-insensitive dedup key.
function buildKey(spool: any) {
  return colorFields(spool)
    .map((v) => (v ?? '').trim().toLowerCase())
    .join('|');
}

// Human-readable label, e.g. "Bambu PLA Matte Army Green".
function buildLabel(spool: any) {
  return colorFields(spool).filter(Boolean).join(' ');
}

export async function getInventoryColors(): Promise<InventoryColor[]> {
  const spools = await prisma.spool.findMany({
    where: {
      userId: 'temp_user_id',
      status: 'active',
      remainingNetWeightG: { gt: 40 },
      colorName: { not: null },
      colorHex: { not: null },
    },
    include: {
      filamentSpec: true,
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });

  const seen = new Set<string>();

  return spools.flatMap((spool) => {
    const key = buildKey(spool);
    if (seen.has(key)) return [];

    seen.add(key);

    return [
      {
        id: key,
        name: buildLabel(spool),
        hex: spool.colorHex!.toUpperCase(),
      },
    ];
  });
}