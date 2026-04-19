import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import fs from 'fs';
import path from 'path';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia' as any,
});

// ─── Stick family preview compositor ─────────────────────────────────────────

const SF_VARIANTS: Record<string, { heightRatio: number; aspect: number }> = {
  'adult-male':   { heightRatio: 1.00, aspect: 0.5 },
  'adult-female': { heightRatio: 1.00, aspect: 0.5 },
  'teen-male':    { heightRatio: 0.82, aspect: 0.5 },
  'teen-female':  { heightRatio: 0.82, aspect: 0.5 },
  'kid-male':     { heightRatio: 0.65, aspect: 0.5 },
  'kid-female':   { heightRatio: 0.65, aspect: 0.5 },
  'infant':       { heightRatio: 0.58, aspect: 1.0 },
  'dog':          { heightRatio: 0.62, aspect: 1.0 },
  'cat':          { heightRatio: 0.58, aspect: 1.0 },
};

function compositeStickFamilySvg(encoded: string): string {
  const slots = encoded.split('|').map((s) => {
    const [line, variant, halo] = s.split(':');
    return { line, variant, halo: halo === '1' };
  });

  const SIZE = 400;
  const PAD = Math.round(SIZE * 0.07);
  const ROW_GAP = Math.round(SIZE * 0.02);
  const MAX_PER_ROW = 4;
  const usable = SIZE - PAD * 2;
  const numRows = slots.length <= 4 ? 1 : slots.length <= 8 ? 2 : 3;
  const perRowH = (usable - ROW_GAP * (numRows - 1)) / numRows;
  const perSlotW = usable / MAX_PER_ROW;
  const baseH = Math.min(perRowH, perSlotW / 0.5);

  let images = '';

  for (let ri = 0; ri < numRows; ri++) {
    const row = slots.slice(ri * MAX_PER_ROW, (ri + 1) * MAX_PER_ROW);
    for (let si = 0; si < row.length; si++) {
      const { line, variant, halo } = row[si];
      const vDef = SF_VARIANTS[variant] ?? { heightRatio: 0.7, aspect: 0.5 };
      const figH = Math.min(baseH * vDef.heightRatio, perSlotW / vDef.aspect);
      const figW = figH * vDef.aspect;

      const figX = PAD + si * perSlotW + (perSlotW - figW) / 2;
      const figY = PAD + ri * (baseH + ROW_GAP) + baseH - figH;

      // Load the figure SVG and embed as data URI
      const svgFilePath = path.join(process.cwd(), 'public', 'stick-figure', line, `${variant}.svg`);
      let dataUri = '';
      try {
        const raw = fs.readFileSync(svgFilePath, 'utf-8');
        dataUri = `data:image/svg+xml;base64,${Buffer.from(raw).toString('base64')}`;
      } catch {
        // File not generated yet — skip silently
      }

      if (dataUri) {
        images += `<image href="${dataUri}" x="${figX.toFixed(1)}" y="${figY.toFixed(1)}" width="${figW.toFixed(1)}" height="${figH.toFixed(1)}"/>\n`;
      }

      if (halo) {
        const hw = figH * 0.38;
        const hh = figH * 0.12;
        const cx = figX + figW / 2;
        const cy = figY - hh / 2 - 4;
        images += `<ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="${(hw / 2 * 0.875).toFixed(1)}" ry="${(hh / 2 * 0.75).toFixed(1)}" fill="none" stroke="#000" stroke-width="${(SIZE * 0.006).toFixed(1)}"/>\n`;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <rect width="${SIZE}" height="${SIZE}" fill="white"/>
  <rect x="3" y="3" width="${SIZE - 6}" height="${SIZE - 6}" fill="none" stroke="#000" stroke-width="5" rx="12"/>
  ${images}</svg>`;
}

async function buildStickFamilyPng(encoded: string): Promise<Buffer | null> {
  try {
    const sharp = (await import('sharp')).default;
    const svg = compositeStickFamilySvg(encoded);
    return await sharp(Buffer.from(svg)).png().toBuffer();
  } catch (err) {
    console.error('[stick-family] PNG render failed:', err);
    return null;
  }
}

// ─── Email sender ─────────────────────────────────────────────────────────────

async function brevoSend(
  to: string,
  subject: string,
  htmlContent: string,
  attachments?: { content: string; name: string }[],
) {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO_API_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: '3DPress USA', email: 'orders@3dpressusa.com' },
      to: [{ email: to }],
      subject,
      htmlContent,
      ...(attachments?.length ? { attachment: attachments } : {}),
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '(unreadable)');
    console.error(`[brevo] ${res.status} sending to ${to}: ${body}`);
  }
}

async function sendFulfillmentEmail(session: Stripe.Checkout.Session, lineItems: Stripe.LineItem[]) {
  // Build stick family preview PNGs from session metadata (sf_0, sf_1, …)
  const sfAttachments: { content: string; name: string }[] = [];
  const meta = session.metadata ?? {};
  const sfKeys = Object.keys(meta).filter((k) => k.startsWith('sf_')).sort();
  for (const key of sfKeys) {
    const png = await buildStickFamilyPng(meta[key]);
    if (png) {
      const idx = sfKeys.length > 1 ? `_${key.slice(3)}` : '';
      sfAttachments.push({ content: png.toString('base64'), name: `stick-family-preview${idx}.png` });
    }
  }
  const customer = session.customer_details;
  const shipping = session.collected_information?.shipping_details;
  const addr = shipping?.address;

  const itemRows = lineItems
    .map((item) => `
      <tr>
        <td style="padding:6px 12px;border-bottom:1px solid #333;">${item.description}</td>
        <td style="padding:6px 12px;border-bottom:1px solid #333;text-align:center;">${item.quantity}</td>
        <td style="padding:6px 12px;border-bottom:1px solid #333;text-align:right;">$${((item.amount_total ?? 0) / 100).toFixed(2)}</td>
      </tr>`)
    .join('');

  const html = `
    <div style="font-family:monospace;background:#0a0a0a;color:#e5e5e5;padding:32px;max-width:600px;">
      <h2 style="color:#fff;margin:0 0 24px;">🖨 New Order — Print Queue</h2>

      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <thead>
          <tr style="background:#1a1a1a;">
            <th style="padding:8px 12px;text-align:left;color:#999;font-weight:normal;">Item</th>
            <th style="padding:8px 12px;text-align:center;color:#999;font-weight:normal;">Qty</th>
            <th style="padding:8px 12px;text-align:right;color:#999;font-weight:normal;">Total</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>

      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <tr>
          <td style="padding:4px 0;color:#999;">Order ID</td>
          <td style="padding:4px 0;text-align:right;">${session.id}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;color:#999;">Charged</td>
          <td style="padding:4px 0;text-align:right;">$${((session.amount_total ?? 0) / 100).toFixed(2)}</td>
        </tr>
      </table>

      <div style="background:#1a1a1a;border-radius:8px;padding:16px;margin-bottom:24px;">
        <div style="color:#999;font-size:12px;margin-bottom:8px;">SHIP TO</div>
        <div>${shipping?.name ?? customer?.name ?? '—'}</div>
        <div>${addr?.line1 ?? ''}</div>
        ${addr?.line2 ? `<div>${addr.line2}</div>` : ''}
        <div>${addr?.city ?? ''}, ${addr?.state ?? ''} ${addr?.postal_code ?? ''}</div>
      </div>

      <div style="background:#1a1a1a;border-radius:8px;padding:16px;">
        <div style="color:#999;font-size:12px;margin-bottom:8px;">CUSTOMER</div>
        <div>${customer?.name ?? '—'}</div>
        <div><a href="mailto:${customer?.email}" style="color:#60a5fa;">${customer?.email ?? '—'}</a></div>
      </div>
    </div>
  `;

  await brevoSend(
    'fulfillment@3dpressusa.com',
    `New Order: ${lineItems.map((i) => i.description).join(', ')} — ${shipping?.name ?? customer?.name ?? 'Customer'}`,
    html,
    sfAttachments,
  );
}

async function sendCustomerEmail(session: Stripe.Checkout.Session, lineItems: Stripe.LineItem[]) {
  const customer = session.customer_details;
  if (!customer?.email) return;

  const shipping = session.collected_information?.shipping_details;
  const addr = shipping?.address;
  const firstName = (shipping?.name ?? customer.name ?? 'Patriot').split(' ')[0];

  const totalCaps = lineItems.reduce((sum, i) => sum + (i.quantity ?? 0), 0);

  const bundleNote = totalCaps >= 5
    ? `<div style="background:#1a2a1a;border:1px solid #2d5a2d;border-radius:8px;padding:14px 16px;margin-bottom:24px;color:#86efac;">
        <strong>5-cap bundle price applied</strong> — you saved $${totalCaps * 2} off single-unit pricing. That's the move.
      </div>`
    : totalCaps >= 3
    ? `<div style="background:#1a2a1a;border:1px solid #2d5a2d;border-radius:8px;padding:14px 16px;margin-bottom:24px;color:#86efac;">
        <strong>3-cap bundle price applied</strong> — you saved $${totalCaps} off single-unit pricing.
      </div>`
    : '';

  const itemRows = lineItems
    .map((item) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #222;color:#e5e5e5;">${item.description}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #222;text-align:center;color:#999;">${item.quantity}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #222;text-align:right;color:#e5e5e5;">
          $${((item.amount_total ?? 0) / 100).toFixed(2)}
        </td>
      </tr>`)
    .join('');

  const shippingCents = session.total_details?.amount_shipping ?? 0;
  const taxCents = session.total_details?.amount_tax ?? 0;

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0a0a0a;color:#e5e5e5;margin:0;padding:0;">
      <div style="max-width:600px;margin:0 auto;padding:40px 24px;">

        <!-- Header -->
        <div style="text-align:center;margin-bottom:40px;">
          <div style="font-size:28px;font-weight:900;letter-spacing:-0.5px;margin-bottom:4px;">
            <span style="color:#ffffff;">3DPress</span><span style="color:#ef4444;">U</span><span style="color:#ffffff;">S</span><span style="color:#3b82f6;">A</span>
          </div>
          <div style="color:#555;font-size:12px;letter-spacing:0.2em;text-transform:uppercase;">Made in America · Built to Last</div>
        </div>

        <!-- Hero message -->
        <div style="background:#111;border:1px solid #222;border-radius:16px;padding:32px;margin-bottom:32px;text-align:center;">
          <div style="font-size:40px;margin-bottom:16px;">🇺🇸</div>
          <h1 style="color:#fff;font-size:24px;font-weight:900;margin:0 0 12px;">Order confirmed, ${firstName}.</h1>
          <p style="color:#999;font-size:15px;line-height:1.6;margin:0;">
            Your order is in the queue. Every cap is printed to order right here in the USA —
            no inventory, no overseas factories, no compromises. We'll get yours on the printer as soon as possible.
          </p>
        </div>

        ${bundleNote}

        <!-- Order details -->
        <div style="background:#111;border:1px solid #222;border-radius:16px;overflow:hidden;margin-bottom:24px;">
          <div style="padding:16px 20px;border-bottom:1px solid #222;">
            <span style="font-size:11px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#666;">Your Order</span>
          </div>
          <table style="width:100%;border-collapse:collapse;">
            <tbody>${itemRows}</tbody>
          </table>
          <div style="padding:12px 20px;border-top:1px solid #222;display:flex;justify-content:space-between;">
            <table style="width:100%;border-collapse:collapse;">
              ${shippingCents > 0 ? `
              <tr>
                <td style="padding:4px 0;color:#666;font-size:13px;">Shipping</td>
                <td style="padding:4px 0;text-align:right;color:#999;font-size:13px;">$${(shippingCents / 100).toFixed(2)}</td>
              </tr>` : `
              <tr>
                <td style="padding:4px 0;color:#666;font-size:13px;">Shipping</td>
                <td style="padding:4px 0;text-align:right;color:#86efac;font-size:13px;font-weight:700;">FREE</td>
              </tr>`}
              ${taxCents > 0 ? `
              <tr>
                <td style="padding:4px 0;color:#666;font-size:13px;">Tax</td>
                <td style="padding:4px 0;text-align:right;color:#999;font-size:13px;">$${(taxCents / 100).toFixed(2)}</td>
              </tr>` : ''}
              <tr>
                <td style="padding:8px 0 4px;color:#fff;font-weight:700;">Total charged</td>
                <td style="padding:8px 0 4px;text-align:right;color:#fff;font-weight:700;font-size:18px;">$${((session.amount_total ?? 0) / 100).toFixed(2)}</td>
              </tr>
            </table>
          </div>
        </div>

        <!-- Ship to -->
        <div style="background:#111;border:1px solid #222;border-radius:16px;padding:20px;margin-bottom:24px;">
          <div style="font-size:11px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#666;margin-bottom:12px;">Shipping To</div>
          <div style="color:#e5e5e5;line-height:1.8;">
            <div style="font-weight:600;">${shipping?.name ?? customer.name ?? ''}</div>
            <div style="color:#999;">${addr?.line1 ?? ''}</div>
            ${addr?.line2 ? `<div style="color:#999;">${addr.line2}</div>` : ''}
            <div style="color:#999;">${addr?.city ?? ''}, ${addr?.state ?? ''} ${addr?.postal_code ?? ''}</div>
          </div>
        </div>

        <!-- What's next -->
        <div style="background:#111;border:1px solid #222;border-radius:16px;padding:20px;margin-bottom:32px;">
          <div style="font-size:11px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#666;margin-bottom:16px;">What Happens Next</div>
          <div style="display:flex;flex-direction:column;gap:12px;">
            <div style="display:flex;gap:12px;align-items:flex-start;">
              <div style="background:#1a1a1a;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0;text-align:center;line-height:28px;">🖨</div>
              <div>
                <div style="font-weight:600;font-size:14px;">Printing</div>
                <div style="color:#666;font-size:13px;">Your caps go on the printer as soon as we get your order. Each one is printed fresh — no shelf stock.</div>
              </div>
            </div>
            <div style="display:flex;gap:12px;align-items:flex-start;">
              <div style="background:#1a1a1a;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0;text-align:center;line-height:28px;">📦</div>
              <div>
                <div style="font-weight:600;font-size:14px;">Ships via USPS</div>
                <div style="color:#666;font-size:13px;">You'll get a tracking number by email once it's in the mail.</div>
              </div>
            </div>
            <div style="display:flex;gap:12px;align-items:flex-start;">
              <div style="background:#1a1a1a;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0;text-align:center;line-height:28px;">🚗</div>
              <div>
                <div style="font-weight:600;font-size:14px;">Roll proud</div>
                <div style="color:#666;font-size:13px;">Snap your faceplate on and represent. Thanks for keeping it American.</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div style="text-align:center;color:#444;font-size:12px;line-height:1.8;">
          <div>Questions? Reply to this email or reach us at <a href="mailto:info@3dpressusa.com" style="color:#666;">info@3dpressusa.com</a></div>
          <div style="margin-top:8px;">Order ID: <span style="font-family:monospace;color:#555;">${session.id}</span></div>
          <div style="margin-top:16px;font-size:11px;color:#333;">3DPress USA · Made to Order · Printed in America</div>
        </div>

      </div>
    </div>
  `;

  await brevoSend(
    customer.email,
    `Your 3DPress USA order is confirmed 🇺🇸`,
    html
  );
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('[webhook] constructEvent failed:', err);
    console.error('[webhook] sig header:', sig);
    console.error('[webhook] secret length:', process.env.STRIPE_WEBHOOK_SECRET?.length);
    console.error('[webhook] body length:', body.length);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const { data: lineItems } = await stripe.checkout.sessions.listLineItems(session.id, { limit: 100 });
    await Promise.all([
      sendFulfillmentEmail(session, lineItems),
      sendCustomerEmail(session, lineItems),
    ]);
  }

  return NextResponse.json({ received: true });
}
