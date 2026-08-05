"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ProposalUploadForm({ requestId }: { requestId: string }) {
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    setError(null);

    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch(`/api/pet-design/${requestId}/propose`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const { error: msg } = await res.json().catch(() => ({}));
        throw new Error(msg ?? "Something went wrong");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-sm border border-brushed-aluminum/25 bg-steel-panel p-4">
      <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-brushed-aluminum">
        Upload design proposals
      </div>
      <input
        type="file"
        name="images"
        accept="image/jpeg,image/png,image/webp"
        multiple
        required
        className="block w-full text-sm text-white file:mr-3 file:rounded-sm file:border-0 file:bg-plate-red file:px-3 file:py-1.5 file:font-display file:text-xs file:uppercase file:tracking-wide file:text-white"
      />
      {error && <p className="text-sm text-plate-red">{error}</p>}
      <button
        type="submit"
        disabled={status === "sending"}
        className="rounded-sm bg-plate-red px-6 py-3 font-display text-sm uppercase tracking-wide text-white transition hover:bg-plate-red/85 disabled:opacity-50"
      >
        {status === "sending" ? "Sending…" : "Send to customer"}
      </button>
    </form>
  );
}
