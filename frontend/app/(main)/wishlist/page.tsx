'use client'

import React from 'react'
import Link from 'next/link'
import { Heart } from 'lucide-react'
import Breadcrumb from '@/components/layout/Breadcrumb'
import ProductCard from '@/components/product/ProductCard'
import { useStore } from '@/lib/store/useStore'
import { getDict } from '@/lib/data/i18n'

export default function WishlistPage() {
  const locale = useStore((s) => s.locale)
  const products = useStore((s) => s.products)
  const wishlistIds = useStore((s) => s.wishlistIds)
  const dict = getDict(locale)

  const items = products.filter((p) => wishlistIds.includes(p.id))

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <Breadcrumb items={[{ label: dict.nav.wishlist }]} />

      <h1 className="text-2xl sm:text-3xl font-bold text-[#f4f4f6]">
        {dict.nav.wishlist}
      </h1>

      {items.length === 0 ? (
        <div className="rounded-3xl surface-level-1 p-14 text-center space-y-5">
          <Heart className="w-10 h-10 text-[#666e82] mx-auto" />
          <p className="text-base font-bold text-[#f4f4f6]">
            {locale === 'fa'
              ? 'لیست علاقه‌مندی‌ها خالی است'
              : 'Your wishlist is empty'}
          </p>
          <Link
            href="/products"
            className="inline-flex px-6 py-3 rounded-xl champagne-btn font-bold text-sm"
          >
            {dict.common.continueShopping}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}
