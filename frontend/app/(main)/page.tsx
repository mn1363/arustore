'use client'

import React, { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  Award,
  CheckCircle2,
  Copy,
  Flame,
  Hammer,
  Layers,
  Rotate3d,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Wrench,
} from 'lucide-react'
import HeroStage3D from '@/components/three/HeroStage3D'
import ProductCard from '@/components/product/ProductCard'
import Card3DTilt from '@/components/ui/Card3DTilt'
import { CATEGORIES, BRANDS } from '@/lib/data/catalog'
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

  // Interactive 3D Aluminum Atelier Lab State
  const [labProductIdx, setLabProductIdx] = useState(0)
  const labProduct = products[labProductIdx] || products[0]
  const [labColorIdx, setLabColorIdx] = useState(0)
  const [labExploded, setLabExploded] = useState(true)
  const [labWireframe, setLabWireframe] = useState(false)
  const labColor = labProduct.colors[labColorIdx] || labProduct.colors[0]

  // Bridal / Seasonal Campaign Countdown
  const [secondsLeft, setSecondsLeft] = useState(18 * 3600 + 27 * 60 + 44)
  useEffect(() => {
    const id = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 86400))
    }, 1000)
    return () => clearInterval(id)
  }, [])

  const hrs = Math.floor(secondsLeft / 3600)
  const mins = Math.floor((secondsLeft % 3600) / 60)
  const secs = secondsLeft % 60

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
      title: locale === 'fa' ? 'کد تخفیف کارخانه ARU3D کپی شد!' : 'Atelier Code ARU3D copied!',
      description:
        locale === 'fa'
          ? '۱۵٪ تخفیف ویژه خرید مستقیم و سرویس جهیزیه'
          : '15% off direct atelier orders',
      type: 'success',
    })
  }

  const craftSteps = [
    {
      step: '۰۱',
      icon: Flame,
      title: locale === 'fa' ? 'ذوب و ریخته‌گری شمش خالص' : 'Pure 99.7% Ingot Casting',
      desc:
        locale === 'fa'
          ? 'استفاده از شمش آلومینیوم خالص خوراکی بدون سرب، با ریخته‌گری ثقلی و دایکست متراکم بدون حفره.'
          : 'Lead-free pure aluminum ingots cast in high-density gravity molds for heirloom weight.',
    },
    {
      step: '۰۲',
      icon: Wrench,
      title: locale === 'fa' ? 'تراش CNC و چکش‌کاری استادکاران' : '5-Axis CNC & Hand Hammering',
      desc:
        locale === 'fa'
          ? 'شیارزنی دقیق میوه‌خوری‌ها با دستگاه CNC و چکش‌کاری سنتی-مدرن روی ظروف آجیل‌خوری و اردوخوری.'
          : 'Precision radial fluting paired with artisanal hand-planished dimple textures.',
    },
    {
      step: '۰۳',
      icon: Sparkles,
      title: locale === 'fa' ? 'پرداخت ساتن و پولیش آینه‌ای' : 'Satin Brushing & Mirror Buff',
      desc:
        locale === 'fa'
          ? 'چند مرحله نمدکاری و برس‌زنی ظریف برای ایجاد درخشش ابریشمی که لک آب و اثر انگشت به جا نمی‌گذارد.'
          : 'Multi-stage wheel buffing for silky metallic luster that resists water spots.',
    },
    {
      step: '۰۴',
      icon: Award,
      title: locale === 'fa' ? 'آنودایز کوره‌ای ۱۰۰٪ رنگ‌ثابت' : '220°C Kiln-Baked Anodize',
      desc:
        locale === 'fa'
          ? 'پوشش آنودایز شامپاینی، سیلور و برنزی در دمای ۲۲۰ درجه؛ بدون سیاه شدن و بدون نیاز به جلاسنج.'
          : 'Permanent protective seal impervious to tarnish, fruit acids, and hot tea.',
    },
  ]

  return (
    <div className="space-y-24 pb-10">
      {/* 1. LUXURY 3D ALUMINUM SERVINGWARE HERO */}
      <section className="relative pt-4 sm:pt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
            {/* Hero Copy Column */}
            <div className="lg:col-span-6 space-y-6 text-center lg:text-start">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-pill border-amber-400/35 text-xs font-bold text-amber-300">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>{dict.hero.eyebrow}</span>
              </div>

              <h1 className="text-4xl sm:text-5xl xl:text-[3.5rem] font-black tracking-tight leading-[1.22] text-white">
                <span className="block">{dict.hero.titleLine1}</span>
                <span className="block text-gradient-spatial mt-2">
                  {dict.hero.titleHighlight}
                </span>
              </h1>

              <p className="text-sm sm:text-base text-slate-300/95 leading-relaxed max-w-xl mx-auto lg:mx-0">
                {dict.hero.subtitle}
              </p>

              {/* CTA Actions */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3.5 pt-2">
                <Link
                  href="/products"
                  className="px-7 py-4 rounded-2xl bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500 text-slate-950 font-black text-sm sm:text-base flex items-center gap-2.5 shadow-neon-cyan hover:brightness-110 transition-all"
                >
                  <span>{dict.hero.ctaPrimary}</span>
                  <DirArrow className="w-4 h-4" />
                </Link>

                <a
                  href="#lab-3d"
                  className="px-6 py-4 rounded-2xl glass-panel border border-white/15 hover:border-amber-400/55 text-white font-bold text-sm sm:text-base flex items-center gap-2 transition-all"
                >
                  <Rotate3d className="w-4 h-4 text-amber-400" />
                  <span>{dict.hero.ctaSecondary}</span>
                </a>
              </div>

              {/* Factory Guarantee Metrics */}
              <div className="pt-4 grid grid-cols-3 gap-3 max-w-lg mx-auto lg:mx-0">
                <div className="glass-panel rounded-2xl p-3.5 border border-white/[0.08]">
                  <div className="text-xl sm:text-2xl font-black text-white">
                    {locale === 'fa' ? '۹۹.۷٪' : '99.7%'}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {dict.hero.statsProducts}
                  </div>
                </div>
                <div className="glass-panel rounded-2xl p-3.5 border border-white/[0.08]">
                  <div className="text-xl sm:text-2xl font-black text-amber-300">
                    {locale === 'fa' ? '۵ سال' : '5 Years'}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {dict.hero.statsRating}
                  </div>
                </div>
                <div className="glass-panel rounded-2xl p-3.5 border border-white/[0.08]">
                  <div className="text-xl sm:text-2xl font-black text-slate-200">
                    {locale === 'fa' ? '۳۶۰° زنده' : '360° 3D'}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {dict.hero.statsWarranty}
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive 3D WebGL Aluminum Servingware Showroom */}
            <div className="lg:col-span-6">
              <HeroStage3D />
            </div>
          </div>
        </div>
      </section>

      {/* 2. PRODUCTION LINES RIBBON */}
      <section className="border-y border-white/[0.08] bg-obsidian-900/70 py-4 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-around gap-6 text-xs font-bold tracking-wider text-slate-300">
          {BRANDS.map((brand) => (
            <Link
              key={brand.id}
              href={`/products?brand=${brand.slug}`}
              className="flex items-center gap-2 hover:text-amber-300 transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>{locale === 'fa' ? brand.name_fa : brand.name}</span>
              <span className="text-[11px] text-slate-500 hidden sm:inline">
                — {locale === 'fa' ? brand.tagline_fa : brand.tagline}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. 3D SERVINGWARE COLLECTIONS (CATEGORIES) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
              {locale === 'fa' ? 'گروه‌های تولیدی کارخانه آرو' : 'ALUMINUM COLLECTIONS'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
              {locale === 'fa'
                ? 'انتخاب ظروف پذیرایی بر اساس کاربرد'
                : 'Explore Handcrafted Tableware Collections'}
            </h2>
          </div>
          <Link
            href="/categories"
            className="text-xs sm:text-sm font-bold text-amber-300 hover:text-white flex items-center gap-1.5"
          >
            <span>
              {locale === 'fa' ? 'مشاهده همه کلکسیون‌ها' : 'All Collections'}
            </span>
            <DirArrow className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {CATEGORIES.map((cat) => (
            <Link key={cat.id} href={`/products?category=${cat.slug}`}>
              <Card3DTilt
                glowColor={`${cat.accent}35`}
                className="glass-panel rounded-[1.85rem] p-5 h-full border border-white/10 hover:border-amber-400/40 flex flex-col justify-between group overflow-hidden"
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${cat.gradient} opacity-65 group-hover:opacity-100 transition-opacity`}
                />

                <div className="relative z-10 h-44 flex items-center justify-center p-2 translate-z-20">
                  <img
                    src={cat.image}
                    alt={cat.name_fa}
                    className="max-h-full max-w-full object-contain rounded-xl group-hover:scale-110 transition-transform duration-500 drop-shadow-[0_20px_30px_rgba(0,0,0,0.85)]"
                  />
                </div>

                <div className="relative z-10 pt-4 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span
                      className="text-[11px] font-bold px-2.5 py-0.5 rounded-full border"
                      style={{
                        color: cat.accent,
                        borderColor: `${cat.accent}45`,
                        backgroundColor: `${cat.accent}18`,
                      }}
                    >
                      {formatNumber(cat.product_count, locale)}{' '}
                      {locale === 'fa' ? 'مدل اختصاصی' : 'Models'}
                    </span>
                    <DirArrow className="w-4 h-4 text-slate-400 group-hover:text-amber-300 transition-colors" />
                  </div>
                  <h3 className="text-lg font-extrabold text-white">
                    {locale === 'fa' ? cat.name_fa : cat.name}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2">
                    {locale === 'fa' ? cat.description_fa : cat.description}
                  </p>
                </div>
              </Card3DTilt>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. SIGNATURE ALUMINUM SERVINGWARE SHOWCASE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">
              {locale === 'fa' ? 'ویترین مستقیم کارخانه • بدون واسطه' : 'DIRECT FROM ATELIER'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
              {locale === 'fa'
                ? 'ظروف پذیرایی آلومینیومی با نمای سه‌بعدی'
                : '3D Interactive Aluminum Servingware'}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl glass-panel border border-white/10">
            {[
              { id: 'all', label: dict.common.all },
              { id: 'featured', label: dict.common.featured },
              { id: 'new', label: dict.common.newArrivals },
              { id: 'sale', label: dict.common.onSale },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500 text-slate-950 shadow-neon-cyan'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 5. 4-STAGE ALUMINUM MANUFACTURING EXCELLENCE SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-3xl mx-auto space-y-2">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
            {locale === 'fa'
              ? 'فناوری تولید و متالورژی آرو استور'
              : 'METALLURGY & CRAFTSMANSHIP'}
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-white">
            {locale === 'fa'
              ? 'چگونه شمش آلومینیوم خالص را به اثر هنری پذیرایی تبدیل می‌کنیم؟'
              : 'From Pure Aluminum Ingot to Heirloom Tableware'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            {locale === 'fa'
              ? 'برخلاف ظروف برنجی نقره‌نما یا زاماک که به مرور سیاه و کدر می‌شوند، ظروف آلومینیوم آنودایزشده آرو استور مادام‌العمر درخشان، سبک، نشکن و قابل شستشو هستند.'
              : 'Unlike silver-plated brass that tarnishes black, our kiln-anodized pure aluminum stays luminous for decades with zero polishing.'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {craftSteps.map((c, idx) => {
            const Icon = c.icon
            return (
              <Card3DTilt
                key={idx}
                maxTilt={7}
                glowColor="rgba(245, 158, 11, 0.22)"
                className="glass-panel rounded-3xl p-6 border border-white/10 space-y-4 relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-400/30 text-amber-300">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-3xl font-black text-white/10">{c.step}</span>
                </div>
                <h3 className="text-base font-extrabold text-white">{c.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{c.desc}</p>
              </Card3DTilt>
            )
          })}
        </div>
      </section>

      {/* 6. INTERACTIVE 3D FINISH & ASSEMBLY ATELIER LAB */}
      <section id="lab-3d" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <div className="glass-panel rounded-[2.25rem] border border-amber-400/25 overflow-hidden relative">
          <div
            className="pointer-events-none absolute inset-0 opacity-18 bg-cover bg-center"
            style={{ backgroundImage: 'url(/images/banners/hero-aluminum-atelier.png)' }}
          />

          <div className="relative z-10 p-6 sm:p-10 lg:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-400/35 text-xs font-bold text-amber-200">
                <Hammer className="w-3.5 h-3.5 text-amber-300" />
                <span>
                  {locale === 'fa'
                    ? 'کارگاه سه‌بعدی انتخاب آبکاری و بررسی مونتاژ'
                    : '3D ANODIZE FINISH & ASSEMBLY STUDIO'}
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                {locale === 'fa'
                  ? 'رنگ آبکاری آلومینیوم و نحوه اتصال قطعات هر ۸ محصول را زنده تست کنید'
                  : 'Customize Aluminum Finishes & Inspect Modular Casting in 3D'}
              </h2>

              {/* 8-Vessel Selector Grid */}
              <div className="grid grid-cols-4 gap-2">
                {products.map((item, idx) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setLabProductIdx(idx)
                      setLabColorIdx(0)
                    }}
                    className={`p-2 rounded-2xl border transition-all flex flex-col items-center gap-1 ${
                      labProductIdx === idx
                        ? 'bg-amber-500/20 border-amber-400 text-white shadow-neon-cyan'
                        : 'bg-obsidian-950/75 border-white/10 text-slate-400 hover:border-white/30'
                    }`}
                  >
                    <img
                      src={item.images[0]?.url}
                      alt={item.name_fa}
                      className="w-10 h-10 object-contain rounded"
                    />
                    <span className="text-[10px] font-bold truncate w-full text-center">
                      {locale === 'fa' ? item.name_fa.split(' ')[0] : item.name.split(' ')[0]}
                    </span>
                  </button>
                ))}
              </div>

              <div className="rounded-2xl bg-obsidian-950/80 border border-white/10 p-5 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base sm:text-lg font-extrabold text-white">
                      {getProductTitle(labProduct, locale)}
                    </h3>
                    <div className="text-xs text-amber-300 font-bold mt-0.5">
                      {formatPrice(labProduct.price, locale, labProduct.price_toman)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {labProduct.colors.map((c, idx) => (
                      <button
                        key={c.id}
                        onClick={() => setLabColorIdx(idx)}
                        title={locale === 'fa' ? c.name_fa : c.name}
                        className={`w-6 h-6 rounded-full border-2 transition-transform ${
                          labColorIdx === idx
                            ? 'scale-125 border-white ring-2 ring-amber-400'
                            : 'border-white/30 opacity-75'
                        }`}
                        style={{
                          background: `linear-gradient(135deg, ${c.hex} 48%, ${c.accentHex} 100%)`,
                        }}
                      />
                    ))}
                  </div>
                </div>

                <ul className="space-y-1.5 text-xs text-slate-300">
                  {(locale === 'fa' ? labProduct.highlights_fa : labProduct.highlights).map(
                    (h, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                        <span>{h}</span>
                      </li>
                    )
                  )}
                </ul>

                <div className="flex flex-wrap gap-2.5 pt-2">
                  <button
                    onClick={() => setLabExploded((v) => !v)}
                    className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                      labExploded
                        ? 'bg-amber-500/25 border-amber-400 text-amber-200'
                        : 'bg-white/5 border-white/15 text-slate-200'
                    }`}
                  >
                    <Layers className="w-4 h-4" />
                    <span>{dict.hero.explodedToggle}</span>
                  </button>

                  <button
                    onClick={() => addToCart(labProduct, 1, labColor)}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>{dict.common.addToCart}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 h-[395px] sm:h-[485px] rounded-3xl bg-obsidian-950/85 border border-white/10 relative overflow-hidden cursor-grab active:cursor-grabbing">
              <StudioScene3D
                archetype={labProduct.archetype}
                bodyColor={labColor.hex}
                accentColor={labColor.accentHex}
                exploded={labExploded}
                wireframe={labWireframe}
                allowZoom={true}
                fallbackImage={labProduct.images[0]?.url}
              />

              <div className="absolute top-4 end-4 flex gap-2">
                <button
                  onClick={() => setLabWireframe((v) => !v)}
                  className={`glass-pill px-3 py-1.5 rounded-full text-xs font-bold ${
                    labWireframe ? 'text-amber-300 border-amber-400' : 'text-slate-300'
                  }`}
                >
                  {dict.hero.wireframeToggle}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. BRIDAL & WHOLESALE HOSPITALITY SET CAMPAIGN BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-[2.25rem] overflow-hidden relative border border-amber-400/30 glass-panel">
          <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
            <div className="lg:col-span-7 p-8 sm:p-12 space-y-5 relative z-10">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/15 border border-amber-400/35 text-amber-300 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  {locale === 'fa'
                    ? 'پکیج ویژه ست کامل پذیرایی جهیزیه و سفارش عمده گالری‌ها'
                    : 'COMPLETE BRIDAL & HOSPITALITY SUITE OFFER'}
                </span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-black text-white leading-tight">
                {locale === 'fa' ? (
                  <>
                    <span className="text-gradient-gold">۱۵٪ تخفیف کارخانه</span> روی ست
                    هماهنگ شیرینی‌خوری، میوه‌خوری، آجیل‌خوری و سینی آلومینیوم
                  </>
                ) : (
                  <>
                    Save <span className="text-gradient-gold">15% Direct</span> on Coordinated
                    Cast-Aluminum Reception Sets
                  </>
                )}
              </h2>

              <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
                {locale === 'fa'
                  ? 'با وارد کردن کد تخفیف ARU3D در سبد خرید، کل سرویس پذیرایی آلومینیومی خود را با قیمت درب کارخانه، بسته‌بندی فوم قالبی ضدضربه و ضمانت‌نامه ۵ ساله ثبات رنگ تحویل بگیرید.'
                  : 'Use atelier code ARU3D at checkout for 15% savings, custom molded foam packaging, and our 5-year colorfast warranty.'}
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <div className="flex items-center gap-2" dir="ltr">
                  {[
                    { val: hrs, label: locale === 'fa' ? 'ساعت' : 'HRS' },
                    { val: mins, label: locale === 'fa' ? 'دقیقه' : 'MIN' },
                    { val: secs, label: locale === 'fa' ? 'ثانیه' : 'SEC' },
                  ].map((unit, idx) => (
                    <div
                      key={idx}
                      className="w-16 py-2 rounded-2xl bg-obsidian-950/90 border border-white/10 text-center"
                    >
                      <div className="text-lg font-black text-amber-300">
                        {formatNumber(unit.val, locale).padStart(2, locale === 'fa' ? '۰' : '0')}
                      </div>
                      <div className="text-[10px] text-slate-400">{unit.label}</div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={copyPromo}
                  className="px-5 py-3.5 rounded-2xl bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 hover:brightness-110 transition-all shadow-neon-cyan"
                >
                  <Copy className="w-4 h-4" />
                  <span>{locale === 'fa' ? 'کپی کد تخفیف: ARU3D' : 'Copy Code: ARU3D'}</span>
                </button>
              </div>
            </div>

            <div className="lg:col-span-5 h-72 lg:h-[420px] relative overflow-hidden">
              <img
                src="/images/banners/hero-aluminum-atelier.png"
                alt="کارگاه هنری ظروف پذیرایی آلومینیومی آرو"
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-obsidian-950 via-obsidian-950/35 to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* 8. VERIFIED BUYER & SHOWROOM TESTIMONIALS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
            {locale === 'fa' ? 'رضایت مشتریان و گالری‌های سراسر کشور' : 'CLIENT TESTIMONIALS'}
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            {locale === 'fa'
              ? 'تجربه خریداران از کیفیت ساخت ظروف آلومینیومی آرو استور'
              : 'Trusted by Interior Designers, Brides & Fine Showrooms'}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              name: locale === 'fa' ? 'مهتاب رضایی — خریدار سرویس کامل جهیزیه' : 'Mahtab Rezaei — Bridal Collection',
              quote:
                locale === 'fa'
                  ? 'قبل از خرید تونستم شیرینی‌خوری سه‌طبقه و میوه‌خوری لوتوس رو ۳۶۰ درجه توی سایت بچرخونم و رنگ سیلور-شامپاینی رو دقیق انتخاب کنم. وقتی بسته به دستم رسید، درخشش فلز و سنگینی پایه‌ها فراتر از انتظارم بود!'
                  : 'Rotating the 3-tier pastry stand 360° in 3D before ordering made choosing the silver-champagne finish effortless. Truly heirloom quality.',
              product: locale === 'fa' ? 'شیرینی‌خوری سه‌طبقه رویال + میوه‌خوری لوتوس' : 'Royal 3-Tier Stand & Lotus Bowl',
            },
            {
              name: locale === 'fa' ? 'فرهاد کاظمی — مدیر گالری لوازم لوکس منزل' : 'Farhad Kazemi — Home Gallery Owner',
              quote:
                locale === 'fa'
                  ? 'سال‌هاست ظروف پذیرایی فلزی کار می‌کنیم؛ کیفیت ریخته‌گری بدون موج، تراش CNC دقیق و آنودایز کوره‌ای آرو استور که اصلاً سیاه نمیشه، رضایت صددرصدی مشتری‌های ما رو جلب کرده.'
                  : 'Zero casting porosity, razor-sharp CNC fluting, and tarnish-proof kiln anodizing. Our bestselling luxury servingware line.',
              product: locale === 'fa' ? 'همکار فروش عمده گالری' : 'Wholesale Showroom Partner',
            },
            {
              name: locale === 'fa' ? 'الناز شفیعی — طراح دکوراسیون داخلی' : 'Elnaz Shafiei — Interior Architect',
              quote:
                locale === 'fa'
                  ? 'کشکول دوپوست موج و شمعدان سه‌شاخه آرولوکس رو برای چندین پروژه مسکونی مدرن در فرشته و نیاوران استفاده کردم. ترکیب آلومینیوم برس‌خورده با طلایی مات روی سنگ مشکی فوق‌العاده می‌درخشه.'
                  : 'The Mowj two-tone aluminum Kashkool is my go-to sculptural centerpiece on dark marble dining tables.',
              product: locale === 'fa' ? 'کشکول آلومینیومی موج دوپوست' : 'Mowj Two-Tone Kashkool',
            },
          ].map((item, idx) => (
            <Card3DTilt
              key={idx}
              maxTilt={6}
              glowColor="rgba(245, 158, 11, 0.2)"
              className="glass-panel rounded-3xl p-6 border border-white/10 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-1 text-amber-400">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star key={s} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  «{item.quote}»
                </p>
              </div>
              <div className="pt-4 border-t border-white/[0.08]">
                <div className="text-sm font-bold text-white">{item.name}</div>
                <div className="text-[11px] text-amber-300 mt-0.5 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{item.product}</span>
                </div>
              </div>
            </Card3DTilt>
          ))}
        </div>
      </section>
    </div>
  )
}
