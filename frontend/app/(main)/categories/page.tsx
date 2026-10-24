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
        items={[{ label: locale === 'fa' ? 'دسته‌بندی‌ها' : 'Collections' }]}
      />

      <h1 className="font-editorial text-3xl sm:text-4xl font-extrabold text-[#f7f4ee]">
        {locale === 'fa' ? 'دسته‌بندی تولیدات آلومینیومی' : 'Aluminum Servingware Categories'}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.id}
            href={`/products?category=${cat.slug}`}
            className="group relative h-72 overflow-hidden border border-[#ece6dc]/16 bg-[#141210]"
          >
            <img
              src={cat.image}
              alt={cat.name_fa}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0d0c0a]/92 via-[#0d0c0a]/30 to-transparent" />
            <div className="absolute bottom-5 inset-x-6 flex items-end justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-[#dfc08e]">
                  {formatNumber(cat.product_count, locale)}{' '}
                  {locale === 'fa' ? 'مدل تولیدی' : 'Models'}
                </span>
                <h2 className="font-editorial text-2xl sm:text-3xl font-extrabold text-[#f7f4ee] mt-0.5">
                  {locale === 'fa' ? cat.name_fa : cat.name}
                </h2>
              </div>
              <span className="p-2.5 bg-[#11100e]/85 border border-[#ece6dc]/20 text-[#dfc08e] group-hover:bg-[#c59b5f] group-hover:text-[#11100e] transition-colors">
                <DirArrow className="w-4 h-4" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
