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
      title:
        locale === 'fa'
          ? 'نشانی شما در دفتر مشترکین کارگاه آرو ثبت شد'
          : 'Registered in the AruStore Foundry Ledger',
      description:
        locale === 'fa'
          ? 'کد اختصاصی ۱۵٪ خرید مستقیم کارگاه: ARU3D'
          : 'Direct 15% atelier commission code: ARU3D',
      type: 'success',
    })
  }

  const guarantees = [
    {
      code: '01 / ANODIZE',
      title: locale === 'fa' ? 'پنج سال ضمانت کتبی ثبات آبکاری' : '5-Year Tarnish-Proof Seal',
      desc: locale === 'fa' ? 'پوشش آنودایز ۲۲۰ درجه بدون کدر شدن و بی‌نیاز از جلاسنج' : '220°C kiln-baked protective oxide layer',
    },
    {
      code: '02 / INGOT',
      title: locale === 'fa' ? 'شمش آلومینیوم خالص ۹۹.۷٪ خوراکی' : '99.7% Pure Food-Safe Ingot',
      desc: locale === 'fa' ? 'ریخته‌گری متراکم بدون سرب، سبک‌تر از برنج و مقاوم در برابر ضربه' : 'Lead-free gravity casting with heirloom balance',
    },
    {
      code: '03 / CRATING',
      title: locale === 'fa' ? 'قالب‌بندی فوم فشرده مخصوص حمل' : 'Molded Protective Crating',
      desc: locale === 'fa' ? 'ارسال بیمه‌شده مستقیم از کارخانه به سراسر کشور' : 'Custom-cut foam inserts for nationwide shipping',
    },
    {
      code: '04 / RETURN',
      title: locale === 'fa' ? 'ده روز مهلت بررسی اصالت و پرداخت' : '10-Day Atelier Inspection',
      desc: locale === 'fa' ? 'امکان تعویض بی‌قیدوشرط در صورت عدم تطابق با نمای سه‌بعدی' : 'Unconditional exchange guarantee on finish quality',
    },
  ]

  return (
    <footer className="border-t border-[#ece6dc]/14 bg-[#0d0c0a] text-[#d6cfc4]">
      {/* Architectural Hairline Guarantee Ledger */}
      <div className="border-b border-[#ece6dc]/12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x sm:divide-x-reverse divide-[#ece6dc]/12">
          {guarantees.map((g) => (
            <div key={g.code} className="p-6 lg:p-7 space-y-2">
              <div className="font-mono text-[10px] tracking-[0.2em] text-[#c59b5f]">
                {g.code}
              </div>
              <div className="font-editorial text-xl font-bold text-[#f7f4ee]">
                {g.title}
              </div>
              <p className="text-xs text-[#9e9589] leading-relaxed">{g.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Main Foundry Colophon */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 grid grid-cols-1 md:grid-cols-12 gap-10">
        <div className="md:col-span-5 space-y-4">
          <div className="flex items-center gap-3.5">
            <AruLogo3D className="w-11 h-11" />
            <div>
              <div className="font-editorial text-3xl font-bold text-[#f7f4ee] leading-none">
                {dict.brandName}
              </div>
              <div className="font-mono text-[10px] tracking-[0.18em] text-[#c59b5f] uppercase mt-1">
                CAST ALUMINUM TABLEWARE HOUSE
              </div>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-[#9e9589] leading-relaxed max-w-md">
            {locale === 'fa'
              ? 'کارگاه فلزتراشی و تالار آرو استور؛ طراح و تولیدکننده تخصصی ظروف پذیرایی آلومینیومی با ترکیب چکش‌کاری اصیل ایرانی، تراش دقیق CNC و امکان وارسی سه‌بعدی هر اثر پیش از سفارش.'
              : 'AruStore designs and casts pure aluminum serving vessels—uniting Iranian metalwork heritage with 5-axis CNC fluting and 360° interactive 3D inspection.'}
          </p>
          <div className="pt-1 font-mono text-[11px] text-[#dfc08e]">
            {locale === 'fa'
              ? 'نشانی کارگاه: شهرک صنعتی، واحد ریخته‌گری و آنودایز تخصصی آرو  |  کد مستقیم: ARU3D'
              : 'FOUNDRY DIRECT CODE: ARU3D (15% BRIDAL & GALLERY COMMISSION)'}
          </div>
        </div>

        <div className="md:col-span-3 space-y-3">
          <h4 className="font-mono text-[11px] tracking-[0.2em] uppercase text-[#c59b5f]">
            {locale === 'fa' ? 'فهرست تالار' : 'INDEX'}
          </h4>
          <ul className="space-y-2.5 text-xs sm:text-sm text-[#bfb6a8]">
            <li>
              <Link href="/products" className="hover:text-[#f7f4ee] transition-colors">
                {dict.nav.products}
              </Link>
            </li>
            <li>
              <Link href="/categories" className="hover:text-[#f7f4ee] transition-colors">
                {dict.nav.categories}
              </Link>
            </li>
            <li>
              <Link href="/wishlist" className="hover:text-[#f7f4ee] transition-colors">
                {dict.nav.wishlist}
              </Link>
            </li>
            <li>
              <Link href="/orders" className="hover:text-[#f7f4ee] transition-colors">
                {dict.nav.orders}
              </Link>
            </li>
            <li>
              <Link href="/admin" className="hover:text-[#f7f4ee] transition-colors">
                {dict.nav.admin}
              </Link>
            </li>
          </ul>
        </div>

        <div className="md:col-span-4 space-y-3">
          <h4 className="font-mono text-[11px] tracking-[0.2em] uppercase text-[#c59b5f]">
            {locale === 'fa' ? 'دفتر همکاری گالری‌ها و جهیزیه' : 'TRADE & BRIDAL LEDGER'}
          </h4>
          <p className="text-xs text-[#9e9589] leading-relaxed">
            {locale === 'fa'
              ? 'برای دریافت کاتالوگ ابعاد فنی، شرایط فروش عمده گالری‌ها و اطلاع از قالب‌های جدید، ایمیل خود را ثبت کنید.'
              : 'Receive technical specification sheets, showroom trade pricing, and new casting releases.'}
          </p>
          <form onSubmit={handleSubscribe} className="flex border border-[#ece6dc]/20 bg-[#161411]">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="atelier@domain.com"
              dir="ltr"
              className="flex-1 bg-transparent px-3.5 py-2.5 text-xs text-[#f7f4ee] placeholder:text-[#787065] focus:outline-none font-mono"
            />
            <button
              type="submit"
              className="px-4 py-2.5 satin-brass-btn text-xs font-bold flex-shrink-0"
            >
              {locale === 'fa' ? 'ثبت در دفتر' : 'Join'}
            </button>
          </form>
        </div>
      </div>

      {/* Bottom Copyright Rule */}
      <div className="border-t border-[#ece6dc]/10 py-5 text-[11px] text-[#7e766b]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-4">
          <span>
            {locale === 'fa'
              ? '© ۱۴۰۵ کارگاه فلزتراشی و ظروف پذیرایی آرو استور — تمامی حقوق محفوظ است.'
              : '© 2026 AruStore Cast-Aluminum Tableware Atelier. All rights reserved.'}
          </span>
          <span className="font-mono text-[10px] tracking-widest uppercase">
            TEHRAN · ISFAHAN · INTERACTIVE 3D CAD
          </span>
        </div>
      </div>
    </footer>
  )
}
