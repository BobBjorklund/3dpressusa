import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getOrderDetails } from "@/lib/stripe-order";
import ShipOrderForm from "@/components/ShipOrderForm";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) notFound();

  const details = await getOrderDetails(order.stripeSessionId);
  const shipping = details?.session.collected_information?.shipping_details;
  const addr = shipping?.address;

  return (
    <main className="px-6 py-10 md:px-8">
      <div className="mx-auto max-w-3xl">
        <div
          className={`inline-block rounded-sm border px-2 py-1 font-mono text-[10px] uppercase tracking-wide ${
            order.status === "shipped"
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
              : "border-hazard-yellow/40 bg-hazard-yellow/10 text-hazard-yellow"
          }`}
        >
          {order.status}
        </div>
        <h1 className="mt-3 font-display text-2xl uppercase text-white">
          {order.customerName ?? order.customerEmail}
        </h1>
        <p className="mt-1 text-sm text-brushed-aluminum">{order.customerEmail}</p>
        <p className="mt-1 font-mono text-xs text-brushed-aluminum/70">
          {new Date(order.createdAt).toLocaleString()} · Order ID: {order.stripeSessionId}
        </p>

        <div className="mt-6 rounded-sm border border-brushed-aluminum/25 bg-steel-panel p-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-brushed-aluminum">Items</div>
          {details ? (
            <table className="mt-2 w-full text-sm">
              <tbody>
                {details.lineItems.map((li) => (
                  <tr key={li.id} className="border-t border-brushed-aluminum/15">
                    <td className="py-2 text-white">{li.description}</td>
                    <td className="py-2 text-center text-brushed-aluminum">{li.quantity}</td>
                    <td className="py-2 text-right text-white">
                      ${((li.amount_total ?? 0) / 100).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="mt-2 text-sm text-plate-red">
              Couldn&apos;t load live details from Stripe. Showing local summary instead: {order.itemsSummary}
            </p>
          )}
          <div className="mt-3 border-t border-brushed-aluminum/15 pt-3 text-right font-mono text-sm text-white">
            Total: ${(order.amountTotalCents / 100).toFixed(2)}
          </div>
        </div>

        <div className="mt-4 rounded-sm border border-brushed-aluminum/25 bg-steel-panel p-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-brushed-aluminum">Ship To</div>
          {addr ? (
            <div className="mt-2 text-sm text-white">
              <div>{shipping?.name}</div>
              <div className="text-brushed-aluminum">{addr.line1}</div>
              {addr.line2 && <div className="text-brushed-aluminum">{addr.line2}</div>}
              <div className="text-brushed-aluminum">
                {addr.city}, {addr.state} {addr.postal_code}
              </div>
            </div>
          ) : (
            <p className="mt-2 text-sm text-brushed-aluminum">Address unavailable.</p>
          )}
        </div>

        {order.status === "shipped" ? (
          <div className="mt-6 rounded-sm border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-300">
            Shipped via {order.trackingCarrier} — tracking #{order.trackingNumber}
            {order.shippedAt && ` on ${new Date(order.shippedAt).toLocaleDateString()}`}
          </div>
        ) : (
          <div className="mt-6">
            <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.25em] text-brushed-aluminum">
              Ship This Order
            </div>
            <ShipOrderForm orderId={order.id} />
          </div>
        )}
      </div>
    </main>
  );
}
