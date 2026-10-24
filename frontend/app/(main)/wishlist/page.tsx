'use client'

import React from 'react'
import Link from 'next/link'
import { Heart } from 'lucide-react'
import Breadcrumb from '@/components/layout/Breadcrumb'
import ProductCard from '@/components/product/ProductCard'
import { useStore } from '@/lib/store/useStore'

export default function WishlistPage() {
  const locale = useStore((s) => s.locale)
  const products = useStore((s) => s.products)
  const wishlistIds = useStore((s) => s.wishlistIds)

  const savedProducts = products.filter((p) => wishlistIds.includes(p.id))

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <Breadcrumb
        items={[{ label: locale === 'fa' ? 'لیست علاقه‌مندی‌ها' : 'Wishlist' }]}
      />

      <h1 className="text-2xl sm:text-4xl font-black text-white">
        {locale === 'fa' ? 'کلکسیون منتخب من' : 'Saved Wishlist'}
      </h1>

      {savedProducts.length === 0 ? (
        <div className="glass-panel rounded-3xl p-14 text-center space-y-4 border border-white/10">
          <Heart className="w-12 h-12 text-rose-400 mx-auto" />
          <p className="text-base text-slate-300">
            {locale === 'fa'
              ? 'هنوز محصولی به کلکسیون علاقه‌مندی‌های خود اضافه نکرده‌اید.'
              : 'Your wishlist is currently empty.'}
          </p>
          <Link
            href="/products"
            className="inline-flex px-6 py-3 rounded-2xl bg-amber-400 text-slate-950 font-black text-xs"
          >
            {locale === 'fa' ? 'کاوش در فروشگاه سه‌بعدی' : 'Explore 3D Store'}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {savedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}
