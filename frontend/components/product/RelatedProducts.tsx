'use client'

import React from 'react'
import { Product } from '@/types'
import { useStore } from '@/lib/store/useStore'
import ProductCard from './ProductCard'

export default function RelatedProducts({ currentProduct }: { currentProduct: Product }) {
  const locale = useStore((s) => s.locale)
  const products = useStore((s) => s.products)

  const related = products
    .filter((p) => p.id !== currentProduct.id)
    .sort(
      (a, b) =>
        Number(b.category.id === currentProduct.category.id) -
        Number(a.category.id === currentProduct.category.id)
    )
    .slice(0, 4)

  return (
    <section className="space-y-6">
      <h2 className="text-xl sm:text-2xl font-bold text-[#f2f2f0]">
        {locale === 'fa' ? 'محصولات مشابه' : 'Related Products'}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {related.map((item) => (
          <ProductCard key={item.id} product={item} />
        ))}
      </div>
    </section>
  )
}
