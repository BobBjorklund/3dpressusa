import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { brevoSend } from "@/lib/email";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { carrier, trackingNumber } = await req.json();

  if (typeof carrier !== "string" || typeof trackingNumber !== "string" || !trackingNumber.trim()) {
    return NextResponse.json({ error: "carrier and trackingNumber are required" }, { status: 400 });
  }

  const order = await prisma.order.update({
    where: { id },
    data: {
      status: "shipped",
      trackingCarrier: carrier,
      trackingNumber: trackingNumber.trim(),
      shippedAt: new Date(),
    },
  });

  const trackingUrl =
    carrier === "USPS"
      ? `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encodeURIComponent(order.trackingNumber!)}`
      : null;

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0a0a0a;color:#e5e5e5;padding:32px;max-width:600px;">
      <h2 style="color:#fff;margin:0 0 16px;">Your order has shipped! 📦</h2>
      <p>Good news — your 3DPress USA order is on its way.</p>
      <div style="background:#111;border:1px solid #222;border-radius:12px;padding:20px;margin:24px 0;">
        <div style="color:#666;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px;">Carrier</div>
        <div style="color:#fff;font-size:16px;margin-bottom:16px;">${order.trackingCarrier}</div>
        <div style="color:#666;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px;">Tracking Number</div>
        <div style="color:#fff;font-size:16px;font-family:monospace;">${order.trackingNumber}</div>
      </div>
      ${
        trackingUrl
          ? `<p><a href="${trackingUrl}" style="display:inline-block;background:#c81e2c;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;">Track Your Package →</a></p>`
          : ""
      }
      <p style="margin-top:24px;color:#999;font-size:13px;">Questions? Reply to this email or reach us at <a href="mailto:info@3dpressusa.com" style="color:#60a5fa;">info@3dpressusa.com</a></p>
    </div>
  `;

  await brevoSend(order.customerEmail, "Your order has shipped! 📦", html);

  return NextResponse.json({ ok: true });
}
