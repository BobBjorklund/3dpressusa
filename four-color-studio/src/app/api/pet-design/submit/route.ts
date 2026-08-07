import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { put } from '@vercel/blob';
import { prisma } from '@/lib/prisma';
import { brevoSend } from '@/lib/email';
import { bufferToThumbUrl } from '@/lib/image';

// Entry point for the "Put your pet on a coaster/hitch" upload form
// (src/app/pet-coasters/page.tsx). Stores the photo(s), creates the request
// row, and emails both the shop (to review + propose designs) and the
// customer (confirmation). See src/app/admin/pet-design/ for the next step.

const MAX_BYTES = 10 * 1024 * 1024; // 10MB per photo
const MAX_PHOTOS = 4; // up to one per coaster slot — customers with fewer pets just get proposals for what they sent
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']);

export async function POST(req: NextRequest) {
  const form = await req.formData();

  const files = form.getAll('photos').filter((f): f is File => f instanceof File);
  const customerEmail = form.get('email');
  const customerName = form.get('name');
  const notes = form.get('notes');

  if (files.length === 0) {
    return NextResponse.json({ error: 'At least one photo is required' }, { status: 400 });
  }
  if (files.length > MAX_PHOTOS) {
    return NextResponse.json({ error: `You can upload up to ${MAX_PHOTOS} photos` }, { status: 400 });
  }
  if (typeof customerEmail !== 'string' || !customerEmail.includes('@')) {
    return NextResponse.json({ error: 'A valid email is required' }, { status: 400 });
  }
  for (const file of files) {
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: 'Photos must be JPG, PNG, WEBP, or HEIC images' }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'Each photo must be under 10MB' }, { status: 400 });
    }
  }

  const originalBuffers = await Promise.all(files.map((file) => file.arrayBuffer().then(Buffer.from)));

  const uploaded = await Promise.all(
    files.map((file, i) =>
      put(`pet-design/${randomUUID()}-${file.name}`, originalBuffers[i], { access: 'public', contentType: file.type }),
    ),
  );
  const originalImageUrls = uploaded.map((b) => b.url);

  // Full-res goes to Blob for the admin page / print production. The email
  // gets small inline thumbnails instead — HEIC sometimes isn't supported by
  // sharp's prebuilt binary, so fall back to the full-size URL per-photo
  // rather than fail the whole submission over a slow-loading email image.
  const thumbSrcs = await Promise.all(
    originalBuffers.map((buf, i) => bufferToThumbUrl(buf).catch(() => uploaded[i].url)),
  );

  const approvalToken = randomUUID();

  const request = await prisma.petDesignRequest.create({
    data: {
      customerEmail,
      customerName: typeof customerName === 'string' && customerName.trim() ? customerName.trim() : null,
      notes: typeof notes === 'string' && notes.trim() ? notes.trim() : null,
      originalImageUrls,
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
          <p><strong>Photos:</strong> ${originalImageUrls.length}</p>
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
          <p>We received ${originalImageUrls.length > 1 ? `your ${originalImageUrls.length} photos` : "your pet's photo"} and we're putting together a few design ideas for your coaster set. You'll hear back from us by email within a few business days.</p>
          <p>Questions in the meantime? Just reply to this email.</p>
        </div>
      `,
    ),
  ]);

  return NextResponse.json({ ok: true });
}
