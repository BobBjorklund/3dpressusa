import { NextResponse } from 'next/server';
import { getInventoryColors } from '@/lib/inventory-colors';

export async function GET() {
  const colors = await getInventoryColors();
  return NextResponse.json(colors);
}