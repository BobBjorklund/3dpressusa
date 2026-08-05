// Shared Brevo transactional-email sender — used by the Stripe webhook
// (order confirmation/fulfillment emails) and the pet-coasters flow
// (submission/proposal/approval emails). One implementation so every sender
// hits the same API the same way.

export async function brevoSend(
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
