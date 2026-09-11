import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AdminOrdersListPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const filter = status === "shipped" ? "shipped" : "pending";

  const orders = await prisma.order.findMany({
    where: { status: filter },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="px-6 py-10 md:px-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="font-display text-3xl uppercase text-white">Orders</h1>

        <div className="mt-4 flex gap-2">
          <Link
            href="/admin/orders?status=pending"
            className={`rounded-sm border px-4 py-2 font-mono text-xs uppercase tracking-wide transition ${
              filter === "pending"
                ? "border-hazard-yellow/40 bg-hazard-yellow/10 text-hazard-yellow"
                : "border-brushed-aluminum/25 text-brushed-aluminum hover:text-white"
            }`}
          >
            Pending
          </Link>
          <Link
            href="/admin/orders?status=shipped"
            className={`rounded-sm border px-4 py-2 font-mono text-xs uppercase tracking-wide transition ${
              filter === "shipped"
                ? "border-hazard-yellow/40 bg-hazard-yellow/10 text-hazard-yellow"
                : "border-brushed-aluminum/25 text-brushed-aluminum hover:text-white"
            }`}
          >
            Shipped
          </Link>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          {orders.length === 0 && (
            <p className="text-brushed-aluminum">No {filter} orders.</p>
          )}
          {orders.map((o) => (
            <Link
              key={o.id}
              href={`/admin/orders/${o.id}`}
              className="flex items-center gap-4 rounded-sm border border-brushed-aluminum/25 bg-steel-panel p-4 transition hover:border-brushed-aluminum/45"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-white">
                  {o.customerName ?? o.customerEmail}
                </div>
                <div className="truncate text-xs text-brushed-aluminum">{o.itemsSummary}</div>
                <div className="mt-1 font-mono text-[10px] text-brushed-aluminum/70">
                  {new Date(o.createdAt).toLocaleString()}
                </div>
              </div>
              <div className="flex-shrink-0 text-right">
                <div className="font-mono text-sm text-white">
                  ${(o.amountTotalCents / 100).toFixed(2)}
                </div>
                <div
                  className={`mt-1 rounded-sm border px-2 py-1 font-mono text-[10px] uppercase ${
                    o.status === "shipped"
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                      : "border-hazard-yellow/40 bg-hazard-yellow/10 text-hazard-yellow"
                  }`}
                >
                  {o.status}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
