import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { brevoSend } from '@/lib/email';
import type { PetDesignMessage } from '@/components/MessageThread';

// Shared Q&A thread route for a request — used by both the admin detail page
// (cookie-gated, posts as "admin") and the customer approval page
// (token-gated, posts as "customer"). Either side posting notifies the
// other by email so nobody has to reply manually outside the app.

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const text = typeof body.body === 'string' ? body.body.trim() : '';
  if (!text) {
    return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 });
  }

  const request = await prisma.petDesignRequest.findUnique({ where: { id } });
  if (!request) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const admin = await isAdmin();
  const from: PetDesignMessage['from'] = admin ? 'admin' : 'customer';

  if (!admin) {
    if (typeof body.token !== 'string' || body.token !== request.approvalToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const message: PetDesignMessage = { from, body: text, createdAt: new Date().toISOString() };
  const messages = [...(request.messages as unknown as PetDesignMessage[]), message];

  await prisma.petDesignRequest.update({ where: { id }, data: { messages } });

  if (from === 'admin') {
    const approveUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/pet-coasters/approve/${request.approvalToken}`;
    await brevoSend(
      request.customerEmail,
      'A note about your pet coaster design',
      `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0a0a0a;color:#e5e5e5;padding:32px;max-width:600px;">
          <h2 style="color:#fff;margin:0 0 16px;">A quick note from us</h2>
          <p style="white-space:pre-wrap;">${text}</p>
          <p style="margin-top:24px;">
            <a href="${approveUrl}" style="color:#60a5fa;">Reply on your design page →</a>
          </p>
        </div>
      `,
    );
  } else {
    const adminUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/pet-design/${request.id}`;
    await brevoSend(
      'petcoasters@3dpressusa.com',
      `New reply from ${request.customerName ?? request.customerEmail}`,
      `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0a0a0a;color:#e5e5e5;padding:32px;max-width:600px;">
          <h2 style="color:#fff;margin:0 0 16px;">New reply</h2>
          <p style="white-space:pre-wrap;">${text}</p>
          <p style="margin-top:24px;">
            <a href="${adminUrl}" style="color:#60a5fa;">View request →</a>
          </p>
        </div>
      `,
    );
  }

  return NextResponse.json({ ok: true, messages });
}
