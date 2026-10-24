import { NextResponse } from 'next/server'
import { PRODUCTS } from '@/lib/data/catalog'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const search = searchParams.get('search')

  let results = [...PRODUCTS]
  if (category && category !== 'all') {
    results = results.filter((p) => p.category.slug === category)
  }
  if (search) {
    const q = search.toLowerCase()
    results = results.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.name_fa.toLowerCase().includes(q)
    )
  }

  return NextResponse.json({
    items: results,
    total: results.length,
  })
}
