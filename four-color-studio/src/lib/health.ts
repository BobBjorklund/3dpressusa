// Public liveness check, also the keepalive target for the operator's other
// app: each ping warms the Vercel function and runs one trivial query so the
// Neon compute doesn't scale to zero. Takes the DB ping as a parameter so
// tests can run without Postgres; the route wires in Prisma.
//
// `cold_start` is true when this request spun up a fresh function instance,
// i.e. Vercel had gone idle — the one thing only the server can know. Activity
// history ("last seen") is the pinger's job; it records its own ping times.
//
// The response carries status and timings only — never the connection string,
// host, or raw driver errors.

export const DB_TIMEOUT_MS = 5000;
export const DEGRADED_MS = 1000; // slower than this usually means a Neon cold start

export type DbPing = () => Promise<unknown>;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

export function healthHandler(ping: DbPing, timeoutMs = DB_TIMEOUT_MS) {
  let warm = false;

  return async (): Promise<Response> => {
    const coldStart = !warm;
    warm = true;

    const started = performance.now();
    let dbOk = true;
    try {
      await withTimeout(ping(), timeoutMs);
    } catch (err) {
      dbOk = false;
      // Error class only; driver messages can include the host.
      console.error("[health] db check failed:", err instanceof Error ? err.name : "unknown");
    }
    const latencyMs = Math.round(performance.now() - started);
    const status = !dbOk ? "down" : latencyMs > DEGRADED_MS ? "degraded" : "ok";
    const code = dbOk ? 200 : 503;

    return Response.json(
      {
        status,
        code,
        cold_start: coldStart,
        db: { ok: dbOk, latency_ms: latencyMs },
        checked_at: new Date().toISOString(),
      },
      { status: code, headers: { "Cache-Control": "no-store" } },
    );
  };
}
