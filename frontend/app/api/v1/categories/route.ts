import { NextResponse } from 'next/server'
import { CATEGORIES } from '@/lib/data/catalog'

export async function GET() {
  return NextResponse.json({
    items: CATEGORIES,
    total: CATEGORIES.length,
  })
}
