import { afterEach, beforeEach, describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  methodNotAllowed,
  ordersHandler,
  petDesignsHandler,
  summaryHandler,
  type JarvisDb,
  type ListFilter,
  type OrderRow,
  type PetDesignRow,
} from "@/lib/jarvis-api";
import { ORDER_STATUSES, PET_DESIGN_STATUSES } from "@/lib/statuses";

// Run with: npm test

const KEY = "test-jarvis-key";
const at = (iso: string) => new Date(iso);

const petRows: PetDesignRow[] = [
  { id: "p1", status: "submitted", createdAt: at("2026-10-01T00:00:00Z"), updatedAt: at("2026-10-01T00:00:00Z"), photoCount: 1 },
  { id: "p2", status: "submitted", createdAt: at("2026-10-03T00:00:00Z"), updatedAt: at("2026-10-03T00:00:00Z"), photoCount: 2 },
  { id: "p3", status: "approved", createdAt: at("2026-10-04T00:00:00Z"), updatedAt: at("2026-10-04T01:00:00Z"), photoCount: 4 },
];

const orderRows: OrderRow[] = [
  { id: "o1", status: "pending", createdAt: at("2026-09-30T00:00:00Z"), updatedAt: at("2026-09-30T00:00:00Z"), itemsSummary: "2x Hitch Cover", amountTotalCents: 2400 },
];

// In-memory JarvisDb that applies the same filter semantics as jarvis-db.ts.
function filterRows<T extends { status: string; createdAt: Date }>(rows: T[], f: ListFilter): T[] {
  return rows
    .filter((r) => (!f.status || r.status === f.status) && (!f.since || r.createdAt > f.since))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, f.limit);
}

function groupCounts(rows: { status: string }[]) {
  const m = new Map<string, number>();
  for (const r of rows) m.set(r.status, (m.get(r.status) ?? 0) + 1);
  return [...m].map(([status, count]) => ({ status, count }));
}

const fakeDb: JarvisDb = {
  petDesignCountsByStatus: async () => groupCounts(petRows),
  orderCountsByStatus: async () => groupCounts(orderRows),
  petDesignCountSince: async (since) => petRows.filter((r) => r.createdAt > since).length,
  orderCountSince: async (since) => orderRows.filter((r) => r.createdAt > since).length,
  listPetDesigns: async (f) => filterRows(petRows, f),
  listOrders: async (f) => filterRows(orderRows, f),
};

const summary = summaryHandler(fakeDb);
const petDesigns = petDesignsHandler(fakeDb);
const orders = ordersHandler(fakeDb);

function get(path: string, auth: string | null = `Bearer ${KEY}`) {
  const headers = new Headers();
  if (auth !== null) headers.set("authorization", auth);
  return new Request(`http://localhost/api/admin/jarvis/${path}`, { headers });
}

let savedKey: string | undefined;
beforeEach(() => {
  savedKey = process.env.JARVIS_API_KEY;
  process.env.JARVIS_API_KEY = KEY;
});
afterEach(() => {
  if (savedKey === undefined) delete process.env.JARVIS_API_KEY;
  else process.env.JARVIS_API_KEY = savedKey;
});

describe("auth", () => {
  for (const [name, handler] of [["summary", summary], ["pet-designs", petDesigns], ["orders", orders]] as const) {
    test(`${name}: 401 when the key is missing`, async () => {
      const res = await handler(get(name, null));
      assert.equal(res.status, 401);
      assert.deepEqual(await res.json(), { error: "Unauthorized" });
    });

    test(`${name}: 401 when the key is wrong`, async () => {
      const res = await handler(get(name, "Bearer nope"));
      assert.equal(res.status, 401);
    });

    test(`${name}: 503 when JARVIS_API_KEY is unset`, async () => {
      delete process.env.JARVIS_API_KEY;
      const res = await handler(get(name));
      assert.equal(res.status, 503);
      assert.ok((await res.json()).error);
    });
  }

  test("key in the query string is not accepted", async () => {
    const res = await summary(get(`summary?key=${KEY}`, null));
    assert.equal(res.status, 401);
  });

  test("non-Bearer scheme is rejected", async () => {
    const res = await summary(get("summary", KEY));
    assert.equal(res.status, 401);
  });
});

describe("methods", () => {
  test("405 JSON for POST", async () => {
    const res = methodNotAllowed();
    assert.equal(res.status, 405);
    assert.equal(res.headers.get("allow"), "GET");
    assert.deepEqual(await res.json(), { error: "Method not allowed" });
  });

  test("route files export only GET plus 405 write methods", async () => {
    for (const name of ["summary", "pet-designs", "orders"]) {
      const src = await import("node:fs/promises").then((fs) =>
        fs.readFile(new URL(`../app/api/admin/jarvis/${name}/route.ts`, import.meta.url), "utf8"),
      );
      assert.match(src, /methodNotAllowed as POST/);
      assert.match(src, /methodNotAllowed as DELETE/);
    }
  });
});

describe("summary", () => {
  test("returns every status key, including zeros, and null new_since without since", async () => {
    const res = await summary(get("summary"));
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("cache-control"), "no-store");
    const body = await res.json();

    assert.deepEqual(Object.keys(body.pet_designs.counts).sort(), [...PET_DESIGN_STATUSES].sort());
    assert.deepEqual(Object.keys(body.orders.counts).sort(), [...ORDER_STATUSES].sort());
    assert.deepEqual(body.pet_designs.counts, { submitted: 2, proposals_sent: 0, approved: 1, ordered: 0 });
    assert.deepEqual(body.orders.counts, { pending: 1, shipped: 0 });
    assert.equal(body.pet_designs.new_since, null);
    assert.equal(body.orders.new_since, null);
    assert.ok(!Number.isNaN(Date.parse(body.generated_at)));
  });

  test("since counts only records created after it", async () => {
    const body = await (await summary(get("summary?since=2026-10-02T00:00:00Z"))).json();
    assert.equal(body.pet_designs.new_since, 2);
    assert.equal(body.orders.new_since, 0);
  });

  test("400 for an invalid since", async () => {
    const res = await summary(get("summary?since=yesterday"));
    assert.equal(res.status, 400);
    assert.ok((await res.json()).error);
  });
});

describe("lists", () => {
  test("pet-designs: newest first, PII-free fields", async () => {
    const body = await (await petDesigns(get("pet-designs"))).json();
    assert.deepEqual(body.items.map((i: { id: string }) => i.id), ["p3", "p2", "p1"]);
    assert.deepEqual(Object.keys(body.items[0]).sort(), ["created_at", "id", "status", "title", "updated_at"]);
    assert.equal(body.items[0].title, "Pet design (4 photos)");
  });

  test("pet-designs: since + status + limit filters", async () => {
    let body = await (await petDesigns(get("pet-designs?since=2026-10-02T00:00:00Z"))).json();
    assert.deepEqual(body.items.map((i: { id: string }) => i.id), ["p3", "p2"]);

    body = await (await petDesigns(get("pet-designs?status=submitted&limit=1"))).json();
    assert.deepEqual(body.items.map((i: { id: string }) => i.id), ["p2"]);
  });

  test("400 for unknown status or bad limit", async () => {
    assert.equal((await petDesigns(get("pet-designs?status=bogus"))).status, 400);
    assert.equal((await orders(get("orders?limit=0"))).status, 400);
    assert.equal((await orders(get("orders?limit=abc"))).status, 400);
  });

  test("orders: item_summary and total, no customer fields", async () => {
    const body = await (await orders(get("orders?limit=500"))).json();
    assert.deepEqual(body.items[0], {
      id: "o1",
      status: "pending",
      created_at: "2026-09-30T00:00:00.000Z",
      updated_at: "2026-09-30T00:00:00.000Z",
      item_summary: "2x Hitch Cover",
      total: 24,
    });
  });
});
