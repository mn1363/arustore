'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { AruLogo3D } from '@/components/ui/AruLogo3D'
import { useStore } from '@/lib/store/useStore'
import { getDict } from '@/lib/data/i18n'

export default function Footer() {
  const locale = useStore((s) => s.locale)
  const pushToast = useStore((s) => s.pushToast)
  const dict = getDict(locale)
  const [email, setEmail] = useState('')

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setEmail('')
    pushToast({
      title: locale === 'fa' ? 'ثبت شد' : 'Subscribed',
      description: locale === 'fa' ? 'کد تخفیف ۱۵٪ کارگاه: ARU3D' : '15% code: ARU3D',
      type: 'success',
    })
  }

  const pillars = [
    locale === 'fa' ? 'شمش آلومینیوم خالص ۹۹.۷٪' : '99.7% Pure Aluminum',
    locale === 'fa' ? '۵ سال ضمانت ثبات آنودایز' : '5-Year Tarnish-Free Warranty',
    locale === 'fa' ? 'فوم قالبی ضدضربه ارسال' : 'Molded Protective Packaging',
    locale === 'fa' ? '۱۰ روز ضمانت تعویض کارگاه' : '10-Day Exchange Guarantee',
  ]

  return (
    <footer className="border-t border-[#ece6dc]/14 bg-[#0d0c0a] text-[#d6cfc4]">
      <div className="border-b border-[#ece6dc]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-semibold text-[#c9c0b3]">
          {pillars.map((p, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#c59b5f] flex-shrink-0" />
              <span>{p}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        <div className="md:col-span-5 space-y-2.5">
          <div className="flex items-center gap-3">
            <AruLogo3D className="w-9 h-9" />
            <div className="font-editorial text-xl font-extrabold text-[#f7f4ee]">
              {dict.brandName}
            </div>
          </div>
          <p className="text-xs text-[#9e9589] max-w-sm leading-relaxed">
            {locale === 'fa'
              ? 'تولید و فروش مستقیم ظروف پذیرایی آلومینیومی ریخته‌گری و تراش CNC.'
              : 'Direct manufacturer of cast and CNC-machined aluminum servingware.'}
          </p>
        </div>

        <div className="md:col-span-3 flex flex-wrap gap-x-6 gap-y-2 text-xs text-[#bfb6a8]">
          <Link href="/products" className="hover:text-[#f7f4ee]">{dict.nav.products}</Link>
          <Link href="/categories" className="hover:text-[#f7f4ee]">{dict.nav.categories}</Link>
          <Link href="/orders" className="hover:text-[#f7f4ee]">{dict.nav.orders}</Link>
          <Link href="/admin" className="hover:text-[#f7f4ee]">{dict.nav.admin}</Link>
        </div>

        <div className="md:col-span-4">
          <form onSubmit={handleSubscribe} className="flex border border-[#ece6dc]/20 bg-[#161411]">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={locale === 'fa' ? 'ایمیل جهت لیست قیمت همکاری...' : 'Email for wholesale list...'}
              className="flex-1 bg-transparent px-3 py-2 text-xs text-[#f7f4ee] placeholder:text-[#787065] focus:outline-none"
            />
            <button type="submit" className="px-4 py-2 satin-brass-btn text-xs font-bold">
              {locale === 'fa' ? 'ثبت' : 'Join'}
            </button>
          </form>
        </div>
      </div>

      <div className="border-t border-[#ece6dc]/10 py-4 text-[11px] text-[#7e766b]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <span>
            {locale === 'fa' ? '© ۱۴۰۵ تولیدی ظروف آلومینیومی آرو استور' : '© 2026 AruStore Aluminum'}
          </span>
          <span className="font-mono text-[10px]">ARU3D</span>
        </div>
      </div>
    </footer>
  )
}
