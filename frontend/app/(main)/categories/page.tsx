'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import Breadcrumb from '@/components/layout/Breadcrumb'
import { CATEGORIES } from '@/lib/data/catalog'
import { useStore } from '@/lib/store/useStore'
import { formatNumber } from '@/lib/utils'

export default function CategoriesPage() {
  const locale = useStore((s) => s.locale)
  const DirArrow = locale === 'fa' ? ArrowLeft : ArrowRight

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <Breadcrumb
        items={[{ label: locale === 'fa' ? 'مجموعه‌ها' : 'Collections' }]}
      />

      <h1 className="text-2xl sm:text-4xl font-bold text-[#f2f2f0]">
        {locale === 'fa' ? 'مجموعه‌های ظروف پذیرایی' : 'Servingware Collections'}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.id}
            href={`/products?category=${cat.slug}`}
            className="group rounded-2xl bg-[#14161a] border border-white/[0.07] hover:border-white/[0.18] overflow-hidden transition-colors"
          >
            <div className="h-64 overflow-hidden bg-[#121317]">
              <img
                src={cat.image}
                alt={cat.name_fa}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="p-6 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-[#f2f2f0] group-hover:text-[#d6b88a] transition-colors">
                  {locale === 'fa' ? cat.name_fa : cat.name}
                </h2>
                <span className="text-xs text-[#8e93a0] mt-1 block">
                  {formatNumber(cat.product_count, locale)}{' '}
                  {locale === 'fa' ? 'محصول' : 'Products'}
                </span>
              </div>
              <DirArrow className="w-5 h-5 text-[#7d828f] group-hover:text-[#d6b88a] transition-colors" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
