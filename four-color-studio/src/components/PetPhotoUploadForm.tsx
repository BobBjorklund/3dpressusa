"use client";

import { useState } from "react";

export default function PetPhotoUploadForm() {
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const res = await fetch("/api/pet-design/submit", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const { error: msg } = await res.json().catch(() => ({}));
        throw new Error(msg ?? "Something went wrong");
      }
      setStatus("done");
      form.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="rounded-md border border-hazard-yellow/40 bg-hazard-yellow/10 p-6 text-center">
        <p className="font-display text-lg uppercase tracking-wide text-hazard-yellow">Photo received!</p>
        <p className="mt-2 text-sm text-brushed-aluminum">
          Check your email for a confirmation — we'll follow up with design ideas within a few business days.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label htmlFor="photo" className="mb-1 block font-mono text-[11px] uppercase tracking-[0.2em] text-brushed-aluminum">
          Your pet's photo
        </label>
        <input
          id="photo"
          name="photo"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          required
          className="block w-full rounded-sm border border-brushed-aluminum/25 bg-steel-panel px-3 py-2 text-sm text-white file:mr-3 file:rounded-sm file:border-0 file:bg-plate-red file:px-3 file:py-1.5 file:font-display file:text-xs file:uppercase file:tracking-wide file:text-white"
        />
      </div>

      <div>
        <label htmlFor="email" className="mb-1 block font-mono text-[11px] uppercase tracking-[0.2em] text-brushed-aluminum">
          Your email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="block w-full rounded-sm border border-brushed-aluminum/25 bg-steel-panel px-3 py-2 text-sm text-white"
        />
      </div>

      <div>
        <label htmlFor="name" className="mb-1 block font-mono text-[11px] uppercase tracking-[0.2em] text-brushed-aluminum">
          Your name <span className="text-brushed-aluminum/60 normal-case">(optional)</span>
        </label>
        <input
          id="name"
          name="name"
          type="text"
          className="block w-full rounded-sm border border-brushed-aluminum/25 bg-steel-panel px-3 py-2 text-sm text-white"
        />
      </div>

      <div>
        <label htmlFor="notes" className="mb-1 block font-mono text-[11px] uppercase tracking-[0.2em] text-brushed-aluminum">
          Design ideas <span className="text-brushed-aluminum/60 normal-case">(optional — or just send the photo and we'll come up with ideas)</span>
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          className="block w-full rounded-sm border border-brushed-aluminum/25 bg-steel-panel px-3 py-2 text-sm text-white"
        />
      </div>

      {error && <p className="text-sm text-plate-red">{error}</p>}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="rounded-sm bg-plate-red px-6 py-3 font-display text-sm uppercase tracking-wide text-white transition hover:bg-plate-red/85 disabled:opacity-50"
      >
        {status === "submitting" ? "Uploading…" : "Send us your pet"}
      </button>
    </form>
  );
}
