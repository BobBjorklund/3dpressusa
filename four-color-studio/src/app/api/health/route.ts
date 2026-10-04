import { healthHandler } from "@/lib/health";
import { prisma } from "@/lib/prisma";

// Always run at request time — a cached response would defeat the keepalive.
export const dynamic = "force-dynamic";

export const GET = healthHandler(() => prisma.$queryRaw`SELECT 1`);
