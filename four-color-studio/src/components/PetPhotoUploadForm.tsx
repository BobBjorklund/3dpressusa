"use client";

import { useState } from "react";
import { upload } from "@vercel/blob/client";

const MAX_PHOTOS = 4;

export default function PetPhotoUploadForm() {
  const [status, setStatus] = useState<"idle" | "uploading" | "submitting" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFiles(Array.from(e.target.files ?? []));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (files.length === 0) {
      setError("Please select at least one photo.");
      return;
    }
    if (files.length > MAX_PHOTOS) {
      setError(`Please select up to ${MAX_PHOTOS} photos.`);
      return;
    }

    setError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const email = formData.get("email");
    const name = formData.get("name");
    const notes = formData.get("notes");

    try {
      // Upload straight from the browser to Blob — a serverless function's
      // request body is capped around 4.5MB, and 4 full-res phone photos
      // blow past that easily. This way the image bytes never touch our
      // function at all, only the resulting URLs do.
      setStatus("uploading");
      const uploaded = await Promise.all(
        files.map((file) =>
          upload(`pet-design/${crypto.randomUUID()}-${file.name}`, file, {
            access: "public",
            handleUploadUrl: "/api/pet-design/upload",
          }),
        ),
      );

      setStatus("submitting");
      const res = await fetch("/api/pet-design/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photoUrls: uploaded.map((b) => b.url),
          email,
          name,
          notes,
        }),
      });
      if (!res.ok) {
        const { error: msg } = await res.json().catch(() => ({}));
        throw new Error(msg ?? "Something went wrong");
      }
      setStatus("done");
      form.reset();
      setFiles([]);
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

  const busy = status === "uploading" || status === "submitting";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label htmlFor="photos" className="mb-1 block font-mono text-[11px] uppercase tracking-[0.2em] text-brushed-aluminum">
          Your pet's photo(s) <span className="text-brushed-aluminum/60 normal-case">(up to {MAX_PHOTOS} — got a full house? send one per pet)</span>
        </label>
        <input
          id="photos"
          name="photos"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          multiple
          required
          onChange={handleFileChange}
          className="block w-full rounded-sm border border-brushed-aluminum/25 bg-steel-panel px-3 py-2 text-sm text-white file:mr-3 file:rounded-sm file:border-0 file:bg-plate-red file:px-3 file:py-1.5 file:font-display file:text-xs file:uppercase file:tracking-wide file:text-white"
        />
        {files.length > 0 && (
          <p className={`mt-1 text-xs ${files.length > MAX_PHOTOS ? "text-plate-red" : "text-brushed-aluminum"}`}>
            {files.length} of {MAX_PHOTOS} photos selected
          </p>
        )}
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
          Design ideas <span className="text-brushed-aluminum/60 normal-case">(optional — or just send the photo(s) and we'll come up with ideas)</span>
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
        disabled={busy || files.length > MAX_PHOTOS}
        className="rounded-sm bg-plate-red px-6 py-3 font-display text-sm uppercase tracking-wide text-white transition hover:bg-plate-red/85 disabled:opacity-50"
      >
        {status === "uploading" ? "Uploading photos…" : status === "submitting" ? "Sending…" : "Send us your pet"}
      </button>
    </form>
  );
}
