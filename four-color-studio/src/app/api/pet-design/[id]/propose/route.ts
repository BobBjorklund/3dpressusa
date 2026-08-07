import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { brevoSend } from '@/lib/email';
import { urlToThumbUrl } from '@/lib/image';

// Called from the admin detail page (src/app/admin/pet-design/[id]/page.tsx)
// once the shop has generated design proposals externally (ChatGPT/image-gen)
// and is ready to send them to the customer for approval. Images are already
// uploaded to Blob client-side by the time this runs (see
// src/components/ProposalUploadForm.tsx + /api/pet-design/upload) — a
// serverless function's request body is capped around 4.5MB, too small for
// several full-res design images, so this route only ever receives the
// resulting URLs, never the image bytes themselves.

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const request = await prisma.petDesignRequest.findUnique({ where: { id } });
  if (!request) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await req.json();
  const newUrls = Array.isArray(body.imageUrls) ? body.imageUrls.filter((u: unknown) => typeof u === 'string') : [];

  if (newUrls.length === 0) {
    return NextResponse.json({ error: 'At least one design image is required' }, { status: 400 });
  }
  if (!newUrls.every((url: string) => {
    try {
      return new URL(url).hostname.endsWith('.public.blob.vercel-storage.com');
    } catch {
      return false;
    }
  })) {
    return NextResponse.json({ error: 'Invalid image reference' }, { status: 400 });
  }

  const previousUrls = request.proposalImageUrls;

  const updated = await prisma.petDesignRequest.update({
    where: { id },
    data: {
      proposalImageUrls: { push: newUrls },
      status: 'proposals_sent',
    },
  });

  // Inline thumbnails so the email doesn't have to pull full-res images.
  // Fall back to the full-size URL if resizing fails.
  const allThumbs = await Promise.all(
    [...previousUrls, ...newUrls].map((url) => urlToThumbUrl(url).catch(() => url)),
  );

  const approveUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/pet-coasters/approve/${updated.approvalToken}`;
  const thumbs = allThumbs
    .map((src) => `<img src="${src}" alt="" style="width:120px;height:120px;object-fit:cover;border-radius:8px;margin:4px;" />`)
    .join('');

  await brevoSend(
    updated.customerEmail,
    'Your pet coaster designs are ready! 🐾',
    `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0a0a0a;color:#e5e5e5;padding:32px;max-width:600px;">
        <h2 style="color:#fff;margin:0 0 16px;">Take a look!</h2>
        <p>We put together a few design options based on your pet's photo. Here's a preview:</p>
        <div style="display:flex;flex-wrap:wrap;margin:16px 0;">${thumbs}</div>
        <p>Head over to the link below to build your 4-coaster set — mix and match any combination of these designs.</p>
        <p style="margin-top:24px;">
          <a href="${approveUrl}" style="display:inline-block;background:#c81e2c;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:700;">
            Build my coaster set →
          </a>
        </p>
      </div>
    `,
  );

  return NextResponse.json({ ok: true });
}
