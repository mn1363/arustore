'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react'
import Breadcrumb from '@/components/layout/Breadcrumb'
import Card3DTilt from '@/components/ui/Card3DTilt'
import { CATEGORIES } from '@/lib/data/catalog'
import { useStore } from '@/lib/store/useStore'
import { formatNumber } from '@/lib/utils'

export default function CategoriesPage() {
  const locale = useStore((s) => s.locale)
  const DirArrow = locale === 'fa' ? ArrowLeft : ArrowRight

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      <Breadcrumb
        items={[{ label: locale === 'fa' ? 'دسته‌بندی‌های سه‌بعدی' : '3D Categories' }]}
      />

      <div className="space-y-2 max-w-2xl">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{locale === 'fa' ? 'جهان‌های تخصصی آرو استور' : 'CURATED WORLDS'}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white">
          {locale === 'fa'
            ? 'دسته‌بندی محصولات در فضای سه‌بعدی'
            : 'Explore Spatial Product Worlds'}
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {CATEGORIES.map((cat) => (
          <Link key={cat.id} href={`/products?category=${cat.slug}`}>
            <Card3DTilt
              glowColor={`${cat.accent}35`}
              className="glass-panel rounded-[2.2rem] p-8 border border-white/10 hover:border-amber-400/40 flex flex-col sm:flex-row items-center gap-6 group overflow-hidden h-full"
            >
              <div
                className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${cat.gradient} opacity-65 group-hover:opacity-100 transition-opacity`}
              />

              <div className="relative z-10 w-44 h-44 flex-shrink-0 flex items-center justify-center translate-z-20">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-500 drop-shadow-[0_24px_36px_rgba(0,0,0,0.85)]"
                />
              </div>

              <div className="relative z-10 space-y-3 text-center sm:text-start flex-1">
                <span
                  className="inline-block text-xs font-bold px-3 py-1 rounded-full border"
                  style={{
                    color: cat.accent,
                    borderColor: `${cat.accent}45`,
                    backgroundColor: `${cat.accent}15`,
                  }}
                >
                  {formatNumber(cat.product_count, locale)}{' '}
                  {locale === 'fa' ? 'مدل پرچمدار' : 'Flagship Models'}
                </span>
                <h2 className="text-2xl font-black text-white">
                  {locale === 'fa' ? cat.name_fa : cat.name}
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {locale === 'fa' ? cat.description_fa : cat.description}
                </p>
                <div className="pt-1 inline-flex items-center gap-2 text-xs font-extrabold text-amber-300 group-hover:text-white">
                  <span>
                    {locale === 'fa' ? 'ورود به این دسته‌بندی' : 'Explore Collection'}
                  </span>
                  <DirArrow className="w-4 h-4" />
                </div>
              </div>
            </Card3DTilt>
          </Link>
        ))}
      </div>
    </div>
  )
}
