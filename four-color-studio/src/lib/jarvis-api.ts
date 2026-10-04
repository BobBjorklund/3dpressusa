import { createHash, timingSafeEqual } from "node:crypto";
import { ORDER_STATUSES, PET_DESIGN_STATUSES } from "@/lib/statuses";

// Read-only JSON API for the operator's local voice assistant ("Jarvis") —
// replaces scraping /admin with Playwright. Auth is a dedicated bearer secret
// (JARVIS_API_KEY), separate from the browser ADMIN_KEY cookie so either can be
// rotated alone. Handlers take a JarvisDb so tests can run without Postgres;
// the Prisma-backed implementation lives in jarvis-db.ts.
//
// Responses deliberately carry no customer PII (names, emails, addresses,
// notes, payment details) — only ids, statuses, timestamps, and item summaries.

export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

export type ListFilter = { status?: string; since?: Date; limit: number };

export type PetDesignRow = {
  id: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  photoCount: number;
};

export type OrderRow = {
  id: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  itemsSummary: string;
  amountTotalCents: number;
};

export interface JarvisDb {
  petDesignCountsByStatus(): Promise<{ status: string; count: number }[]>;
  orderCountsByStatus(): Promise<{ status: string; count: number }[]>;
  petDesignCountSince(since: Date): Promise<number>;
  orderCountSince(since: Date): Promise<number>;
  listPetDesigns(filter: ListFilter): Promise<PetDesignRow[]>;
  listOrders(filter: ListFilter): Promise<OrderRow[]>;
}

const NO_STORE = { "Cache-Control": "no-store" };

function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return Response.json(body, { status, headers: { ...NO_STORE, ...headers } });
}

function error(message: string, status: number, headers: Record<string, string> = {}): Response {
  return json({ error: message }, status, headers);
}

class BadRequest extends Error {}

// Hash both sides first so timingSafeEqual gets equal-length buffers and the
// comparison time reveals nothing about the key's length or contents.
function keysMatch(provided: string, expected: string): boolean {
  const a = createHash("sha256").update(provided).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

// Returns an error Response when the request isn't authorized, else null.
export function checkAuth(req: Request): Response | null {
  const expected = process.env.JARVIS_API_KEY;
  if (!expected) return error("Jarvis API is not configured", 503);

  const header = req.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match || !keysMatch(match[1].trim(), expected)) {
    return error("Unauthorized", 401, { "WWW-Authenticate": "Bearer" });
  }
  return null;
}

function parseSince(params: URLSearchParams): Date | undefined {
  const raw = params.get("since");
  if (raw === null) return undefined;
  const date = new Date(raw);
  if (!raw.trim() || Number.isNaN(date.getTime())) {
    throw new BadRequest("`since` must be an ISO 8601 timestamp");
  }
  return date;
}

function parseListFilter(params: URLSearchParams, statuses: readonly string[]): ListFilter {
  const status = params.get("status") ?? undefined;
  if (status !== undefined && !statuses.includes(status)) {
    throw new BadRequest(`\`status\` must be one of: ${statuses.join(", ")}`);
  }

  let limit = DEFAULT_LIMIT;
  const rawLimit = params.get("limit");
  if (rawLimit !== null) {
    if (!/^\d+$/.test(rawLimit) || Number(rawLimit) < 1) {
      throw new BadRequest("`limit` must be a positive integer");
    }
    limit = Math.min(Number(rawLimit), MAX_LIMIT);
  }

  return { status, since: parseSince(params), limit };
}

// Every known status starts at 0; any unexpected value found in the DB is
// still reported rather than silently dropped.
function fillCounts(known: readonly string[], rows: { status: string; count: number }[]) {
  const counts: Record<string, number> = Object.fromEntries(known.map((s) => [s, 0]));
  for (const { status, count } of rows) counts[status] = (counts[status] ?? 0) + count;
  return counts;
}

async function withAuth(req: Request, handle: (params: URLSearchParams) => Promise<unknown>) {
  const denied = checkAuth(req);
  if (denied) return denied;

  try {
    const body = await handle(new URL(req.url).searchParams);
    return json({ generated_at: new Date().toISOString(), ...(body as object) });
  } catch (err) {
    if (err instanceof BadRequest) return error(err.message, 400);
    console.error("[jarvis-api]", err);
    return error("Internal server error", 500);
  }
}

export function summaryHandler(db: JarvisDb) {
  return (req: Request) =>
    withAuth(req, async (params) => {
      const since = parseSince(params);
      const [petCounts, orderCounts, petNew, orderNew] = await Promise.all([
        db.petDesignCountsByStatus(),
        db.orderCountsByStatus(),
        since ? db.petDesignCountSince(since) : null,
        since ? db.orderCountSince(since) : null,
      ]);
      return {
        pet_designs: { counts: fillCounts(PET_DESIGN_STATUSES, petCounts), new_since: petNew },
        orders: { counts: fillCounts(ORDER_STATUSES, orderCounts), new_since: orderNew },
      };
    });
}

export function petDesignsHandler(db: JarvisDb) {
  return (req: Request) =>
    withAuth(req, async (params) => {
      const rows = await db.listPetDesigns(parseListFilter(params, PET_DESIGN_STATUSES));
      return {
        items: rows.map((r) => ({
          id: r.id,
          status: r.status,
          created_at: r.createdAt.toISOString(),
          updated_at: r.updatedAt.toISOString(),
          // No product name is stored on a request; the photo count is the most
          // useful non-identifying descriptor.
          title: `Pet design (${r.photoCount} ${r.photoCount === 1 ? "photo" : "photos"})`,
        })),
      };
    });
}

export function ordersHandler(db: JarvisDb) {
  return (req: Request) =>
    withAuth(req, async (params) => {
      const rows = await db.listOrders(parseListFilter(params, ORDER_STATUSES));
      return {
        items: rows.map((r) => ({
          id: r.id,
          status: r.status,
          created_at: r.createdAt.toISOString(),
          updated_at: r.updatedAt.toISOString(),
          item_summary: r.itemsSummary,
          total: r.amountTotalCents / 100, // USD
        })),
      };
    });
}

// Explicit 405 for every write method (Next would otherwise return an empty
// 405) so clients always get the documented JSON error shape.
export function methodNotAllowed(): Response {
  return error("Method not allowed", 405, { Allow: "GET" });
}
