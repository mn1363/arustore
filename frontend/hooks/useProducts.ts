'use client'

import { useMemo } from 'react'
import { useStore } from '@/lib/store/useStore'

export interface ProductFilterOptions {
  categorySlug?: string
  brandSlugs?: string[]
  colorId?: string
  minPrice?: number
  maxPrice?: number
  search?: string
  onlyInStock?: boolean
  onlyOnSale?: boolean
  sortBy?: 'featured' | 'newest' | 'price-asc' | 'price-desc' | 'rating'
}

export function useProducts(filters: ProductFilterOptions = {}) {
  const products = useStore((s) => s.products)

  const filtered = useMemo(() => {
    let list = [...products]

    if (filters.categorySlug && filters.categorySlug !== 'all') {
      list = list.filter((p) => p.category.slug === filters.categorySlug)
    }

    if (filters.brandSlugs && filters.brandSlugs.length > 0) {
      list = list.filter((p) => filters.brandSlugs!.includes(p.brand.slug))
    }

    if (filters.colorId) {
      list = list.filter((p) =>
        p.colors.some((c) => c.id.includes(filters.colorId!) || c.accentHex === filters.colorId)
      )
    }

    if (typeof filters.minPrice === 'number') {
      list = list.filter((p) => p.price >= filters.minPrice!)
    }

    if (typeof filters.maxPrice === 'number') {
      list = list.filter((p) => p.price <= filters.maxPrice!)
    }

    if (filters.onlyInStock) {
      list = list.filter((p) => p.stock_quantity > 0)
    }

    if (filters.onlyOnSale) {
      list = list.filter((p) => Boolean(p.compare_price && p.compare_price > p.price))
    }

    if (filters.search && filters.search.trim()) {
      const q = filters.search.trim().toLowerCase()
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.name_fa.toLowerCase().includes(q) ||
          p.subtitle.toLowerCase().includes(q) ||
          p.subtitle_fa.toLowerCase().includes(q) ||
          p.brand.name.toLowerCase().includes(q) ||
          p.brand.name_fa.toLowerCase().includes(q) ||
          p.category.name_fa.toLowerCase().includes(q)
      )
    }

    switch (filters.sortBy) {
      case 'price-asc':
        list.sort((a, b) => a.price - b.price)
        break
      case 'price-desc':
        list.sort((a, b) => b.price - a.price)
        break
      case 'rating':
        list.sort((a, b) => b.rating_avg - a.rating_avg)
        break
      case 'newest':
        list.sort((a, b) => Number(Boolean(b.is_new)) - Number(Boolean(a.is_new)) || b.id - a.id)
        break
      case 'featured':
      default:
        list.sort((a, b) => Number(Boolean(b.is_featured)) - Number(Boolean(a.is_featured)))
        break
    }

    return list
  }, [
    products,
    filters.categorySlug,
    filters.brandSlugs,
    filters.colorId,
    filters.minPrice,
    filters.maxPrice,
    filters.onlyInStock,
    filters.onlyOnSale,
    filters.search,
    filters.sortBy,
  ])

  return { products: filtered, total: filtered.length, allProducts: products }
}

export default useProducts
