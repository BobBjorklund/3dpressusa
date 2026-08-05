import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { put } from '@vercel/blob';
import { isAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { brevoSend } from '@/lib/email';
import { bufferToThumbUrl, urlToThumbUrl } from '@/lib/image';

// Called from the admin detail page (src/app/admin/pet-design/[id]/page.tsx)
// once the shop has generated design proposals externally (ChatGPT/image-gen)
// and is ready to send them to the customer for approval.

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const request = await prisma.petDesignRequest.findUnique({ where: { id } });
  if (!request) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const form = await req.formData();
  const files = form.getAll('images').filter((f): f is File => f instanceof File);

  if (files.length === 0) {
    return NextResponse.json({ error: 'At least one design image is required' }, { status: 400 });
  }
  for (const file of files) {
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: 'Images must be JPG, PNG, or WEBP' }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'Each image must be under 10MB' }, { status: 400 });
    }
  }

  const newBuffers = await Promise.all(files.map((file) => file.arrayBuffer().then(Buffer.from)));

  const uploaded = await Promise.all(
    files.map((file, i) =>
      put(`pet-design/${id}/${randomUUID()}-${file.name}`, newBuffers[i], { access: 'public', contentType: file.type }),
    ),
  );
  const newUrls = uploaded.map((b) => b.url);
  const previousUrls = request.proposalImageUrls;

  const updated = await prisma.petDesignRequest.update({
    where: { id },
    data: {
      proposalImageUrls: { push: newUrls },
      status: 'proposals_sent',
    },
  });

  // Inline thumbnails so the email doesn't have to pull full-res images —
  // resize newly-uploaded ones from the buffer already in memory, and
  // re-fetch+resize any from a previous round (this could be a 2nd round of
  // proposals). Fall back to the full-size URL if resizing fails for either.
  const [previousThumbs, newThumbs] = await Promise.all([
    Promise.all(previousUrls.map((url) => urlToThumbUrl(url).catch(() => url))),
    Promise.all(newBuffers.map((buf, i) => bufferToThumbUrl(buf).catch(() => uploaded[i].url))),
  ]);
  const allThumbs = [...previousThumbs, ...newThumbs];

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
