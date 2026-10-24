'use client'

import React, { useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  Copy,
  Layers,
  Rotate3d,
  ShoppingBag,
} from 'lucide-react'
import HeroStage3D from '@/components/three/HeroStage3D'
import ProductCard from '@/components/product/ProductCard'
import { CATEGORIES } from '@/lib/data/catalog'
import { getDict } from '@/lib/data/i18n'
import { useStore } from '@/lib/store/useStore'
import { formatNumber, formatPrice, getProductTitle } from '@/lib/utils'

const StudioScene3D = dynamic(() => import('@/components/three/StudioScene3D'), {
  ssr: false,
})

export default function HomePage() {
  const locale = useStore((s) => s.locale)
  const products = useStore((s) => s.products)
  const addToCart = useStore((s) => s.addToCart)
  const pushToast = useStore((s) => s.pushToast)
  const dict = getDict(locale)

  const [activeTab, setActiveTab] = useState<'all' | 'featured' | 'new' | 'sale'>('all')

  // 3D Workbench State
  const [labProductIdx, setLabProductIdx] = useState(0)
  const labProduct = products[labProductIdx] || products[0]
  const [labColorIdx, setLabColorIdx] = useState(0)
  const [labExploded, setLabExploded] = useState(true)
  const [labWireframe, setLabWireframe] = useState(false)
  const labColor = labProduct.colors[labColorIdx] || labProduct.colors[0]

  const filteredProducts = products.filter((p) => {
    if (activeTab === 'featured') return p.is_featured
    if (activeTab === 'new') return p.is_new
    if (activeTab === 'sale') return Boolean(p.compare_price && p.compare_price > p.price)
    return true
  })

  const DirArrow = locale === 'fa' ? ArrowLeft : ArrowRight

  const copyPromo = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText('ARU3D').catch(() => {})
    }
    pushToast({
      title: locale === 'fa' ? 'کد تخفیف ARU3D کپی شد' : 'Code ARU3D copied',
      description: locale === 'fa' ? '۱۵٪ تخفیف خرید مستقیم از کارگاه' : '15% direct workshop discount',
      type: 'success',
    })
  }

  const productionSteps = [
    {
      num: '۰۱',
      title: locale === 'fa' ? 'ریخته‌گری شمش ۹۹.۷٪' : '99.7% Pure Ingot',
      sub: locale === 'fa' ? 'آلومینیوم خالص خوراکی بدون سرب' : 'Dense lead-free gravity casting',
    },
    {
      num: '۰۲',
      title: locale === 'fa' ? 'تراش و چکش‌کاری' : 'Lathe & Planishing',
      sub: locale === 'fa' ? 'شیارزنی دقیق و چکش‌کاری دستی' : 'CNC fluting & hand hammering',
    },
    {
      num: '۰۳',
      title: locale === 'fa' ? 'پرداخت ساتن ضدلک' : 'Satin Buffing',
      sub: locale === 'fa' ? 'بدون ماندن جای آب و اثر انگشت' : 'Fingerprint & water-spot resistant',
    },
    {
      num: '۰۴',
      title: locale === 'fa' ? 'آنودایز کوره‌ای ۲۲۰°' : '220°C Kiln Seal',
      sub: locale === 'fa' ? 'رنگ‌ثابت؛ بدون سیاه شدن و جلاسنج' : 'Never tarnishes or needs polish',
    },
  ]

  return (
    <div>
      {/* =====================================================================
          1. CLEAN ARCHITECTURAL HERO
         ===================================================================== */}
      <section className="border-b border-[#ece6dc]/14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
            {/* Concise Copy Column */}
            <div className="lg:col-span-5 py-10 sm:py-14 lg:pe-10 lg:border-e border-[#ece6dc]/12 space-y-7">
              <div className="space-y-4">
                <div className="text-xs font-bold tracking-wider text-[#c59b5f]">
                  {locale === 'fa' ? 'تولید مستقیم از کارگاه آرو' : 'DIRECT FROM ARU WORKSHOP'}
                </div>

                <h1 className="font-editorial text-4xl sm:text-5xl xl:text-[3.4rem] font-extrabold leading-[1.22] text-[#f7f4ee]">
                  {locale === 'fa' ? (
                    <>
                      ظروف پذیرایی
                      <span className="block text-[#dfc08e] mt-1">
                        آلومینیوم خالص و رنگ‌ثابت
                      </span>
                    </>
                  ) : (
                    <>
                      Pure Cast-Aluminum
                      <span className="block text-[#dfc08e] mt-1">
                        Reception Tableware
                      </span>
                    </>
                  )}
                </h1>

                <p className="text-sm text-[#b9b0a2] leading-relaxed max-w-md">
                  {locale === 'fa'
                    ? 'ساخته‌شده از شمش خالص با آنودایز کوره‌ای؛ همراه با بررسی سه‌بعدی ۳۶۰ درجه پیش از سفارش.'
                    : 'Crafted from pure ingot with 220°C kiln anodizing and live 360° 3D inspection.'}
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <Link
                    href="/products"
                    className="px-6 py-3.5 rounded-[2px] brushed-metal-btn font-bold text-xs sm:text-sm flex items-center gap-2 transition-all"
                  >
                    <span>{locale === 'fa' ? 'مشاهده محصولات' : 'Browse Products'}</span>
                    <DirArrow className="w-4 h-4" />
                  </Link>

                  <a
                    href="#lab-3d"
                    className="px-5 py-3.5 rounded-[2px] border border-[#ece6dc]/22 hover:border-[#c59b5f] text-[#f3efe8] text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors"
                  >
                    <Rotate3d className="w-4 h-4 text-[#c59b5f]" />
                    <span>{locale === 'fa' ? 'سفارشی‌سازی ۳بعدی' : '3D Customizer'}</span>
                  </a>
                </div>
              </div>

              {/* Minimal 3-Metric Strip */}
              <div className="border-t border-[#ece6dc]/14 pt-5 grid grid-cols-3 gap-4">
                <div>
                  <div className="text-base sm:text-lg font-extrabold text-[#f7f4ee]">
                    {locale === 'fa' ? '۹۹.۷٪' : '99.7%'}
                  </div>
                  <div className="text-[11px] text-[#9e9589]">
                    {locale === 'fa' ? 'خلوص شمش' : 'Pure Ingot'}
                  </div>
                </div>
                <div>
                  <div className="text-base sm:text-lg font-extrabold text-[#dfc08e]">
                    {locale === 'fa' ? '۵ سال' : '5 Years'}
                  </div>
                  <div className="text-[11px] text-[#9e9589]">
                    {locale === 'fa' ? 'ضمانت رنگ' : 'Color Warranty'}
                  </div>
                </div>
                <div>
                  <div className="text-base sm:text-lg font-extrabold text-[#d8dce0]">
                    ۳۶۰°
                  </div>
                  <div className="text-[11px] text-[#9e9589]">
                    {locale === 'fa' ? 'نمای سه‌بعدی' : '3D Inspection'}
                  </div>
                </div>
              </div>
            </div>

            {/* 3D Turntable */}
            <div className="lg:col-span-7 py-8 sm:py-10 lg:ps-9">
              <HeroStage3D />
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          2. REAL WORKSHOP PHOTOGRAPHY & 4-STEP PRODUCTION LINE
         ===================================================================== */}
      <section className="py-16 sm:py-20 border-b border-[#ece6dc]/14 bg-[#141210]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-editorial text-2xl sm:text-3xl font-extrabold text-[#f7f4ee]">
              {locale === 'fa'
                ? 'خط تولید و تراشکاری مستقیم کارگاه آرو'
                : 'Inside the AruStore Metalwork Line'}
            </h2>
            <span className="text-xs text-[#9e9589]">
              {locale === 'fa' ? 'بدون واسطه از کارخانه به دست مصرف‌کننده' : 'Direct from factory floor'}
            </span>
          </div>

          {/* Real Documentary Factory Photos */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-7 relative h-72 sm:h-96 overflow-hidden border border-[#ece6dc]/16">
              <img
                src="/images/banners/hero-aluminum-atelier.png"
                alt="تراشکاری ظروف آلومینیومی در کارگاه آرو"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-3 start-3 bg-[#11100e]/85 backdrop-blur-sm border border-[#ece6dc]/18 px-3.5 py-1.5 text-xs font-semibold text-[#f7f4ee]">
                {locale === 'fa'
                  ? 'واحد تراش و فرم‌دهی ظروف پایه‌دار'
                  : 'Lathe Turning & Fluting Station'}
              </div>
            </div>

            <div className="lg:col-span-5 relative h-72 sm:h-96 overflow-hidden border border-[#ece6dc]/16">
              <img
                src="/images/banners/hospitality-collection-banner.png"
                alt="کنترل کیفیت و پرداخت ظروف آلومینیومی"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-3 start-3 bg-[#11100e]/85 backdrop-blur-sm border border-[#ece6dc]/18 px-3.5 py-1.5 text-xs font-semibold text-[#f7f4ee]">
                {locale === 'fa'
                  ? 'واحد پرداخت نهایی و کنترل ضخامت'
                  : 'Buffing & Caliper Quality Control'}
              </div>
            </div>
          </div>

          {/* 4 Ultra-Concise Production Badges */}
          <div className="grid grid-cols-2 lg:grid-cols-4 border border-[#ece6dc]/14 divide-y lg:divide-y-0 divide-x divide-x-reverse divide-[#ece6dc]/14 bg-[#11100e]">
            {productionSteps.map((s) => (
              <div key={s.num} className="p-5 space-y-1">
                <span className="text-xs font-bold text-[#c59b5f]">{s.num}</span>
                <h3 className="font-editorial text-base sm:text-lg font-bold text-[#f7f4ee]">
                  {s.title}
                </h3>
                <p className="text-xs text-[#9e9589]">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================================
          3. TRAVERTINE STONE GALLERY — PRODUCTS SHOWCASE
         ===================================================================== */}
      <section className="bg-[#ece6dc] text-[#171512] py-16 sm:py-20 border-b border-[#171512]/15">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#171512]/15 pb-5">
            <h2 className="font-editorial text-2xl sm:text-4xl font-extrabold text-[#171512]">
              {locale === 'fa' ? 'تولیدات آماده ارسال' : 'Ready-to-Ship Vessels'}
            </h2>

            <div className="flex flex-wrap items-center gap-5">
              {[
                { id: 'all', label: locale === 'fa' ? 'همه (۸)' : 'All (8)' },
                { id: 'featured', label: dict.common.featured },
                { id: 'new', label: dict.common.newArrivals },
                { id: 'sale', label: dict.common.onSale },
              ].map((tab) => {
                const active = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`pb-2 text-xs sm:text-sm font-bold transition-colors relative ${
                      active
                        ? 'text-[#171512]'
                        : 'text-[#6e665c] hover:text-[#171512]'
                    }`}
                  >
                    <span>{tab.label}</span>
                    {active && (
                      <span className="absolute bottom-0 inset-x-0 h-[2px] bg-[#8a6430]" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} tone="stone" />
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================================
          4. ASYMMETRIC VISUAL COLLECTIONS (MINIMAL TEXT, FULL-FRAME PHOTOS)
         ===================================================================== */}
      <section className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-editorial text-2xl sm:text-3xl font-extrabold text-[#f7f4ee]">
            {locale === 'fa' ? 'دسته‌بندی محصولات' : 'Product Categories'}
          </h2>
          <Link
            href="/categories"
            className="text-xs font-bold text-[#dfc08e] hover:text-[#f7f4ee] inline-flex items-center gap-1.5"
          >
            <span>{locale === 'fa' ? 'همه دسته‌ها' : 'All'}</span>
            <DirArrow className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {CATEGORIES.map((cat, idx) => {
            const isWide = idx === 0 || idx === 3
            return (
              <Link
                key={cat.id}
                href={`/products?category=${cat.slug}`}
                className={`${
                  isWide ? 'md:col-span-7' : 'md:col-span-5'
                } group relative h-64 sm:h-72 overflow-hidden border border-[#ece6dc]/16 bg-[#141210]`}
              >
                <img
                  src={cat.image}
                  alt={cat.name_fa}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0d0c0a]/90 via-[#0d0c0a]/25 to-transparent" />
                <div className="absolute bottom-4 inset-x-5 flex items-end justify-between gap-3">
                  <div>
                    <span className="text-[11px] text-[#dfc08e] font-semibold">
                      {formatNumber(cat.product_count, locale)}{' '}
                      {locale === 'fa' ? 'مدل' : 'Models'}
                    </span>
                    <h3 className="font-editorial text-xl sm:text-2xl font-extrabold text-[#f7f4ee] mt-0.5">
                      {locale === 'fa' ? cat.name_fa : cat.name}
                    </h3>
                  </div>
                  <span className="p-2 bg-[#11100e]/85 border border-[#ece6dc]/20 text-[#dfc08e] group-hover:bg-[#c59b5f] group-hover:text-[#11100e] transition-colors">
                    <DirArrow className="w-4 h-4" />
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* =====================================================================
          5. STREAMLINED 3D WORKBENCH (#lab-3d)
         ===================================================================== */}
      <section id="lab-3d" className="pb-16 sm:pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <div className="atelier-corners border border-[#ece6dc]/20 bg-[#141210] grid grid-cols-1 lg:grid-cols-12">
          <div className="lg:col-span-5 p-6 sm:p-8 lg:border-e border-[#ece6dc]/14 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="text-xs font-bold text-[#c59b5f]">
                {locale === 'fa' ? 'کارگاه سه‌بعدی زنده' : 'LIVE 3D STUDIO'}
              </div>
              <h2 className="font-editorial text-2xl sm:text-3xl font-extrabold text-[#f7f4ee]">
                {locale === 'fa'
                  ? 'تست رنگ آبکاری و تفکیک قطعات'
                  : 'Test Finishes & Exploded Parts'}
              </h2>

              <div className="grid grid-cols-4 gap-2">
                {products.map((item, idx) => {
                  const selected = labProductIdx === idx
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setLabProductIdx(idx)
                        setLabColorIdx(0)
                      }}
                      className={`border overflow-hidden transition-all ${
                        selected
                          ? 'border-[#c59b5f] ring-1 ring-[#c59b5f]'
                          : 'border-[#ece6dc]/14 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={item.images[0]?.url}
                        alt={item.name_fa}
                        className="w-full h-14 object-cover"
                      />
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="border-t border-[#ece6dc]/14 pt-5 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="font-editorial text-lg font-bold text-[#f7f4ee]">
                    {getProductTitle(labProduct, locale)}
                  </h3>
                  <div className="text-sm font-extrabold text-[#dfc08e] mt-0.5">
                    {formatPrice(labProduct.price, locale, labProduct.price_toman)}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {labProduct.colors.map((c, idx) => (
                    <button
                      key={c.id}
                      onClick={() => setLabColorIdx(idx)}
                      title={locale === 'fa' ? c.name_fa : c.name}
                      className={`w-6 h-6 rounded-full border transition-transform ${
                        labColorIdx === idx
                          ? 'scale-115 border-[#f7f4ee] ring-2 ring-[#c59b5f]'
                          : 'border-[#ece6dc]/30 opacity-75'
                      }`}
                      style={{
                        background: `linear-gradient(135deg, ${c.hex} 48%, ${c.accentHex} 100%)`,
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => setLabExploded((v) => !v)}
                  className={`py-2.5 px-3 rounded-[2px] text-xs font-bold flex items-center justify-center gap-1.5 border transition-colors ${
                    labExploded
                      ? 'bg-[#c59b5f]/20 border-[#c59b5f] text-[#dfc08e]'
                      : 'border-[#ece6dc]/20 text-[#d6cfc4]'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>{locale === 'fa' ? 'تفکیک قطعات' : 'Explode'}</span>
                </button>

                <button
                  onClick={() => addToCart(labProduct, 1, labColor)}
                  className="py-2.5 px-4 rounded-[2px] satin-brass-btn font-bold text-xs flex items-center justify-center gap-1.5"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>{dict.common.addToCart}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 h-[380px] sm:h-[460px] relative overflow-hidden cursor-grab active:cursor-grabbing bg-[radial-gradient(circle_at_50%_50%,rgba(197,155,95,0.1)_0%,rgba(13,12,10,0.98)_74%)] border-t lg:border-t-0 border-[#ece6dc]/14">
            <StudioScene3D
              archetype={labProduct.archetype}
              bodyColor={labColor.hex}
              accentColor={labColor.accentHex}
              exploded={labExploded}
              wireframe={labWireframe}
              allowZoom={true}
              fallbackImage={labProduct.images[0]?.url}
            />
            <button
              onClick={() => setLabWireframe((v) => !v)}
              className={`absolute top-4 end-4 px-3 py-1.5 font-mono text-[11px] border ${
                labWireframe
                  ? 'bg-[#d8dce0] text-[#11100e] border-[#d8dce0] font-bold'
                  : 'bg-[#0d0c0a]/90 text-[#d6cfc4] border-[#ece6dc]/20'
              }`}
            >
              CAD
            </button>
          </div>
        </div>
      </section>

      {/* =====================================================================
          6. COMPACT FACTORY VOUCHER BAR (ARU3D)
         ===================================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="border border-[#c59b5f]/40 bg-[#171512] p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div>
            <h3 className="font-editorial text-xl sm:text-2xl font-extrabold text-[#f7f4ee]">
              {locale === 'fa'
                ? '۱۵٪ تخفیف خرید مستقیم کارخانه و سرویس کامل جهیزیه'
                : '15% Direct Factory Discount on Bridal & Wholesale Sets'}
            </h3>
            <p className="text-xs text-[#9e9589] mt-1">
              {locale === 'fa'
                ? 'ارسال با فوم قالبی ضدضربه و ضمانت‌نامه ۵ ساله ثبات رنگ'
                : 'Shipped in molded protective foam with 5-year colorfast warranty'}
            </p>
          </div>

          <button
            onClick={copyPromo}
            className="px-5 py-3 rounded-[2px] brushed-metal-btn font-bold text-xs sm:text-sm flex items-center gap-2.5 flex-shrink-0"
          >
            <Copy className="w-4 h-4" />
            <span>{locale === 'fa' ? 'کپی کد تخفیف:' : 'Copy Code:'}</span>
            <span className="font-mono font-extrabold tracking-wider">ARU3D</span>
          </button>
        </div>
      </section>
    </div>
  )
}
