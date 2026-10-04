import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { healthHandler } from "@/lib/health";

// Run with: npm test

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe("health", () => {
  test("ok: 200 with latency when the query succeeds", async () => {
    const res = await healthHandler(async () => 1)();
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("cache-control"), "no-store");
    const body = await res.json();
    assert.equal(body.status, "ok");
    assert.equal(body.db.ok, true);
    assert.equal(typeof body.db.latency_ms, "number");
    assert.ok(!Number.isNaN(Date.parse(body.checked_at)));
  });

  test("cold_start is true only on an instance's first request", async () => {
    const handler = healthHandler(async () => 1);
    const first = await (await handler()).json();
    assert.equal(first.cold_start, true);
    assert.equal(first.code, 200);
    assert.equal((await (await handler()).json()).cold_start, false);
  });

  test("degraded: 200 when the query is slow", async (t) => {
    const realNow = performance.now.bind(performance);
    let offset = 0;
    t.mock.method(performance, "now", () => realNow() + offset);
    const res = await healthHandler(async () => { offset = 1500; })();
    assert.equal(res.status, 200);
    assert.equal((await res.json()).status, "degraded");
  });

  test("down: 503 when the query throws, with no error details leaked", async () => {
    const secret = "postgres://user:hunter2@ep-secret.neon.tech/db";
    const res = await healthHandler(async () => { throw new Error(`connect failed ${secret}`); })();
    assert.equal(res.status, 503);
    const text = await res.text();
    assert.equal(JSON.parse(text).status, "down");
    assert.ok(!text.includes("hunter2") && !text.includes("neon.tech"));
  });

  test("down: 503 when the query exceeds the timeout", async () => {
    const res = await healthHandler(() => sleep(200), 20)();
    assert.equal(res.status, 503);
    assert.equal((await res.json()).db.ok, false);
  });
});
