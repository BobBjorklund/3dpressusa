import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Token-gated (not admin-key gated) — the approval token, emailed privately
// to the customer, is the auth for this route, same trust model as the
// approval page itself.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { token, selections } = body;

  if (typeof token !== 'string') {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 });
  }
  if (!Array.isArray(selections) || selections.length !== 4) {
    return NextResponse.json({ error: 'Pick a design for all 4 coasters' }, { status: 400 });
  }

  const request = await prisma.petDesignRequest.findUnique({ where: { id } });
  if (!request || request.approvalToken !== token) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 403 });
  }
  if (!selections.every((url) => typeof url === 'string' && request.proposalImageUrls.includes(url))) {
    return NextResponse.json({ error: 'Invalid design selection' }, { status: 400 });
  }

  await prisma.petDesignRequest.update({
    where: { id },
    data: { approvedSelections: selections, status: 'approved' },
  });

  return NextResponse.json({ ok: true });
}
