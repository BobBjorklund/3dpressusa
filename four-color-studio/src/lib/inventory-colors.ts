import { prisma } from './prisma';

export type InventoryColor = {
  id: string;
  name: string;
  hex: string;
};

function buildKey(spool: any) {
  return [
    spool.filamentSpec.brand,
    spool.filamentSpec.material,
    spool.filamentSpec.subtype,
    spool.filamentSpec.finish,
    spool.colorName,
  ]
    .map((v) => (v ?? '').trim().toLowerCase())
    .join('|');
}

function buildLabel(spool: any) {
  return [
    spool.filamentSpec.brand,
    spool.filamentSpec.material,
    spool.filamentSpec.subtype,
    spool.filamentSpec.finish,
    spool.colorName,
  ]
    .filter(Boolean)
    .join(' ');
}

export async function getInventoryColors(): Promise<InventoryColor[]> {
  const spools = await prisma.spool.findMany({
    where: {
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