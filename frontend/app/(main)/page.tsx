'use client'

import React, { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpLeft,
  ArrowUpRight,
  Check,
  Copy,
  Layers,
  Rotate3d,
  ShoppingBag,
} from 'lucide-react'
import HeroStage3D from '@/components/three/HeroStage3D'
import ProductCard from '@/components/product/ProductCard'
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

  // Interactive 3D Aluminum Atelier Workbench State
  const [labProductIdx, setLabProductIdx] = useState(0)
  const labProduct = products[labProductIdx] || products[0]
  const [labColorIdx, setLabColorIdx] = useState(0)
  const [labExploded, setLabExploded] = useState(true)
  const [labWireframe, setLabWireframe] = useState(false)
  const labColor = labProduct.colors[labColorIdx] || labProduct.colors[0]

  // Seasonal Atelier Allocation Timer
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
  const CornerArrow = locale === 'fa' ? ArrowUpLeft : ArrowUpRight

  const copyPromo = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText('ARU3D').catch(() => {})
    }
    pushToast({
      title: locale === 'fa' ? 'کد مستقیم کارگاه ARU3D کپی شد' : 'Atelier Code ARU3D copied',
      description:
        locale === 'fa'
          ? '۱۵٪ کسر قیمت ویژه سفارش مستقیم و سرویس جهیزیه'
          : '15% direct commission privilege applied at checkout',
      type: 'success',
    })
  }

  const foundryChapters = [
    {
      numeral: locale === 'fa' ? '۰۱' : '01',
      spec: '680°C · GRAVITY INGOT CAST',
      title: locale === 'fa' ? 'ریخته‌گری ثقلی از شمش خالص خوراکی' : 'Pure 99.7% Ingot Gravity Casting',
      desc:
        locale === 'fa'
          ? 'هر قطعه نه از ورق نازک پرسی و نه از آلیاژهای شکننده زاماک، بلکه از شمش آلومینیوم خالص ۹۹.۷٪ بدون سرب در قالب‌های چدنی متراکم ریخته‌گری می‌شود تا ایستایی و سنگینی اصیل ظروف تشریفاتی را داشته باشد.'
          : 'Cast from virgin 99.7% lead-free aluminum ingots inside dense gravity molds—delivering substantial heirloom weight without brittle alloys.',
    },
    {
      numeral: locale === 'fa' ? '۰۲' : '02',
      spec: '±0.02 MM · 5-AXIS CNC & PLANISHING',
      title: locale === 'fa' ? 'هم‌نشینی تراش پنج‌محوره و چکش‌کاری دستی' : '5-Axis CNC Fluting & Hand Planishing',
      desc:
        locale === 'fa'
          ? 'شیارهای شعاعی میوه‌خوری لوتوس و رزوه ستون‌های شیرینی‌خوری با دقت دوصدم میلی‌متر توسط CNC تراش می‌خورند و بافت چکش‌خورده آجیل‌خوری زرین زیر دست استادکاران شکل می‌گیرد.'
          : 'Radial fluting and modular threads are milled to 0.02mm precision, then paired with hand-hammered artisanal facets.',
    },
    {
      numeral: locale === 'fa' ? '۰۳' : '03',
      spec: 'Ra 0.08 µm · SATIN WHEEL FINISH',
      title: locale === 'fa' ? 'پرداخت ساتن ابریشمی ضد لک و اثر انگشت' : 'Multi-Stage Satin & Mirror Buffing',
      desc:
        locale === 'fa'
          ? 'سطح فلز طی چهار مرحله برس‌زنی مویی و نمدکاری صیقل داده می‌شود تا بازتاب نور گرم و عمیق داشته باشد و برخلاف استیل براق، اثر انگشت و لکه قطرات آب روی آن نماند.'
          : 'Four progressive buffing stages impart a warm, velvety metallic sheen that resists water spots and fingerprints.',
    },
    {
      numeral: locale === 'fa' ? '۰۴' : '04',
      spec: '220°C · 25 µm KILN ANODIZE',
      title: locale === 'fa' ? 'آنودایز کوره‌ای؛ پایانِ سیاه شدن و جلاسنج' : '220°C Kiln-Baked Protective Anodize',
      desc:
        locale === 'fa'
          ? 'در مرحله پایانی، لایه اکسید محافظ شامپاینی، نقره‌ای یا برنزی در بطن آلومینیوم نفوذ کرده و در کوره ۲۲۰ درجه تثبیت می‌شود؛ نتیجه‌ای که در برابر اسید میوه، چای داغ و رطوبت، مادام‌العمر تغییر رنگ نمی‌دهد.'
          : 'Electrochemically fused at 220°C so champagne, silver, and bronze tones never tarnish, oxidize black, or require polishing.',
    },
  ]

  const collectionSpecs = [
    'H: 420 MM · MODULAR TIERS',
    'CNC ENGRAVED · HEAT SAFE',
    'HAND-HAMMERED · LIDDED',
    'SCULPTURAL · TWO-TONE AL',
  ]

  return (
    <div>
      {/* =====================================================================
          MOVEMENT I — ARCHITECTURAL EXHIBITION HERO (SMOKED BASALT)
         ===================================================================== */}
      <section className="border-b border-[#ece6dc]/14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top Exhibition Folio Coordinate Bar */}
          <div className="py-3.5 border-b border-[#ece6dc]/12 flex flex-wrap items-center justify-between gap-3 text-[11px] text-[#9e9589]">
            <div className="flex items-center gap-3">
              <span className="font-mono text-[10px] tracking-[0.22em] text-[#c59b5f] uppercase">
                FOLIO NO. 04 — 1405
              </span>
              <span className="text-[#ece6dc]/20">/</span>
              <span>
                {locale === 'fa'
                  ? 'مجموعه ظروف پذیرایی ریخته‌گری و تراش آلومینیوم خالص'
                  : 'Architectural Cast-Aluminum Reception Objects'}
              </span>
            </div>
            <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-[#bfb6a8]">
              {locale === 'fa' ? 'نمایش زنده سه‌بعدی هر ۸ اثر' : 'INTERACTIVE 360° CAD SALON'}
            </div>
          </div>

          {/* Asymmetric 12-Col Split with Vertical Architectural Hairline */}
          <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
            {/* Editorial Manifesto Column */}
            <div className="lg:col-span-5 py-8 sm:py-12 lg:pe-9 lg:border-e border-[#ece6dc]/12 flex flex-col justify-between space-y-8">
              <div className="space-y-6">
                <div className="font-mono text-[11px] tracking-[0.2em] uppercase text-[#c59b5f]">
                  {locale === 'fa'
                    ? 'کارگاه فلزتراشی و تالار آرو استور'
                    : 'ARUSTORE METALWORK FOUNDRY'}
                </div>

                <h1 className="font-editorial text-5xl sm:text-6xl xl:text-[4.15rem] font-bold leading-[1.06] tracking-tight text-[#f7f4ee]">
                  {locale === 'fa' ? (
                    <>
                      وقارِ نقره،
                      <span className="block text-[#dfc08e] mt-1">
                        ماندگاریِ آلومینیوم خالص؛
                      </span>
                      <span className="block text-3xl sm:text-4xl text-[#d6cfc4] font-normal mt-2">
                        تراش‌خورده برای میزهای اصیل ایرانی.
                      </span>
                    </>
                  ) : (
                    <>
                      The Poise of Silver,
                      <span className="block text-[#dfc08e] italic mt-1">
                        Cast in Pure Aluminum.
                      </span>
                    </>
                  )}
                </h1>

                <p className="text-sm sm:text-[15px] text-[#b9b0a2] leading-[1.9] border-s-2 border-[#c59b5f] ps-4">
                  {locale === 'fa'
                    ? 'ظروفی که نه سیاه می‌شوند و نه به جلاسنج نیاز دارند. پیش از سفارش، هر شیرینی‌خوری، میوه‌خوری یا کشکول را روی میز گردان سه‌بعدی بچرخانید، پوشش آنودایز را عوض کنید و جزئیات اتصال قطعات ریخته‌گری را از نزدیک ببینید.'
                    : dict.hero.subtitle}
                </p>

                {/* Tactile Metal & Hairline CTAs */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <Link
                    href="/products"
                    className="px-6 py-3.5 rounded-[2px] brushed-metal-btn font-bold text-xs sm:text-sm flex items-center gap-2.5 transition-all"
                  >
                    <span>
                      {locale === 'fa' ? 'ورود به تالار ظروف' : dict.hero.ctaPrimary}
                    </span>
                    <DirArrow className="w-4 h-4" />
                  </Link>

                  <a
                    href="#lab-3d"
                    className="px-5 py-3.5 rounded-[2px] border border-[#ece6dc]/22 hover:border-[#c59b5f] text-[#f3efe8] text-xs sm:text-sm font-medium flex items-center gap-2 transition-colors"
                  >
                    <Rotate3d className="w-4 h-4 text-[#c59b5f]" />
                    <span>
                      {locale === 'fa' ? 'میز مهندسی و تفکیک قطعات' : dict.hero.ctaSecondary}
                    </span>
                  </a>
                </div>
              </div>

              {/* Engraved 3-Cell Foundry Ledger (No Rounded SaaS Boxes) */}
              <div className="border-y border-[#ece6dc]/14 grid grid-cols-3 divide-x divide-x-reverse divide-[#ece6dc]/14">
                <div className="py-3.5 pe-3">
                  <div className="font-mono text-xs sm:text-sm font-semibold text-[#f7f4ee]">
                    99.7% AL
                  </div>
                  <div className="text-[11px] text-[#9e9589] mt-0.5">
                    {locale === 'fa' ? 'شمش خالص خوراکی' : 'Pure Food-Safe Ingot'}
                  </div>
                </div>
                <div className="py-3.5 px-3">
                  <div className="font-mono text-xs sm:text-sm font-semibold text-[#dfc08e]">
                    220°C SEAL
                  </div>
                  <div className="text-[11px] text-[#9e9589] mt-0.5">
                    {locale === 'fa' ? '۵ سال ضمانت رنگ' : '5-Year Tarnish-Free'}
                  </div>
                </div>
                <div className="py-3.5 ps-3">
                  <div className="font-mono text-xs sm:text-sm font-semibold text-[#d8dce0]">
                    360° CAD
                  </div>
                  <div className="text-[11px] text-[#9e9589] mt-0.5">
                    {locale === 'fa' ? 'وارسی سه‌بعدی زنده' : 'Live 3D Inspection'}
                  </div>
                </div>
              </div>
            </div>

            {/* 3D Rotary Specimen Plinth Column */}
            <div className="lg:col-span-7 py-8 sm:py-10 lg:ps-9 flex items-center">
              <HeroStage3D />
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          MOVEMENT II — ENGRAVED PRODUCTION HOUSES RIBBON
         ===================================================================== */}
      <section className="border-b border-[#ece6dc]/14 bg-[#0d0c0a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 divide-x divide-x-reverse divide-[#ece6dc]/10">
          {BRANDS.map((brand, idx) => (
            <Link
              key={brand.id}
              href={`/products?brand=${brand.slug}`}
              className="py-4 px-4 flex items-baseline justify-between gap-2 group hover:bg-[#161411] transition-colors"
            >
              <div>
                <div className="font-mono text-[10px] tracking-[0.2em] text-[#c59b5f]">
                  ATELIER 0{idx + 1}
                </div>
                <div className="font-editorial text-xl font-bold text-[#f3efe8] group-hover:text-[#dfc08e] mt-0.5">
                  {locale === 'fa' ? brand.name_fa : brand.name}
                </div>
                <div className="text-[11px] text-[#8c8377] line-clamp-1">
                  {locale === 'fa' ? brand.tagline_fa : brand.tagline}
                </div>
              </div>
              <CornerArrow className="w-3.5 h-3.5 text-[#7e766b] group-hover:text-[#c59b5f] flex-shrink-0" />
            </Link>
          ))}
        </div>
      </section>

      {/* =====================================================================
          MOVEMENT III — ASYMMETRIC ARCHITECTURAL GALLERY MOSAIC (COLLECTIONS)
         ===================================================================== */}
      <section className="py-20 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#ece6dc]/14 pb-6">
          <div>
            <div className="font-mono text-[10px] tracking-[0.22em] text-[#c59b5f] uppercase">
              {locale === 'fa' ? 'فهرست موضوعی آثار // چهار تالار' : 'CURATED CHAMBERS // I — IV'}
            </div>
            <h2 className="font-editorial text-4xl sm:text-5xl font-bold text-[#f7f4ee] mt-1">
              {locale === 'fa'
                ? 'چهار مجموعه تخصصی میزبان و پذیرایی'
                : 'Four Architectural Tableware Chambers'}
            </h2>
          </div>
          <Link
            href="/categories"
            className="text-xs font-medium text-[#dfc08e] hover:text-[#f7f4ee] inline-flex items-center gap-2 pb-1 border-b border-[#c59b5f]/50 self-start sm:self-auto"
          >
            <span>
              {locale === 'fa' ? 'مشاهده نمای کامل مجموعه‌ها' : 'View Full Directory'}
            </span>
            <DirArrow className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Asymmetric 7/5 + 5/7 Shared-Wall Blueprint */}
        <div className="grid grid-cols-1 lg:grid-cols-12 border border-[#ece6dc]/15 bg-[#141210]">
          {CATEGORIES.map((cat, idx) => {
            const isWide = idx === 0 || idx === 3
            return (
              <Link
                key={cat.id}
                href={`/products?category=${cat.slug}`}
                className={`${
                  isWide ? 'lg:col-span-7' : 'lg:col-span-5'
                } group relative p-6 sm:p-9 border-b lg:border-b border-[#ece6dc]/14 ${
                  idx % 2 === 0 ? 'lg:border-e' : ''
                } ${idx >= 2 ? 'lg:border-b-0' : ''} hover:bg-[#1a1714] transition-colors flex flex-col justify-between min-h-[300px] overflow-hidden`}
              >
                {/* Top Index & Spec */}
                <div className="flex items-start justify-between gap-4 relative z-10">
                  <div className="flex items-baseline gap-3">
                    <span className="font-editorial text-4xl sm:text-5xl text-[#c59b5f]/80 leading-none">
                      {locale === 'fa' ? `۰${idx + 1}` : `0${idx + 1}`}
                    </span>
                    <span className="font-mono text-[10px] tracking-[0.18em] text-[#8c8377] uppercase">
                      {collectionSpecs[idx]}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] px-2 py-1 border border-[#ece6dc]/15 text-[#c9c0b3]">
                    {formatNumber(cat.product_count, locale)}{' '}
                    {locale === 'fa' ? 'اثر' : 'PCS'}
                  </span>
                </div>

                {/* Asymmetric Vessel Presentation */}
                <div
                  className={`my-6 flex ${
                    isWide
                      ? 'flex-col sm:flex-row items-center gap-6'
                      : 'flex-col items-center text-center'
                  } relative z-10`}
                >
                  <div className="relative w-44 h-40 sm:w-48 sm:h-44 flex-shrink-0 flex items-center justify-center">
                    <div className="pointer-events-none absolute inset-x-4 top-2 bottom-0 arch-niche border border-[#ece6dc]/10 bg-[#11100e]/80 group-hover:border-[#c59b5f]/40 transition-colors" />
                    <img
                      src={cat.image}
                      alt={cat.name_fa}
                      className="relative z-10 max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-500 drop-shadow-[0_20px_28px_rgba(0,0,0,0.75)]"
                    />
                  </div>

                  <div className={isWide ? 'space-y-2 flex-1' : 'space-y-2 mt-4'}>
                    <h3 className="font-editorial text-3xl font-bold text-[#f7f4ee] group-hover:text-[#dfc08e] transition-colors">
                      {locale === 'fa' ? cat.name_fa : cat.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#9e9589] leading-relaxed max-w-md">
                      {locale === 'fa' ? cat.description_fa : cat.description}
                    </p>
                  </div>
                </div>

                {/* Bottom Architectural Rule */}
                <div className="pt-3 border-t border-[#ece6dc]/10 flex items-center justify-between text-xs text-[#b9b0a2] group-hover:text-[#dfc08e]">
                  <span>
                    {locale === 'fa'
                      ? 'ورود به تالار و بررسی سه‌بعدی'
                      : 'Enter Chamber & Inspect in 3D'}
                  </span>
                  <DirArrow className="w-4 h-4 transition-transform group-hover:-translate-x-1 rtl:group-hover:-translate-x-1 ltr:group-hover:translate-x-1" />
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* =====================================================================
          MOVEMENT IV — SUNLIT YAZD TRAVERTINE GALLERY (LIGHT STONE CONTRAST!)
         ===================================================================== */}
      <section className="bg-[#ece6dc] text-[#171512] py-20 sm:py-24 border-y border-[#171512]/15">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          {/* Editorial Black-Ink Header & Minimalist Underline Filter Tabs */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-[#171512]/15 pb-6">
            <div className="space-y-1.5">
              <div className="font-mono text-[10px] tracking-[0.24em] text-[#8a6430] uppercase">
                {locale === 'fa'
                  ? 'ویترین سنگ تراورتن // عرضه مستقیم از کارخانه'
                  : 'TRAVERTINE SALON // DIRECT FOUNDRY RELEASE'}
              </div>
              <h2 className="font-editorial text-4xl sm:text-5xl font-bold text-[#171512]">
                {locale === 'fa'
                  ? 'آثار منتخب ظروف پذیرایی آلومینیوم'
                  : 'Signature Cast-Aluminum Vessels'}
              </h2>
            </div>

            {/* Underline Architectural Tabs (No SaaS Pills) */}
            <div className="flex flex-wrap items-center gap-5">
              {[
                { id: 'all', label: locale === 'fa' ? 'همه آثار (۸)' : 'All Pieces (8)' },
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

          {/* Museum Plinth Object Grid on Warm Stone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product, idx) => (
              <ProductCard
                key={product.id}
                product={product}
                tone="stone"
                indexNumber={idx}
              />
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================================
          MOVEMENT V — METALLURGICAL FOUNDRY DOSSIER (STICKY PLATE + LEDGER)
         ===================================================================== */}
      <section className="py-20 sm:py-28 border-b border-[#ece6dc]/14 bg-[#141210]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Column: Atelier Photographic Plate & Metallurgical Stamp */}
          <div className="lg:col-span-5 lg:sticky lg:top-28 space-y-5">
            <div className="font-mono text-[10px] tracking-[0.22em] text-[#c59b5f] uppercase">
              {locale === 'fa'
                ? 'پرونده متالورژی // چرخه ساخت در چهار گام'
                : 'METALLURGICAL DOSSIER // 4-STAGE CRAFT'}
            </div>
            <h2 className="font-editorial text-4xl sm:text-5xl font-bold text-[#f7f4ee] leading-[1.12]">
              {locale === 'fa'
                ? 'از شمش گداخته ۶۸۰ درجه تا درخشش ابریشمی روی میز شما'
                : 'From 680°C Molten Ingot to Silky Table Luster'}
            </h2>
            <p className="text-xs sm:text-sm text-[#9e9589] leading-relaxed">
              {locale === 'fa'
                ? 'برخلاف ظروف برنجی آب‌نقره‌شده که در مجاورت هوا سیاه می‌شوند و نیاز مداوم به جلاسنج دارند، آلومینیوم خالص آنودایزشده آرو استور هیچ‌گاه اکسید تیره نمی‌زند.'
                : 'Unlike silver-plated brass that oxidizes black, kiln-anodized pure aluminum stays luminous for generations.'}
            </p>

            {/* Framed Atelier Photograph */}
            <div className="atelier-corners border border-[#ece6dc]/18 bg-[#0d0c0a] p-2.5">
              <div className="relative h-64 sm:h-72 overflow-hidden">
                <img
                  src="/images/banners/hospitality-collection-banner.png"
                  alt="کارگاه تولید ظروف آلومینیومی آرو"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0d0c0a] via-transparent to-transparent" />
                <div className="absolute bottom-3 inset-x-3 flex items-center justify-between font-mono text-[10px] text-[#ece6dc] bg-[#0d0c0a]/85 px-3 py-1.5 border border-[#ece6dc]/15">
                  <span>MELT: 680°C</span>
                  <span>LEAD: 0.00%</span>
                  <span>OXIDE: 25 µm</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Hairline-Divided Foundry Chapters (Zero Boxy Cards) */}
          <div className="lg:col-span-7 border-t border-[#ece6dc]/16">
            {foundryChapters.map((ch) => (
              <div
                key={ch.numeral}
                className="py-7 sm:py-8 border-b border-[#ece6dc]/14 grid grid-cols-1 sm:grid-cols-12 gap-4 items-baseline group"
              >
                <div className="sm:col-span-3 flex sm:flex-col justify-between gap-2">
                  <span className="font-editorial text-5xl font-bold text-[#c59b5f]/85 leading-none">
                    {ch.numeral}
                  </span>
                  <span className="font-mono text-[10px] tracking-wider text-[#8c8377] uppercase">
                    {ch.spec}
                  </span>
                </div>
                <div className="sm:col-span-9 space-y-2">
                  <h3 className="font-editorial text-2xl sm:text-3xl font-bold text-[#f7f4ee] group-hover:text-[#dfc08e] transition-colors">
                    {ch.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#a89f93] leading-[1.85]">
                    {ch.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================================
          MOVEMENT VI — INDUSTRIAL CAD & ANODIZE WORKBENCH (#lab-3d)
         ===================================================================== */}
      <section id="lab-3d" className="py-20 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <div className="atelier-corners border border-[#ece6dc]/20 bg-[#0d0c0a]">
          {/* Engineering Console Title Bar */}
          <div className="px-5 sm:px-8 py-3.5 border-b border-[#ece6dc]/14 flex flex-wrap items-center justify-between gap-3 bg-[#141210]">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 bg-[#c59b5f]" />
              <span className="font-mono text-[11px] tracking-[0.2em] text-[#dfc08e] uppercase">
                WORKBENCH // 3D ANODIZE & MODULAR ASSEMBLY INSPECTOR
              </span>
            </div>
          <span className="font-mono text-[10px] text-[#8c8377]">
            SPECIMEN ARU-{100 + labProduct.id} · HEX {labColor.hex.toUpperCase()}
          </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12">
            {/* Control Drawer Column */}
            <div className="lg:col-span-5 p-6 sm:p-8 lg:border-e border-[#ece6dc]/14 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <h2 className="font-editorial text-3xl sm:text-4xl font-bold text-[#f7f4ee] leading-tight">
                  {locale === 'fa'
                    ? 'میز مهندسی انتخاب پوشش فلز و کالبدشکافی قطعات'
                    : 'Inspect Modular Casting & Test Anodize Finishes Live'}
                </h2>

                {/* 8-Vessel Numbered Specimen Matrix */}
                <div className="grid grid-cols-4 border border-[#ece6dc]/14 divide-x divide-y divide-x-reverse divide-[#ece6dc]/12 bg-[#13110e]">
                  {products.map((item, idx) => {
                    const selected = labProductIdx === idx
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setLabProductIdx(idx)
                          setLabColorIdx(0)
                        }}
                        className={`p-2.5 flex flex-col items-center gap-1.5 transition-colors ${
                          selected
                            ? 'bg-[#221e19] text-[#f7f4ee] ring-1 ring-inset ring-[#c59b5f]'
                            : 'text-[#8c8377] hover:bg-[#191613] hover:text-[#d6cfc4]'
                        }`}
                      >
                        <img
                          src={item.images[0]?.url}
                          alt={item.name_fa}
                          className="w-9 h-9 object-contain"
                        />
                        <span className="text-[10px] font-medium truncate w-full text-center">
                          {locale === 'fa' ? item.name_fa.split(' ')[0] : item.name.split(' ')[0]}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Selected Specimen Technical Sheet */}
              <div className="border border-[#ece6dc]/14 bg-[#141210] p-5 space-y-4">
                <div className="flex items-start justify-between gap-3 border-b border-[#ece6dc]/10 pb-3.5">
                  <div>
                    <h3 className="font-editorial text-2xl font-bold text-[#f7f4ee]">
                      {getProductTitle(labProduct, locale)}
                    </h3>
                    <div className="text-sm font-extrabold text-[#dfc08e] mt-0.5">
                      {formatPrice(labProduct.price, locale, labProduct.price_toman)}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 pt-1">
                    {labProduct.colors.map((c, idx) => (
                      <button
                        key={c.id}
                        onClick={() => setLabColorIdx(idx)}
                        title={locale === 'fa' ? c.name_fa : c.name}
                        className={`w-6 h-6 rounded-full border transition-transform ${
                          labColorIdx === idx
                            ? 'scale-110 border-[#f7f4ee] ring-2 ring-[#c59b5f]'
                            : 'border-[#ece6dc]/30 opacity-75'
                        }`}
                        style={{
                          background: `linear-gradient(135deg, ${c.hex} 48%, ${c.accentHex} 100%)`,
                        }}
                      />
                    ))}
                  </div>
                </div>

                <ul className="space-y-2 text-xs text-[#c9c0b3]">
                  {(locale === 'fa' ? labProduct.highlights_fa : labProduct.highlights).map(
                    (h, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-[#c59b5f] flex-shrink-0" />
                        <span>{h}</span>
                      </li>
                    )
                  )}
                </ul>

                <div className="grid grid-cols-2 gap-2.5 pt-2">
                  <button
                    onClick={() => setLabExploded((v) => !v)}
                    className={`py-2.5 px-3 rounded-[2px] text-xs font-bold flex items-center justify-center gap-1.5 border transition-colors ${
                      labExploded
                        ? 'bg-[#c59b5f]/20 border-[#c59b5f] text-[#dfc08e]'
                        : 'border-[#ece6dc]/20 text-[#d6cfc4] hover:border-[#ece6dc]/45'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>{locale === 'fa' ? 'نمای انفجاری' : 'Explode View'}</span>
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

            {/* Interactive 3D CAD Viewport */}
            <div className="lg:col-span-7 h-[400px] sm:h-[510px] relative overflow-hidden cursor-grab active:cursor-grabbing bg-[radial-gradient(circle_at_50%_50%,rgba(197,155,95,0.1)_0%,rgba(13,12,10,0.98)_74%)] border-t lg:border-t-0 border-[#ece6dc]/14">
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
                  className={`px-3 py-1.5 font-mono text-[11px] border transition-colors ${
                    labWireframe
                      ? 'bg-[#d8dce0] text-[#11100e] border-[#d8dce0] font-bold'
                      : 'bg-[#0d0c0a]/90 text-[#d6cfc4] border-[#ece6dc]/20'
                  }`}
                >
                  {dict.hero.wireframeToggle}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          MOVEMENT VII — BRIDAL & SHOWROOM COMMISSION PLAQUE (ARU3D)
         ===================================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="border border-[#c59b5f]/40 bg-[#171512] grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          <div className="lg:col-span-7 p-8 sm:p-12 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="font-mono text-[10px] tracking-[0.24em] text-[#c59b5f] uppercase">
                {locale === 'fa'
                  ? 'سهمیه مستقیم کارگاه // سرویس کامل جهیزیه و گالری‌ها'
                  : 'DIRECT FOUNDRY ALLOCATION // BRIDAL & TRADE SUITE'}
              </div>

              <h2 className="font-editorial text-3xl sm:text-5xl font-bold text-[#f7f4ee] leading-[1.12]">
                {locale === 'fa'
                  ? 'پانزده درصد کسر قیمت درب کارخانه برای ست هماهنگ پذیرایی'
                  : '15% Direct Atelier Privilege on Coordinated Reception Suites'}
              </h2>

              <p className="text-xs sm:text-sm text-[#b9b0a2] max-w-xl leading-relaxed">
                {locale === 'fa'
                  ? 'هنگام ثبت سفارش ست شیرینی‌خوری، میوه‌خوری، آجیل‌خوری و سینی آلومینیوم، کد ARU3D را در سبد سفارش وارد کنید تا همراه با فوم قالبی ضدضربه و ضمانت‌نامه ۵ ساله کتبی برایتان ارسال شود.'
                  : 'Apply foundry voucher ARU3D at checkout for 15% savings, custom foam crating, and our 5-year written anodize warranty.'}
              </p>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-4">
              {/* Engraved Voucher Button */}
              <button
                onClick={copyPromo}
                className="px-5 py-3.5 rounded-[2px] brushed-metal-btn font-bold text-xs sm:text-sm flex items-center gap-3"
              >
                <Copy className="w-4 h-4" />
                <span>{locale === 'fa' ? 'کپی کد کارگاه:' : 'Copy Code:'}</span>
                <span className="font-mono tracking-widest font-extrabold">ARU3D</span>
              </button>

              {/* Discrete Architectural Allocation Clock */}
              <div
                className="px-4 py-2.5 border border-[#ece6dc]/16 bg-[#11100e] font-mono text-xs text-[#dfc08e] flex items-center gap-2"
                dir="ltr"
              >
                <span className="text-[10px] text-[#8c8377] uppercase">BATCH CLOSES:</span>
                <span>
                  {String(hrs).padStart(2, '0')}:{String(mins).padStart(2, '0')}:
                  {String(secs).padStart(2, '0')}
                </span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 h-72 lg:h-auto relative overflow-hidden border-t lg:border-t-0 lg:border-s border-[#ece6dc]/14">
            <img
              src="/images/banners/hero-aluminum-atelier.png"
              alt="ست پذیرایی آلومینیومی آرو استور"
              className="w-full h-full object-cover object-center"
            />
          </div>
        </div>
      </section>

      {/* =====================================================================
          MOVEMENT VIII — EDITORIAL ARCHITECT & PATRON BROADSHEET (NO 5-STAR BOXES)
         ===================================================================== */}
      <section className="border-t border-[#ece6dc]/14 py-20 bg-[#11100e]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <div>
              <div className="font-mono text-[10px] tracking-[0.22em] text-[#c59b5f] uppercase">
                {locale === 'fa'
                  ? 'یادداشت معماران داخلی و خریداران'
                  : 'PATRON & ARCHITECTURAL NOTES'}
              </div>
              <h2 className="font-editorial text-4xl sm:text-5xl font-bold text-[#f7f4ee] mt-1">
                {locale === 'fa'
                  ? 'روایت میزهایی که با آرو چیده شده‌اند'
                  : 'On Dining Tables Across Tehran, Isfahan & Shiraz'}
              </h2>
            </div>
          </div>

          {/* 3-Column Hairline Broadsheet */}
          <div className="border-y border-[#ece6dc]/14 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-[#ece6dc]/14">
            {[
              {
                name: locale === 'fa' ? 'الناز شفیعی' : 'Elnaz Shafiei',
                role: locale === 'fa' ? 'معمار داخلی — نیاوران، تهران' : 'Interior Architect — Tehran',
                quote:
                  locale === 'fa'
                    ? 'کشکول دوپوست موج و شمعدان سه‌شاخه آرولوکس را برای سه پروژه مسکونی استفاده کردم. وقار آلومینیوم برس‌خورده در کنار برنز مات روی سنگ طبیعی، حس یک اثر موزه‌ای دست‌ساز را می‌دهد نه یک کالای بازاری.'
                    : 'The Mowj two-tone aluminum Kashkool sits on dark travertine tables like a museum sculpture rather than mass-market tableware.',
                piece: locale === 'fa' ? 'اثر انتخابی: کشکول آلومینیومی موج' : 'Piece: Mowj Kashkool',
              },
              {
                name: locale === 'fa' ? 'مهتاب رضایی' : 'Mahtab Rezaei',
                role: locale === 'fa' ? 'سفارش سرویس کامل جهیزیه — شیراز' : 'Bridal Suite Patron — Shiraz',
                quote:
                  locale === 'fa'
                    ? 'اینکه توانستم شیرینی‌خوری سه‌طبقه و میوه‌خوری لوتوس را قبل از خرید ۳۶۰ درجه بچرخانم و باز شدن پایه‌ها را ببینم، خیالم را از بابت کیفیت ساخت کاملاً راحت کرد.'
                    : 'Inspecting the threaded tiers in 360° 3D before ordering gave me complete confidence in the casting weight and champagne tone.',
                piece: locale === 'fa' ? 'اثر انتخابی: استند سه‌طبقه رویال' : 'Piece: Royal 3-Tier Stand',
              },
              {
                name: locale === 'fa' ? 'فرهاد کاظمی' : 'Farhad Kazemi',
                role: locale === 'fa' ? 'مدیر گالری ظروف فلزی — اصفهان' : 'Metalwork Gallery — Isfahan',
                quote:
                  locale === 'fa'
                    ? 'در اصفهان خریداران، فلز و تراش خوب را با یک نگاه می‌شناسند. ریخته‌گری بدون موج و آنودایز کوره‌ای آرو استور که هیچ‌وقت کدر نمی‌شود، استاندارد تازه‌ای در ظروف پذیرایی آلومینیومی ساخته است.'
                    : 'Zero casting porosity and kiln anodizing that never dulls—our most requested contemporary Iranian servingware line.',
                piece: locale === 'fa' ? 'همکار رسمی فروش گالری' : 'Authorized Showroom Partner',
              },
            ].map((item, idx) => (
              <article
                key={idx}
                className="py-8 md:py-10 md:px-7 first:md:ps-0 last:md:pe-0 flex flex-col justify-between space-y-6"
              >
                <div className="space-y-3">
                  <span className="font-editorial text-5xl leading-none text-[#c59b5f] block">
                    «
                  </span>
                  <p className="text-sm text-[#d6cfc4] leading-[1.95]">
                    {item.quote}
                  </p>
                </div>

                <div className="pt-4 border-t border-[#ece6dc]/10">
                  <div className="font-editorial text-2xl font-bold text-[#f7f4ee]">
                    {item.name}
                  </div>
                  <div className="text-xs text-[#9e9589]">{item.role}</div>
                  <div className="font-mono text-[10px] tracking-wider text-[#c59b5f] mt-1.5">
                    {item.piece}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
