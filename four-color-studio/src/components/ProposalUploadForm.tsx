"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { upload } from "@vercel/blob/client";

export default function ProposalUploadForm({ requestId }: { requestId: string }) {
  const [status, setStatus] = useState<"idle" | "uploading" | "sending" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const router = useRouter();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFiles(Array.from(e.target.files ?? []));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (files.length === 0) return;
    setError(null);

    try {
      // Same fix as the customer upload form — upload straight to Blob from
      // the browser instead of through this app's serverless function,
      // since a handful of full-res design images can exceed the ~4.5MB
      // function payload cap.
      setStatus("uploading");
      const uploaded = await Promise.all(
        files.map((file) =>
          upload(`pet-design/${requestId}/${crypto.randomUUID()}-${file.name}`, file, {
            access: "public",
            handleUploadUrl: "/api/pet-design/upload",
          }),
        ),
      );

      setStatus("sending");
      const res = await fetch(`/api/pet-design/${requestId}/propose`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrls: uploaded.map((b) => b.url) }),
      });
      if (!res.ok) {
        const { error: msg } = await res.json().catch(() => ({}));
        throw new Error(msg ?? "Something went wrong");
      }
      setFiles([]);
      router.refresh();
      setStatus("idle");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  }

  const busy = status === "uploading" || status === "sending";

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
        onChange={handleFileChange}
        className="block w-full text-sm text-white file:mr-3 file:rounded-sm file:border-0 file:bg-plate-red file:px-3 file:py-1.5 file:font-display file:text-xs file:uppercase file:tracking-wide file:text-white"
      />
      {error && <p className="text-sm text-plate-red">{error}</p>}
      <button
        type="submit"
        disabled={busy || files.length === 0}
        className="rounded-sm bg-plate-red px-6 py-3 font-display text-xs uppercase tracking-wide text-white transition hover:bg-plate-red/85 disabled:opacity-50"
      >
        {status === "uploading" ? "Uploading…" : status === "sending" ? "Sending…" : "Send to customer"}
      </button>
    </form>
  );
}
