"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ShipOrderForm({ orderId }: { orderId: string }) {
  const [carrier, setCarrier] = useState("USPS");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!trackingNumber.trim()) {
      setError("Tracking number is required");
      return;
    }
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/admin/orders/${orderId}/ship`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ carrier, trackingNumber: trackingNumber.trim() }),
    });
    if (!res.ok) {
      const { error: msg } = await res.json().catch(() => ({}));
      setError(msg ?? "Something went wrong");
      setLoading(false);
      return;
    }
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex gap-3">
        <select
          value={carrier}
          onChange={(e) => setCarrier(e.target.value)}
          className="rounded-sm border border-brushed-aluminum/25 bg-steel-panel px-3 py-2 text-sm text-white"
        >
          <option value="USPS">USPS</option>
          <option value="UPS">UPS</option>
          <option value="FedEx">FedEx</option>
          <option value="Other">Other</option>
        </select>
        <input
          type="text"
          value={trackingNumber}
          onChange={(e) => setTrackingNumber(e.target.value)}
          placeholder="Tracking number"
          className="flex-1 rounded-sm border border-brushed-aluminum/25 bg-steel-panel px-3 py-2 text-sm text-white"
        />
      </div>
      {error && <p className="text-sm text-plate-red">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="rounded-sm bg-plate-red px-6 py-3 font-display text-sm uppercase tracking-wide text-white transition hover:bg-plate-red/85 disabled:opacity-50"
      >
        {loading ? "Sending…" : "Mark Shipped & Email Customer"}
      </button>
    </form>
  );
}
