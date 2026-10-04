import { prisma } from "@/lib/prisma";
import type { JarvisDb, ListFilter } from "@/lib/jarvis-api";

// Prisma implementation of JarvisDb. Counts are COUNT … GROUP BY status
// aggregates (both status columns are indexed), never row loads; list queries
// select only non-PII columns.

function listWhere({ status, since }: ListFilter) {
  return {
    ...(status ? { status } : {}),
    ...(since ? { createdAt: { gt: since } } : {}),
  };
}

export const prismaJarvisDb: JarvisDb = {
  async petDesignCountsByStatus() {
    const rows = await prisma.petDesignRequest.groupBy({ by: ["status"], _count: { _all: true } });
    return rows.map((r) => ({ status: r.status, count: r._count._all }));
  },

  async orderCountsByStatus() {
    const rows = await prisma.order.groupBy({ by: ["status"], _count: { _all: true } });
    return rows.map((r) => ({ status: r.status, count: r._count._all }));
  },

  petDesignCountSince(since) {
    return prisma.petDesignRequest.count({ where: { createdAt: { gt: since } } });
  },

  orderCountSince(since) {
    return prisma.order.count({ where: { createdAt: { gt: since } } });
  },

  async listPetDesigns(filter) {
    const rows = await prisma.petDesignRequest.findMany({
      where: listWhere(filter),
      orderBy: { createdAt: "desc" },
      take: filter.limit,
      select: { id: true, status: true, createdAt: true, updatedAt: true, originalImageUrls: true },
    });
    return rows.map(({ originalImageUrls, ...r }) => ({ ...r, photoCount: originalImageUrls.length }));
  },

  listOrders(filter) {
    return prisma.order.findMany({
      where: listWhere(filter),
      orderBy: { createdAt: "desc" },
      take: filter.limit,
      select: {
        id: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        itemsSummary: true,
        amountTotalCents: true,
      },
    });
  },
};
