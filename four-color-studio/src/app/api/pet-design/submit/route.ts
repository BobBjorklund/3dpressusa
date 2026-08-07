import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { brevoSend } from '@/lib/email';
import { urlToThumbUrl } from '@/lib/image';

// Entry point for the "Put your pet on a coaster/hitch" upload form
// (src/components/PetPhotoUploadForm.tsx). Photos are already uploaded to
// Blob client-side by the time this runs (see /api/pet-design/upload) — a
// serverless function's request body is capped around 4.5MB, too small for
// 4 full-res phone photos, so this route only ever receives small JSON with
// the resulting URLs, never the image bytes themselves. Creates the request
// row and emails both the shop (to review + propose designs) and the
// customer (confirmation). See src/app/admin/pet-design/ for the next step.

const MAX_PHOTOS = 4; // up to one per coaster slot — customers with fewer pets just get proposals for what they sent

export async function POST(req: NextRequest) {
  const body = await req.json();
  const photoUrls = Array.isArray(body.photoUrls) ? body.photoUrls.filter((u: unknown) => typeof u === 'string') : [];
  const customerEmail = body.email;
  const customerName = body.name;
  const notes = body.notes;

  if (photoUrls.length === 0) {
    return NextResponse.json({ error: 'At least one photo is required' }, { status: 400 });
  }
  if (photoUrls.length > MAX_PHOTOS) {
    return NextResponse.json({ error: `You can upload up to ${MAX_PHOTOS} photos` }, { status: 400 });
  }
  if (typeof customerEmail !== 'string' || !customerEmail.includes('@')) {
    return NextResponse.json({ error: 'A valid email is required' }, { status: 400 });
  }
  // Only Blob URLs we actually control should be accepted here, not
  // arbitrary attacker-supplied URLs.
  if (!photoUrls.every((url: string) => {
    try {
      return new URL(url).hostname.endsWith('.public.blob.vercel-storage.com');
    } catch {
      return false;
    }
  })) {
    return NextResponse.json({ error: 'Invalid photo reference' }, { status: 400 });
  }

  // Small inline thumbnails for the email instead of the full-res Blob URLs
  // — HEIC sometimes isn't supported by sharp's prebuilt binary, so fall
  // back to the full-size URL per-photo rather than fail the whole
  // submission over a slow-loading email image.
  const thumbSrcs = await Promise.all(
    photoUrls.map((url: string) => urlToThumbUrl(url).catch(() => url)),
  );

  const approvalToken = randomUUID();

  const request = await prisma.petDesignRequest.create({
    data: {
      customerEmail,
      customerName: typeof customerName === 'string' && customerName.trim() ? customerName.trim() : null,
      notes: typeof notes === 'string' && notes.trim() ? notes.trim() : null,
      originalImageUrls: photoUrls,
      approvalToken,
    },
  });

  const adminUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/pet-design/${request.id}`;
  const photoThumbsHtml = thumbSrcs
    .map((src) => `<img src="${src}" alt="" style="width:150px;height:150px;object-fit:cover;border-radius:12px;margin:4px;" />`)
    .join('');

  await Promise.all([
    brevoSend(
      'petcoasters@3dpressusa.com',
      `New pet design request — ${request.customerName ?? request.customerEmail}`,
      `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0a0a0a;color:#e5e5e5;padding:32px;max-width:600px;">
          <h2 style="color:#fff;margin:0 0 16px;">New Pet Design Request</h2>
          <div style="margin-bottom:16px;">${photoThumbsHtml}</div>
          <p><strong>From:</strong> ${request.customerName ?? '(no name given)'} — ${request.customerEmail}</p>
          <p><strong>Photos:</strong> ${photoUrls.length}</p>
          ${request.notes ? `<p><strong>Notes:</strong> ${request.notes}</p>` : '<p><em>No design notes provided.</em></p>'}
          <p style="margin-top:24px;">
            <a href="${adminUrl}" style="color:#60a5fa;">Review this request →</a>
          </p>
        </div>
      `,
    ),
    brevoSend(
      customerEmail,
      "We've got your pet's photo! 🐾",
      `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0a0a0a;color:#e5e5e5;padding:32px;max-width:600px;">
          <h2 style="color:#fff;margin:0 0 16px;">Got it!</h2>
          <p>We received ${photoUrls.length > 1 ? `your ${photoUrls.length} photos` : "your pet's photo"} and we're putting together a few design ideas for your coaster set. You'll hear back from us by email within a few business days.</p>
          <p>Questions in the meantime? Just reply to this email.</p>
        </div>
      `,
    ),
  ]);

  return NextResponse.json({ ok: true });
}
