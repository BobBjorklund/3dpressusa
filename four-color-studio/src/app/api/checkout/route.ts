import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { calculateCart } from '@/lib/storefront/pricing';
import type { CartItem } from '@/lib/storefront/pricing-config';
import { orderWeightG, groundAdvantageCents, FREE_SHIPPING_THRESHOLD } from '@/lib/storefront/shipping';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Entry point for "Checkout" in the cart drawer (see BuyButton.tsx). Takes
// the client's cart, re-prices it server-side with calculateCart (never
// trust client-computed totals), estimates shipping weight/cost, and creates
// a Stripe Checkout Session. Stripe redirects the customer to `url` to pay;
// once paid, Stripe calls /api/webhook (webhook/route.ts) to actually
// fulfill the order (send emails) — this route never sends anything itself.

export async function POST(req: NextRequest) {
  const body = await req.json();
  const items: CartItem[] = body.items;
  const displayNames: Record<string, string> = body.displayNames ?? {};
  const stickFamilyConfigs: Record<string, string> = body.stickFamilyConfigs ?? {};
  const petCoasterConfigs: Record<string, string> = body.petCoasterConfigs ?? {};

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
  }

  const VALID_TYPES = new Set(['cap', 'cover', 'coaster', 'petCoaster']);
  const VALID_PRICING = new Set(['standard', 'hero', 'patriotic', 'custom']);
  for (const item of items) {
    if (!VALID_TYPES.has(item.type)) {
      return NextResponse.json({ error: 'Invalid item type' }, { status: 400 });
    }
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 50) {
      return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 });
    }
    if (item.pricingType && !VALID_PRICING.has(item.pricingType)) {
      return NextResponse.json({ error: 'Invalid pricing type' }, { status: 400 });
    }
  }

  const { breakdown, subtotal } = calculateCart(items);
  const weightG = orderWeightG(items);
  const standardCents = groundAdvantageCents(weightG);
  const freeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;

  const line_items = breakdown.map((b: any) => ({
    price_data: {
      currency: 'usd',
      product_data: { name: (displayNames[b.id] ?? b.id).slice(0, 250) },
      unit_amount: Math.round(b.unitPrice * 100),
    },
    quantity: b.quantity,
  }));

  const DAY = 'business_day' as const;
  const FIXED = 'fixed_amount' as const;

  const shipping_options = [
    freeShipping
      ? {
          shipping_rate_data: {
            type: FIXED,
            fixed_amount: { amount: 0, currency: 'usd' },
            display_name: 'Free Shipping (USPS Ground Advantage)',
            delivery_estimate: {
              minimum: { unit: DAY, value: 5 },
              maximum: { unit: DAY, value: 7 },
            },
          },
        }
      : {
          shipping_rate_data: {
            type: FIXED,
            fixed_amount: { amount: standardCents, currency: 'usd' },
            display_name: 'Standard (USPS Ground Advantage)',
            delivery_estimate: {
              minimum: { unit: DAY, value: 5 },
              maximum: { unit: DAY, value: 7 },
            },
          },
        },
  ];

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items,
    shipping_address_collection: { allowed_countries: ['US'] },
    shipping_options,
    automatic_tax: { enabled: true },
    success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/collections`,
    metadata: { ...stickFamilyConfigs, ...petCoasterConfigs },
  });

  return NextResponse.json({ url: session.url });
}
