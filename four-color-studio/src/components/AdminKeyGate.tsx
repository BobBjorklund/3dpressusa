"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminKeyGate() {
  const [key, setKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key }),
    });
    if (!res.ok) {
      setError("Invalid key");
      setLoading(false);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gunmetal px-6 text-white">
      <h1 className="font-display text-2xl uppercase text-white">Admin Access</h1>
      <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-3">
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="Admin key"
          autoFocus
          className="rounded-sm border border-brushed-aluminum/25 bg-steel-panel px-3 py-2 text-sm text-white"
        />
        {error && <p className="text-sm text-plate-red">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="rounded-sm bg-plate-red px-6 py-3 font-display text-sm uppercase tracking-wide text-white transition hover:bg-plate-red/85 disabled:opacity-50"
        >
          Enter
        </button>
      </form>
    </div>
  );
}
