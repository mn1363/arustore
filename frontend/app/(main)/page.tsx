'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Box, ShieldCheck } from 'lucide-react'
import HeroStage3D from '@/components/three/HeroStage3D'
import ProductCard from '@/components/product/ProductCard'
import Card3DTilt from '@/components/ui/Card3DTilt'
import { CATEGORIES } from '@/lib/data/catalog'
import { getDict } from '@/lib/data/i18n'
import { useStore } from '@/lib/store/useStore'
import { formatNumber } from '@/lib/utils'

const CATEGORY_REALM_STYLES = [
  {
    halo: 'rgba(223, 192, 142, 0.22)',
    borderHover: 'group-hover:border-[#dfc08e]/45',
    badgeFa: 'تالار شیرینی‌خوری',
    badgeEn: 'Tiered Sanctuary',
  },
  {
    halo: 'rgba(126, 166, 224, 0.22)',
    borderHover: 'group-hover:border-[#7ea6e0]/45',
    badgeFa: 'ایوان بلورین و کشکول',
    badgeEn: 'Sculpted Vessels',
  },
  {
    halo: 'rgba(217, 155, 92, 0.22)',
    borderHover: 'group-hover:border-[#d99b5c]/45',
    badgeFa: 'نگارخانه سینی و چای',
    badgeEn: 'Tea & Tray Vault',
  },
  {
    halo: 'rgba(94, 194, 166, 0.2)',
    borderHover: 'group-hover:border-[#5ec2a6]/45',
    badgeFa: 'تراس پذیرایی و اردو',
    badgeEn: 'Ordur Pavilion',
  },
]

export default function HomePage() {
  const locale = useStore((s) => s.locale)
  const products = useStore((s) => s.products)
  const dict = getDict(locale)

  const [activeTab, setActiveTab] = useState<'all' | 'featured' | 'new'>('all')

  const filteredProducts = products.filter((p) => {
    if (activeTab === 'featured') return p.is_featured
    if (activeTab === 'new') return p.is_new
    return true
  })

  const DirArrow = locale === 'fa' ? ArrowLeft : ArrowRight

  return (
    <div className="space-y-24 pb-10">
      {/* 1. LEVEL-5 DIMENSIONAL HERO SANCTUARY */}
      <section className="pt-8 sm:pt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            <div className="lg:col-span-5 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-pill text-xs font-medium text-[#dfc08e]">
                <Box className="w-3.5 h-3.5" />
                <span>
                  {locale === 'fa'
                    ? 'نمایشگاه سه‌بعدی ظروف آلومینیوم خالص'
                    : 'Interactive 3D Aluminum Sanctuary'}
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-bold leading-[1.3] text-[#f4f4f6]">
                {locale === 'fa' ? (
                  <>
                    ظروف پذیرایی آلومینیوم
                    <span className="block text-[#dfc08e] mt-1.5">
                      شکوهِ فرم، دوامِ ماندگار
                    </span>
                  </>
                ) : (
                  <>
                    Cast-Aluminum Tableware
                    <span className="block text-[#dfc08e] mt-1.5">
                      Sculpted Form, Lasting Luster
                    </span>
                  </>
                )}
              </h1>

              <p className="text-sm sm:text-base text-[#979fb2] leading-relaxed max-w-md">
                {locale === 'fa'
                  ? 'تولیدشده از شمش آلومینیوم خالص با پوشش آنودایز رنگ‌ثابت؛ هر قطعه را پیش از خرید به‌صورت سه‌بعدی بچرخانید و بررسی کنید.'
                  : 'Crafted from pure aluminum ingot with tarnish-free anodizing and real-time 360° 3D inspection.'}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link
                  href="/products"
                  className="px-6 py-3.5 rounded-xl champagne-btn font-bold text-sm flex items-center gap-2"
                >
                  <span>{locale === 'fa' ? 'مشاهده محصولات' : 'Browse Collection'}</span>
                  <DirArrow className="w-4 h-4" />
                </Link>

                <Link
                  href="/categories"
                  className="px-5 py-3.5 rounded-xl secondary-3d-btn text-sm font-medium"
                >
                  {locale === 'fa' ? 'تالار مجموعه‌ها' : 'Explore Portals'}
                </Link>
              </div>

              <div className="pt-2 flex items-center gap-2 text-xs text-[#979fb2]">
                <ShieldCheck className="w-4 h-4 text-[#dfc08e] flex-shrink-0" />
                <span>
                  {locale === 'fa'
                    ? '۵ سال ضمانت ثبات رنگ آنودایز کوره‌ای و ارسال ایمن'
                    : '5-year kiln-anodized finish warranty & insured delivery'}
                </span>
              </div>
            </div>

            <div className="lg:col-span-7">
              <HeroStage3D />
            </div>
          </div>
        </div>
      </section>

      {/* 2. DIMENSIONAL COLLECTION GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#f4f4f6]">
              {locale === 'fa' ? 'مجموعه محصولات' : 'Collection'}
            </h2>
            <p className="text-xs sm:text-sm text-[#979fb2] mt-1">
              {locale === 'fa'
                ? 'انتخاب رنگ آنودایز و پیش‌نمایش سه‌بعدی روی هر کارت'
                : 'Select anodized finishes or open 360° 3D preview on any piece'}
            </p>
          </div>

          <div className="inline-flex items-center gap-1 p-1 rounded-2xl bg-[#0e111b] border border-white/[0.08]">
            {[
              { id: 'all', label: locale === 'fa' ? 'همه' : 'All' },
              { id: 'featured', label: dict.common.featured },
              { id: 'new', label: dict.common.newArrivals },
            ].map((tab) => {
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`px-4 py-1.5 rounded-xl text-xs sm:text-sm transition-all ${
                    active
                      ? 'bg-[#1c2233] text-[#dfc08e] font-bold border border-[#dfc08e]/30 shadow-sm'
                      : 'text-[#979fb2] hover:text-[#f4f4f6]'
                  }`}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 3. ELEVATED FORGING & MATERIAL SANCTUARY */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl glass-panel overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-center">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-28 end-10 w-80 h-80 rounded-full blur-3xl opacity-30"
            style={{
              background: 'radial-gradient(circle, rgba(223,192,142,0.35), transparent 70%)',
            }}
          />

          <div className="lg:col-span-6 h-72 sm:h-96 overflow-hidden product-pedestal-stage border-b lg:border-b-0 lg:border-e border-white/[0.07]">
            <img
              src="/images/banners/hospitality-collection-banner.png"
              alt="شمش آلومینیوم خالص و ظرف تراش‌خورده آرو"
              loading="lazy"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="lg:col-span-6 p-8 sm:p-12 space-y-6 relative z-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#f4f4f6] leading-snug">
              {locale === 'fa'
                ? 'تراش‌خورده از شمش خالص، بی‌نیاز از جلاسنج'
                : 'Machined from Pure Ingot, Tarnish-Free'}
            </h2>

            <p className="text-sm text-[#979fb2] leading-relaxed">
              {locale === 'fa'
                ? 'برخلاف ظروف آب‌نقره‌شده که به مرور کدر و سیاه می‌شوند، ظروف آلومینیومی آرو استور با پوشش آنودایز کوره‌ای در برابر رطوبت، شستشو و حرارت جلای ابریشمی خود را حفظ می‌کنند.'
                : 'Unlike plated brass that darkens over time, kiln-anodized pure aluminum retains its silky metallic finish permanently.'}
            </p>

            <div className="grid grid-cols-3 gap-3 sm:gap-4 pt-2">
              <div className="rounded-2xl bg-[#0b0e17]/90 border border-white/[0.07] p-3.5">
                <div className="text-base sm:text-lg font-bold text-[#f4f4f6]">
                  {locale === 'fa' ? '۹۹.۷٪' : '99.7%'}
                </div>
                <div className="text-[11px] sm:text-xs text-[#979fb2] mt-0.5">
                  {locale === 'fa' ? 'خلوص آلومینیوم' : 'Pure Aluminum'}
                </div>
              </div>
              <div className="rounded-2xl bg-[#0b0e17]/90 border border-[#dfc08e]/25 p-3.5">
                <div className="text-base sm:text-lg font-bold text-[#dfc08e]">
                  {locale === 'fa' ? '۲۲۰ درجه' : '220°C'}
                </div>
                <div className="text-[11px] sm:text-xs text-[#979fb2] mt-0.5">
                  {locale === 'fa' ? 'آنودایز کوره‌ای' : 'Kiln Anodize'}
                </div>
              </div>
              <div className="rounded-2xl bg-[#0b0e17]/90 border border-white/[0.07] p-3.5">
                <div className="text-base sm:text-lg font-bold text-[#f4f4f6]">
                  {locale === 'fa' ? '۵ سال' : '5 Years'}
                </div>
                <div className="text-[11px] sm:text-xs text-[#979fb2] mt-0.5">
                  {locale === 'fa' ? 'ضمانت ثبات رنگ' : 'Finish Warranty'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. MINIATURE FANTASY PORTAL CATEGORIES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#f4f4f6]">
              {locale === 'fa' ? 'تالارهای موضوعی' : 'Collection Portals'}
            </h2>
            <p className="text-xs sm:text-sm text-[#979fb2] mt-1">
              {locale === 'fa'
                ? 'ورود مستقیم به هر بخش از مجموعه پذیرایی آلومینیومی'
                : 'Step into each curated servingware realm'}
            </p>
          </div>
          <Link
            href="/categories"
            className="px-4 py-2 rounded-xl secondary-3d-btn text-xs sm:text-sm flex items-center gap-1.5"
          >
            <span>{locale === 'fa' ? 'همه مجموعه‌ها' : 'All Portals'}</span>
            <DirArrow className="w-4 h-4 text-[#dfc08e]" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {CATEGORIES.map((cat, idx) => {
            const realm = CATEGORY_REALM_STYLES[idx % CATEGORY_REALM_STYLES.length]
            return (
              <Card3DTilt key={cat.id} maxTilt={4.5} className="rounded-3xl h-full">
                <Link
                  href={`/products?category=${cat.slug}`}
                  className={`group relative rounded-3xl card-level-2 ${realm.borderHover} overflow-hidden flex flex-col justify-between h-full block`}
                >
                  {/* Miniature Dimensional Portal Stage */}
                  <div className="relative aspect-[16/11] overflow-hidden product-pedestal-stage">
                    <img
                      src={cat.image}
                      alt={cat.name_fa}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
                    />

                    {/* Portal Arch & Atmospheric Halo */}
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0"
                      style={{
                        background: `radial-gradient(80% 65% at 50% 100%, ${realm.halo} 0%, transparent 70%)`,
                      }}
                    />
                    <div className="absolute top-3 start-3 px-2.5 py-1 rounded-full glass-pill text-[11px] font-medium text-[#e8ebf2]">
                      {locale === 'fa' ? realm.badgeFa : realm.badgeEn}
                    </div>
                  </div>

                  <div className="p-4 sm:p-5 flex items-center justify-between gap-2 border-t border-white/[0.06]">
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-[#f4f4f6] group-hover:text-[#dfc08e] transition-colors">
                        {locale === 'fa' ? cat.name_fa : cat.name}
                      </h3>
                      <span className="text-[11px] text-[#979fb2] mt-0.5 block">
                        {formatNumber(cat.product_count, locale)}{' '}
                        {locale === 'fa' ? 'اثر' : 'pieces'}
                      </span>
                    </div>
                    <span className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-[#979fb2] group-hover:text-[#dfc08e] group-hover:border-[#dfc08e]/35 transition-colors flex-shrink-0">
                      <DirArrow className="w-4 h-4" />
                    </span>
                  </div>
                </Link>
              </Card3DTilt>
            )
          })}
        </div>
      </section>
    </div>
  )
}
