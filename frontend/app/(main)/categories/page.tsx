'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import Breadcrumb from '@/components/layout/Breadcrumb'
import Card3DTilt from '@/components/ui/Card3DTilt'
import { CATEGORIES } from '@/lib/data/catalog'
import { useStore } from '@/lib/store/useStore'
import { formatNumber } from '@/lib/utils'

const PORTAL_HALOS = [
  'rgba(223, 192, 142, 0.24)',
  'rgba(126, 166, 224, 0.24)',
  'rgba(217, 155, 92, 0.24)',
  'rgba(94, 194, 166, 0.22)',
]

export default function CategoriesPage() {
  const locale = useStore((s) => s.locale)
  const DirArrow = locale === 'fa' ? ArrowLeft : ArrowRight

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <Breadcrumb
        items={[{ label: locale === 'fa' ? 'مجموعه‌ها' : 'Collections' }]}
      />

      <div className="space-y-2">
        <h1 className="text-2xl sm:text-4xl font-bold text-[#f4f4f6]">
          {locale === 'fa' ? 'تالارهای ظروف پذیرایی آلومینیوم' : 'Servingware Portals'}
        </h1>
        <p className="text-xs sm:text-sm text-[#979fb2]">
          {locale === 'fa'
            ? 'هر مجموعه با هویت فرمی و کاربرد تخصصی برای میزبانی طراحی شده است.'
            : 'Explore each sculpted aluminum servingware collection.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {CATEGORIES.map((cat, idx) => (
          <Card3DTilt key={cat.id} maxTilt={4} className="rounded-3xl">
            <Link
              href={`/products?category=${cat.slug}`}
              className="group relative rounded-3xl card-level-2 overflow-hidden block"
            >
              <div className="relative h-64 overflow-hidden product-pedestal-stage">
                <img
                  src={cat.image}
                  alt={cat.name_fa}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background: `radial-gradient(75% 65% at 50% 100%, ${
                      PORTAL_HALOS[idx % PORTAL_HALOS.length]
                    } 0%, transparent 72%)`,
                  }}
                />
              </div>
              <div className="p-6 flex items-center justify-between gap-4 border-t border-white/[0.07]">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-[#f4f4f6] group-hover:text-[#dfc08e] transition-colors">
                    {locale === 'fa' ? cat.name_fa : cat.name}
                  </h2>
                  <span className="text-xs text-[#979fb2] mt-1 block">
                    {formatNumber(cat.product_count, locale)}{' '}
                    {locale === 'fa' ? 'محصول' : 'Products'}
                  </span>
                </div>
                <span className="w-10 h-10 rounded-xl secondary-3d-btn flex items-center justify-center text-[#dfc08e]">
                  <DirArrow className="w-5 h-5" />
                </span>
              </div>
            </Link>
          </Card3DTilt>
        ))}
      </div>
    </div>
  )
}
