import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { put } from '@vercel/blob';
import { prisma } from '@/lib/prisma';
import { brevoSend } from '@/lib/email';
import { bufferToThumbUrl } from '@/lib/image';

// Entry point for the "Put your pet on a coaster/hitch" upload form
// (src/app/pet-coasters/page.tsx). Stores the photo, creates the request
// row, and emails both the shop (to review + propose designs) and the
// customer (confirmation). See src/app/admin/pet-design/ for the next step.

const MAX_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']);

export async function POST(req: NextRequest) {
  const form = await req.formData();

  const file = form.get('photo');
  const customerEmail = form.get('email');
  const customerName = form.get('name');
  const notes = form.get('notes');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Photo is required' }, { status: 400 });
  }
  if (typeof customerEmail !== 'string' || !customerEmail.includes('@')) {
    return NextResponse.json({ error: 'A valid email is required' }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: 'Photo must be a JPG, PNG, WEBP, or HEIC image' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Photo must be under 10MB' }, { status: 400 });
  }

  const originalBuffer = Buffer.from(await file.arrayBuffer());

  const blob = await put(`pet-design/${randomUUID()}-${file.name}`, originalBuffer, {
    access: 'public',
    contentType: file.type,
  });

  // Full-res goes to Blob for the admin page / print production. The email
  // gets a small inline thumbnail instead — HEIC sometimes isn't supported
  // by sharp's prebuilt binary, so fall back to the full-size URL rather
  // than fail the whole submission over a slow-loading email image.
  let thumbSrc = blob.url;
  try {
    thumbSrc = await bufferToThumbUrl(originalBuffer);
  } catch (err) {
    console.error('[pet-design] thumbnail generation failed, falling back to full-size URL:', err);
  }

  const approvalToken = randomUUID();

  const request = await prisma.petDesignRequest.create({
    data: {
      customerEmail,
      customerName: typeof customerName === 'string' && customerName.trim() ? customerName.trim() : null,
      notes: typeof notes === 'string' && notes.trim() ? notes.trim() : null,
      originalImageUrl: blob.url,
      approvalToken,
    },
  });

  const adminUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/pet-design/${request.id}`;

  await Promise.all([
    brevoSend(
      'petcoasters@3dpressusa.com',
      `New pet design request — ${request.customerName ?? request.customerEmail}`,
      `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0a0a0a;color:#e5e5e5;padding:32px;max-width:600px;">
          <h2 style="color:#fff;margin:0 0 16px;">New Pet Design Request</h2>
          <img src="${thumbSrc}" alt="" style="max-width:100%;border-radius:12px;margin-bottom:16px;" />
          <p><strong>From:</strong> ${request.customerName ?? '(no name given)'} — ${request.customerEmail}</p>
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
          <p>We received your pet's photo and we're putting together a few design ideas for your coaster set. You'll hear back from us by email within a few business days.</p>
          <p>Questions in the meantime? Just reply to this email.</p>
        </div>
      `,
    ),
  ]);

  return NextResponse.json({ ok: true });
}
