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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      <Breadcrumb
        items={[{ label: locale === 'fa' ? 'مجموعه‌های تخصصی' : 'Collections' }]}
      />

      <div className="border-b border-[#ece6dc]/14 pb-6 space-y-2 max-w-3xl">
        <div className="font-mono text-[10px] tracking-[0.22em] text-[#c59b5f] uppercase">
          {locale === 'fa' ? 'فهرست تالارهای چهارگانه آرو' : 'ARCHITECTURAL CHAMBERS I — IV'}
        </div>
        <h1 className="font-editorial text-4xl sm:text-6xl font-bold text-[#f7f4ee]">
          {locale === 'fa'
            ? 'چهار مجموعه تخصصی ظروف پذیرایی آلومینیومی'
            : 'Four Cast-Aluminum Servingware Collections'}
        </h1>
      </div>

      <div className="border border-[#ece6dc]/15 divide-y divide-[#ece6dc]/14 bg-[#141210]">
        {CATEGORIES.map((cat, idx) => (
          <Link
            key={cat.id}
            href={`/products?category=${cat.slug}`}
            className="grid grid-cols-1 md:grid-cols-12 items-center gap-8 p-6 sm:p-10 hover:bg-[#1a1714] transition-colors group"
          >
            <div className="md:col-span-2 flex md:flex-col justify-between gap-2">
              <span className="font-editorial text-5xl sm:text-6xl font-bold text-[#c59b5f]/85 leading-none">
                {locale === 'fa' ? `۰${idx + 1}` : `0${idx + 1}`}
              </span>
              <span className="font-mono text-[10px] tracking-widest text-[#8c8377] uppercase">
                {formatNumber(cat.product_count, locale)}{' '}
                {locale === 'fa' ? 'اثر ثبت‌شده' : 'OBJECTS'}
              </span>
            </div>

            <div className="md:col-span-4 flex justify-center">
              <div className="relative w-48 h-44 flex items-center justify-center">
                <div className="pointer-events-none absolute inset-x-4 top-2 bottom-0 arch-niche border border-[#ece6dc]/10 bg-[#100f0d] group-hover:border-[#c59b5f]/40 transition-colors" />
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="relative z-10 max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-500 drop-shadow-[0_22px_30px_rgba(0,0,0,0.8)]"
                />
              </div>
            </div>

            <div className="md:col-span-6 space-y-3">
              <h2 className="font-editorial text-3xl sm:text-4xl font-bold text-[#f7f4ee] group-hover:text-[#dfc08e] transition-colors">
                {locale === 'fa' ? cat.name_fa : cat.name}
              </h2>
              <p className="text-xs sm:text-sm text-[#a89f93] leading-[1.9]">
                {locale === 'fa' ? cat.description_fa : cat.description}
              </p>
              <div className="pt-2 inline-flex items-center gap-2 text-xs font-bold text-[#dfc08e] border-b border-[#c59b5f]/45 pb-1">
                <span>
                  {locale === 'fa' ? 'ورود به این تالار و مشاهده آثار' : 'Enter Collection'}
                </span>
                <DirArrow className="w-4 h-4" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
