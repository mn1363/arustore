'use client'

import React from 'react'
import Link from 'next/link'
import { AruLogo3D } from '@/components/ui/AruLogo3D'
import { useStore } from '@/lib/store/useStore'
import { getDict } from '@/lib/data/i18n'

export default function Footer() {
  const locale = useStore((s) => s.locale)
  const dict = getDict(locale)

  return (
    <footer className="mt-20 border-t border-white/[0.08] bg-[#06070c]/90 backdrop-blur-lg text-[#979fb2]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <div className="space-y-2.5">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-xl bg-white/[0.03] border border-white/[0.08]">
              <AruLogo3D className="w-7 h-7" />
            </div>
            <span className="text-lg font-bold text-[#f4f4f6]">{dict.brandName}</span>
          </div>
          <p className="text-xs text-[#7d8597] max-w-sm leading-relaxed">
            {locale === 'fa'
              ? 'طراحی و تولید ظروف پذیرایی آلومینیومی با پوشش آنودایز رنگ‌ثابت و نمایشگاه سه‌بعدی تعاملی.'
              : 'Handcrafted cast and spun aluminum servingware with interactive 3D showcase.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-6 text-xs sm:text-sm">
          <Link href="/products" className="hover:text-[#dfc08e] transition-colors">
            {locale === 'fa' ? 'محصولات' : 'Products'}
          </Link>
          <Link href="/categories" className="hover:text-[#dfc08e] transition-colors">
            {locale === 'fa' ? 'مجموعه‌ها' : 'Collections'}
          </Link>
          <Link href="/orders" className="hover:text-[#dfc08e] transition-colors">
            {locale === 'fa' ? 'پیگیری سفارش' : 'Orders'}
          </Link>
          <Link href="/admin" className="hover:text-[#dfc08e] transition-colors">
            {locale === 'fa' ? 'مدیریت' : 'Admin'}
          </Link>
        </div>
      </div>

      <div className="border-t border-white/[0.05] py-4 text-xs text-[#687083]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <span>
            {locale === 'fa'
              ? '© ۱۴۰۵ آرو استور — تمامی حقوق محفوظ است.'
              : '© 2026 AruStore. All rights reserved.'}
          </span>
          <span>
            {locale === 'fa' ? 'ضمانت ۵ ساله ثبات رنگ' : '5-Year Finish Warranty'}
          </span>
        </div>
      </div>
    </footer>
  )
}
