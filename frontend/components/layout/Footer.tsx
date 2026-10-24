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
    <footer className="mt-20 border-t border-white/[0.07] bg-[#0a0b0e] text-[#9ca0ab]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <AruLogo3D className="w-8 h-8" />
            <span className="text-lg font-bold text-[#f2f2f0]">{dict.brandName}</span>
          </div>
          <p className="text-xs text-[#7d828f] max-w-sm">
            {locale === 'fa'
              ? 'طراحی و تولید ظروف پذیرایی آلومینیومی با پوشش آنودایز رنگ‌ثابت.'
              : 'Handcrafted cast and spun aluminum servingware.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-6 text-xs sm:text-sm">
          <Link href="/products" className="hover:text-[#f2f2f0] transition-colors">
            {locale === 'fa' ? 'محصولات' : 'Products'}
          </Link>
          <Link href="/categories" className="hover:text-[#f2f2f0] transition-colors">
            {locale === 'fa' ? 'مجموعه‌ها' : 'Collections'}
          </Link>
          <Link href="/orders" className="hover:text-[#f2f2f0] transition-colors">
            {locale === 'fa' ? 'پیگیری سفارش' : 'Orders'}
          </Link>
          <Link href="/admin" className="hover:text-[#f2f2f0] transition-colors">
            {locale === 'fa' ? 'مدیریت' : 'Admin'}
          </Link>
        </div>
      </div>

      <div className="border-t border-white/[0.05] py-4 text-xs text-[#686d78]">
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
