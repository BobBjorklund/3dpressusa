import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-03-25.dahlia" as any,
});

export type OrderDetails = {
  session: Stripe.Checkout.Session;
  lineItems: Stripe.LineItem[];
};

// Hydrates the full order — line items and shipping address — live from
// Stripe by session id. Deliberately NOT stored in the local Order table
// (see prisma/schema.prisma), so this can never drift from what was
// actually charged. Same retrieval shape as src/app/api/webhook/route.ts.
export async function getOrderDetails(stripeSessionId: string): Promise<OrderDetails | null> {
  try {
    const session = await stripe.checkout.sessions.retrieve(stripeSessionId, {
      expand: ["customer_details"],
    });
    const { data: lineItems } = await stripe.checkout.sessions.listLineItems(stripeSessionId, { limit: 100 });
    return { session, lineItems };
  } catch (err) {
    console.error(`[stripe-order] failed to retrieve session ${stripeSessionId}:`, err);
    return null;
  }
}
