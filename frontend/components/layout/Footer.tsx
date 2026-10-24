'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Award, Factory, RotateCcw, ShieldCheck, Sparkles, Truck } from 'lucide-react'
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
      title:
        locale === 'fa'
          ? 'عضویت در باشگاه خریداران و همکاران آرو ثبت شد!'
          : 'Welcome to AruStore Atelier Club!',
      description:
        locale === 'fa'
          ? 'کد تخفیف ۱۵٪ خرید مستقیم کارخانه: ARU3D'
          : 'Your 15% atelier code: ARU3D',
      type: 'success',
    })
  }

  const trustPillars = [
    {
      icon: ShieldCheck,
      title: locale === 'fa' ? '۵ سال ضمانت کتبی ثبات رنگ' : '5-Year Tarnish-Free Warranty',
      desc: locale === 'fa' ? 'آنودایز کوره‌ای بدون سیاه شدن و جلاسنج' : '220°C kiln-baked protective anodize',
    },
    {
      icon: Factory,
      title: locale === 'fa' ? 'خرید مستقیم از کارخانه تولیدی' : 'Direct from Metalwork Atelier',
      desc: locale === 'fa' ? 'شمش آلومینیوم خالص ۹۹.۷٪ بدون واسطه' : '99.7% pure food-safe aluminum ingot',
    },
    {
      icon: Truck,
      title: locale === 'fa' ? 'بسته‌بندی فوم قالبی ضدضربه' : 'Custom Foam Armored Shipping',
      desc: locale === 'fa' ? 'ارسال سالم و بیمه‌شده به سراسر ایران' : 'Insured nationwide & export delivery',
    },
    {
      icon: RotateCcw,
      title: locale === 'fa' ? '۱۰ روز ضمانت تعویض و بازگشت' : '10-Day Inspection Guarantee',
      desc: locale === 'fa' ? 'تضمین سلامت فیزیکی و کیفیت پرداخت' : 'Full satisfaction & finish guarantee',
    },
  ]

  return (
    <footer className="mt-24 border-t border-white/10 bg-obsidian-950/95 relative overflow-hidden">
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[720px] h-[240px] bg-gradient-to-r from-amber-500/12 via-slate-300/10 to-amber-500/12 blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-12 relative z-10">
        {/* Trust Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {trustPillars.map((pillar, i) => {
            const Icon = pillar.icon
            return (
              <div
                key={i}
                className="glass-panel rounded-2xl p-4 border border-white/[0.08] flex items-center gap-3.5"
              >
                <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-400/30 text-amber-300 flex-shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-bold text-white">
                    {pillar.title}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{pillar.desc}</div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Main Footer Columns */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pt-4">
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <AruLogo3D className="w-10 h-10" />
              <div>
                <div className="text-xl font-black text-white">{dict.brandName}</div>
                <div className="text-xs text-amber-300/90">{dict.brandTagline}</div>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-md">
              {locale === 'fa'
                ? 'صنایع تولیدی آرو استور، طراح و سازنده تخصصی ظروف پذیرایی لوکس از آلومینیوم خالص ریخته‌گری، چکش‌کاری و CNC با پوشش آنودایز رنگ‌ثابت و تجربه بررسی سه‌بعدی ۳۶۰ درجه آنلاین.'
                : 'AruStore designs and manufactures heirloom cast-aluminum servingware—pastry stands, fluted fruit bowls, engraved trays, and tea services—with interactive 360° 3D WebGL inspection.'}
            </p>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-400/25 text-xs text-amber-200">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {locale === 'fa'
                  ? 'کد تخفیف ۱۵٪ ست جهیزیه و خرید مستقیم: ARU3D'
                  : '15% Bridal & Direct Order Code: ARU3D'}
              </span>
            </div>
          </div>

          <div className="md:col-span-3 space-y-3">
            <h4 className="text-sm font-bold text-white">
              {locale === 'fa' ? 'بخش‌های گالری و کارخانه' : 'Atelier & Store'}
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-400">
              <li>
                <Link href="/products" className="hover:text-amber-300 transition-colors">
                  {dict.nav.products}
                </Link>
              </li>
              <li>
                <Link href="/categories" className="hover:text-amber-300 transition-colors">
                  {dict.nav.categories}
                </Link>
              </li>
              <li>
                <Link href="/wishlist" className="hover:text-amber-300 transition-colors">
                  {dict.nav.wishlist}
                </Link>
              </li>
              <li>
                <Link href="/orders" className="hover:text-amber-300 transition-colors">
                  {dict.nav.orders}
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-amber-300 transition-colors">
                  {dict.nav.admin}
                </Link>
              </li>
            </ul>
          </div>

          <div className="md:col-span-4 space-y-3">
            <h4 className="text-sm font-bold text-white">
              {locale === 'fa'
                ? 'دریافت کاتالوگ همکاری، عمده‌فروشی و مدل‌های جدید'
                : 'Wholesale & New Collection Catalog'}
            </h4>
            <p className="text-xs text-slate-400">
              {locale === 'fa'
                ? 'گالری‌داران، تالارها و خریداران سرویس جهیزیه برای دریافت لیست قیمت همکاری و کد تخفیف ۱۵٪ ایمیل خود را ثبت کنند.'
                : 'Register for showroom wholesale pricing and receive 15% off your first order.'}
            </p>
            <form onSubmit={handleSubscribe} className="flex gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="gallery@domain.com"
                dir="ltr"
                className="flex-1 rounded-xl bg-white/[0.04] border border-white/10 px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-300 to-yellow-500 text-slate-950 font-extrabold text-xs hover:brightness-110"
              >
                {locale === 'fa' ? 'ثبت' : 'Join'}
              </button>
            </form>
          </div>
        </div>

        <div className="pt-8 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
          <span>
            © 2026 AruStore Aluminum Servingware Atelier.{' '}
            {locale === 'fa' ? 'تمامی حقوق تولید و طراحی محفوظ است.' : 'All rights reserved.'}
          </span>
          <span className="text-slate-400">
            صنایع تولیدی لوازم پذیرایی آلومینیومی آرو • Real-Time 3D WebGL
          </span>
        </div>
      </div>
    </footer>
  )
}
