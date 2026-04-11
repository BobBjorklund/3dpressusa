import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { calculateCart } from '@/lib/storefront/pricing';
import type { CartItem } from '@/lib/storefront/pricing-config';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Unit weights in grams
const WEIGHT_G = { cap: 33, cover: 112 } as const; // cover = base(77) + sock(30) + clip(5)
const PACKAGING_G = 40; // bubble mailer

function orderWeightG(items: CartItem[]): number {
  const itemWeight = items.reduce((sum, item) => {
    const unit = WEIGHT_G[item.type as keyof typeof WEIGHT_G] ?? WEIGHT_G.cap;
    return sum + unit * item.quantity;
  }, 0);
  return itemWeight + PACKAGING_G;
}

// USPS Ground Advantage via Pirateship — conservative rates, never lose money.
// Tweak at: pirateship.com/rate-calculator
function groundAdvantageCents(weightG: number): number {
  const oz = weightG / 28.3495;
  if (oz <=  4) return 450;
  if (oz <=  8) return 500;
  if (oz <= 12) return 550;
  if (oz <= 16) return 600;
  // Over 1 lb
  const lbs = Math.ceil(weightG / 453.592);
  if (lbs <= 2) return 800;
  if (lbs <= 3) return 950;
  if (lbs <= 5) return 1100;
  return 1100 + (lbs - 5) * 150;
}

// Priority Mail small flat rate box — fits any order at this size/weight
const PRIORITY_CENTS = 1040;
const FREE_SHIPPING_THRESHOLD = 50; // dollars

export async function POST(req: NextRequest) {
  const body = await req.json();
  const items: CartItem[] = body.items;
  const displayNames: Record<string, string> = body.displayNames ?? {};

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
  }

  const VALID_TYPES = new Set(['cap', 'cover']);
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
    {
      shipping_rate_data: {
        type: FIXED,
        fixed_amount: { amount: PRIORITY_CENTS, currency: 'usd' },
        display_name: 'Expedited (USPS Priority Mail)',
        delivery_estimate: {
          minimum: { unit: DAY, value: 2 },
          maximum: { unit: DAY, value: 3 },
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
  });

  return NextResponse.json({ url: session.url });
}
