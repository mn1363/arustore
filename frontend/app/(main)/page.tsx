'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import HeroStage3D from '@/components/three/HeroStage3D'
import ProductCard from '@/components/product/ProductCard'
import { CATEGORIES } from '@/lib/data/catalog'
import { getDict } from '@/lib/data/i18n'
import { useStore } from '@/lib/store/useStore'

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
    <div className="space-y-24 pb-8">
      {/* 1. CALM, SPACIOUS SPLIT HERO */}
      <section className="pt-8 sm:pt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            <div className="lg:col-span-5 space-y-6">
              <h1 className="text-3xl sm:text-5xl font-bold leading-[1.3] text-[#f2f2f0]">
                {locale === 'fa' ? (
                  <>
                    ظروف پذیرایی آلومینیوم
                    <span className="block text-[#d6b88a] mt-1">
                      سادگیِ فرم، دوامِ ماندگار
                    </span>
                  </>
                ) : (
                  <>
                    Cast-Aluminum Tableware
                    <span className="block text-[#d6b88a] mt-1">
                      Quiet Form, Lasting Luster
                    </span>
                  </>
                )}
              </h1>

              <p className="text-sm sm:text-base text-[#9ca0ab] leading-relaxed max-w-md">
                {locale === 'fa'
                  ? 'تولیدشده از شمش آلومینیوم خالص با پوشش آنودایز رنگ‌ثابت؛ قابل چرخش و بررسی سه‌بعدی پیش از خرید.'
                  : 'Crafted from pure aluminum ingot with tarnish-free anodizing and interactive 360° inspection.'}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link
                  href="/products"
                  className="px-6 py-3.5 rounded-xl champagne-btn font-bold text-sm flex items-center gap-2 transition-colors"
                >
                  <span>{locale === 'fa' ? 'مشاهده محصولات' : 'Browse Collection'}</span>
                  <DirArrow className="w-4 h-4" />
                </Link>

                <Link
                  href="/categories"
                  className="px-5 py-3.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] text-[#e4e6eb] text-sm font-medium transition-colors"
                >
                  {locale === 'fa' ? 'مجموعه‌ها' : 'Categories'}
                </Link>
              </div>
            </div>

            <div className="lg:col-span-7">
              <HeroStage3D />
            </div>
          </div>
        </div>
      </section>

      {/* 2. CLEAN STUDIO PRODUCT GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#f2f2f0]">
            {locale === 'fa' ? 'مجموعه محصولات' : 'Collection'}
          </h2>

          <div className="flex items-center gap-5 text-xs sm:text-sm">
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
                  className={`pb-1.5 transition-colors border-b-2 ${
                    active
                      ? 'text-[#f2f2f0] font-bold border-[#d6b88a]'
                      : 'text-[#8e93a0] border-transparent hover:text-[#d4d6dc]'
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

      {/* 3. QUIET TWO-COLUMN MATERIAL & CRAFT SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-[#14161a] border border-white/[0.07] overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-center">
          <div className="lg:col-span-6 h-72 sm:h-96 overflow-hidden bg-[#121317]">
            <img
              src="/images/banners/hospitality-collection-banner.png"
              alt="شمش آلومینیوم خالص و ظرف تراش‌خورده آرو"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="lg:col-span-6 p-8 sm:p-12 space-y-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#f2f2f0] leading-snug">
              {locale === 'fa'
                ? 'تراش‌خورده از شمش خالص، بی‌نیاز از جلاسنج'
                : 'Machined from Pure Ingot, Tarnish-Free'}
            </h2>

            <p className="text-sm text-[#9ca0ab] leading-relaxed">
              {locale === 'fa'
                ? 'برخلاف ظروف آب‌نقره‌شده که به مرور کدر و سیاه می‌شوند، ظروف آلومینیومی آرو استور با پوشش آنودایز کوره‌ای در برابر رطوبت، شستشو و حرارت رنگ خود را حفظ می‌کنند.'
                : 'Unlike plated brass that darkens over time, kiln-anodized pure aluminum retains its silky metallic finish permanently.'}
            </p>

            <div className="grid grid-cols-3 gap-4 pt-3 border-t border-white/[0.07]">
              <div>
                <div className="text-base font-bold text-[#f2f2f0]">
                  {locale === 'fa' ? '۹۹.۷٪' : '99.7%'}
                </div>
                <div className="text-xs text-[#8e93a0] mt-0.5">
                  {locale === 'fa' ? 'خلوص آلومینیوم' : 'Pure Aluminum'}
                </div>
              </div>
              <div>
                <div className="text-base font-bold text-[#d6b88a]">
                  {locale === 'fa' ? '۲۲۰ درجه' : '220°C'}
                </div>
                <div className="text-xs text-[#8e93a0] mt-0.5">
                  {locale === 'fa' ? 'آنودایز کوره‌ای' : 'Kiln Anodize'}
                </div>
              </div>
              <div>
                <div className="text-base font-bold text-[#f2f2f0]">
                  {locale === 'fa' ? '۵ سال' : '5 Years'}
                </div>
                <div className="text-xs text-[#8e93a0] mt-0.5">
                  {locale === 'fa' ? 'ضمانت ثبات رنگ' : 'Finish Warranty'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CALM 4-CATEGORY SHOWCASE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#f2f2f0]">
            {locale === 'fa' ? 'دسته‌بندی‌ها' : 'Categories'}
          </h2>
          <Link
            href="/categories"
            className="text-xs sm:text-sm text-[#9ca0ab] hover:text-[#f2f2f0] flex items-center gap-1.5 transition-colors"
          >
            <span>{locale === 'fa' ? 'مشاهده همه' : 'View All'}</span>
            <DirArrow className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              href={`/products?category=${cat.slug}`}
              className="group rounded-2xl bg-[#14161a] border border-white/[0.07] hover:border-white/[0.18] overflow-hidden transition-colors"
            >
              <div className="aspect-[16/11] overflow-hidden bg-[#121317]">
                <img
                  src={cat.image}
                  alt={cat.name_fa}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-4 flex items-center justify-between gap-2">
                <h3 className="text-sm sm:text-base font-bold text-[#f2f2f0] group-hover:text-[#d6b88a] transition-colors">
                  {locale === 'fa' ? cat.name_fa : cat.name}
                </h3>
                <DirArrow className="w-4 h-4 text-[#7d828f] group-hover:text-[#d6b88a] transition-colors flex-shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
