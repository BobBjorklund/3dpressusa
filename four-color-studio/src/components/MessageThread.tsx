"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type PetDesignMessage = { from: "admin" | "customer"; body: string; createdAt: string };

export default function MessageThread({
  requestId,
  messages,
  viewerRole,
  token,
}: {
  requestId: string;
  messages: PetDesignMessage[];
  viewerRole: "admin" | "customer";
  token?: string;
}) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSend() {
    if (!text.trim()) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/pet-design/${requestId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text, token }),
      });
      if (!res.ok) {
        const { error: msg } = await res.json().catch(() => ({}));
        throw new Error(msg ?? "Something went wrong");
      }
      setText("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-sm border border-brushed-aluminum/25 bg-steel-panel p-4">
      <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-brushed-aluminum">Notes &amp; Questions</div>

      <div className="flex flex-col gap-2">
        {messages.length === 0 && <p className="text-sm text-brushed-aluminum/70">No messages yet.</p>}
        {messages.map((m, i) => {
          const isSelf = m.from === viewerRole;
          return (
            <div
              key={i}
              className={`flex flex-col max-w-[85%] rounded-sm px-3 py-2 text-sm ${
                isSelf ? "self-end bg-plate-red/15 text-white" : "self-start bg-white/[0.06] text-white"
              }`}
            >
              <div className="mb-1 font-mono text-[9px] uppercase tracking-wide text-brushed-aluminum">
                {m.from === "admin" ? "3DPress USA" : "You"} · {new Date(m.createdAt).toLocaleDateString()}
              </div>
              <div className="whitespace-pre-wrap">{m.body}</div>
            </div>
          );
        })}
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={2}
        placeholder={
          viewerRole === "admin"
            ? `e.g. "To reproduce this we'll need to drop one color…"`
            : "Ask a question or leave a note…"
        }
        className="rounded-sm border border-brushed-aluminum/25 bg-gunmetal px-3 py-2 text-sm text-white"
      />
      {error && <p className="text-sm text-plate-red">{error}</p>}
      <button
        type="button"
        onClick={handleSend}
        disabled={sending || !text.trim()}
        className="w-fit rounded-sm bg-plate-red px-4 py-2 font-display text-xs uppercase tracking-wide text-white transition hover:bg-plate-red/85 disabled:opacity-50"
      >
        {sending ? "Sending…" : "Send"}
      </button>
    </div>
  );
}
