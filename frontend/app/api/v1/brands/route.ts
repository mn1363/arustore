import { NextResponse } from 'next/server'
import { BRANDS } from '@/lib/data/catalog'

export async function GET() {
  return NextResponse.json({
    items: BRANDS,
    total: BRANDS.length,
  })
}
