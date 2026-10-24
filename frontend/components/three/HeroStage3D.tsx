'use client'

import React, { useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import {
  ArrowUpLeft,
  ArrowUpRight,
  Crown,
  Flame,
  Grid,
  Hammer,
  Layers,
  Rotate3d,
  ShoppingBag,
  Sparkles,
} from 'lucide-react'
import { useStore } from '@/lib/store/useStore'
import { formatPrice } from '@/lib/utils'
import { getDict } from '@/lib/data/i18n'

const StudioScene3D = dynamic(() => import('./StudioScene3D'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center gap-3">
      <div className="w-14 h-14 rounded-full border-2 border-amber-400/30 border-t-amber-400 animate-spin" />
      <span className="text-xs text-slate-400 tracking-wider">
        در حال بارگذاری گالری سه‌بعدی آلومینیوم...
      </span>
    </div>
  ),
})

export default function HeroStage3D() {
  const locale = useStore((s) => s.locale)
  const products = useStore((s) => s.products)
  const addToCart = useStore((s) => s.addToCart)
  const dict = getDict(locale)

  const showcaseSlugs = [
    'royal-3tier-aluminum-stand',
    'lotus-fluted-aluminum-fruit-bowl',
    'zarrin-hammered-aluminum-nut-dish',
    'isfahan-aluminum-tea-sugar-service',
  ]
  const showcaseProducts = showcaseSlugs
    .map((slug) => products.find((p) => p.slug === slug))
    .filter(Boolean) as typeof products

  const [activeIdx, setActiveIdx] = useState(0)
  const activeProduct = showcaseProducts[activeIdx] || products[0]
  const [selectedColorIdx, setSelectedColorIdx] = useState(0)
  const [exploded, setExploded] = useState(false)
  const [wireframe, setWireframe] = useState(false)

  const currentColor =
    activeProduct.colors[selectedColorIdx] || activeProduct.colors[0]

  const getIcon = (archetype: string) => {
    switch (archetype) {
      case 'fruit-bowl':
        return <Sparkles className="w-3.5 h-3.5" />
      case 'nut-dish':
        return <Crown className="w-3.5 h-3.5" />
      case 'tea-set':
        return <Flame className="w-3.5 h-3.5" />
      default:
        return <Layers className="w-3.5 h-3.5" />
    }
  }

  return (
    <div className="relative w-full">
      {/* Warm Champagne & Brushed Silver Gallery Glow */}
      <div
        className="pointer-events-none absolute -inset-6 rounded-[2.5rem] opacity-40 blur-3xl transition-colors duration-700"
        style={{
          background: `radial-gradient(circle at 50% 45%, ${currentColor.accentHex}50 0%, rgba(226,232,240,0.16) 48%, transparent 76%)`,
        }}
      />

      <div className="relative glass-panel rounded-[2rem] overflow-hidden border border-white/12">
        {/* Top HUD Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 pt-4 pb-2 border-b border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-amber-400 shadow-[0_0_12px_#f59e0b] animate-pulse" />
            <span className="text-xs font-semibold tracking-wide text-amber-200/95">
              {locale === 'fa'
                ? 'نمایشگاه سه‌بعدی زنده ظروف آلومینیوم • ۳۶۰°'
                : 'LIVE 360° ALUMINUM ATELIER'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <Rotate3d className="w-3.5 h-3.5 text-amber-400" />
            <span>{dict.hero.dragHint}</span>
          </div>
        </div>

        {/* Main Interactive 3D Canvas */}
        <div className="relative h-[375px] sm:h-[435px] lg:h-[465px] w-full cursor-grab active:cursor-grabbing select-none">
          <div
            className="pointer-events-none absolute inset-0 opacity-20 bg-center bg-no-repeat bg-contain transition-opacity duration-500"
            style={{
              backgroundImage: `url(${activeProduct.images[0]?.url})`,
              filter: 'blur(28px) saturate(1.2)',
            }}
          />

          <StudioScene3D
            archetype={activeProduct.archetype}
            bodyColor={currentColor.hex}
            accentColor={currentColor.accentHex}
            exploded={exploded}
            wireframe={wireframe}
            allowZoom={true}
            fallbackImage={activeProduct.images[0]?.url}
          />

          {/* Floating Material Finish & Exploded Assembly Controls */}
          <div className="absolute top-4 inset-x-4 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
            <div className="pointer-events-auto glass-pill rounded-full px-3 py-1.5 flex items-center gap-2">
              <span className="text-[11px] text-slate-300 hidden sm:inline">
                {locale === 'fa' ? 'آبکاری:' : 'Finish:'}
              </span>
              {activeProduct.colors.map((c, idx) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedColorIdx(idx)}
                  title={locale === 'fa' ? c.name_fa : c.name}
                  className={`w-5 h-5 rounded-full transition-all duration-200 border ${
                    selectedColorIdx === idx
                      ? 'scale-125 border-white ring-2 ring-amber-400/70'
                      : 'border-white/30 opacity-75 hover:opacity-100'
                  }`}
                  style={{
                    background: `linear-gradient(135deg, ${c.hex} 48%, ${c.accentHex} 100%)`,
                  }}
                />
              ))}
            </div>

            <div className="pointer-events-auto flex items-center gap-2">
              <button
                onClick={() => setExploded((v) => !v)}
                className={`glass-pill px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  exploded
                    ? 'bg-amber-500/25 border-amber-400/70 text-amber-200 shadow-neon-cyan'
                    : 'text-slate-200 hover:text-white hover:border-white/25'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span>{dict.hero.explodedToggle}</span>
              </button>

              <button
                onClick={() => setWireframe((v) => !v)}
                title={dict.hero.wireframeToggle}
                className={`glass-pill p-2 rounded-full text-xs transition-all ${
                  wireframe
                    ? 'bg-slate-200/25 border-slate-200 text-white'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {exploded && (
            <div className="pointer-events-none absolute bottom-4 inset-x-6 flex justify-center">
              <div className="glass-pill border-amber-400/40 bg-obsidian-950/80 px-4 py-1.5 rounded-full text-xs text-amber-200 flex items-center gap-2">
                <Hammer className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>
                  {locale === 'fa'
                    ? 'نمایش اجزای ریخته‌گری آلومینیوم، ستون پیچی و طبقات جداشونده فعال شد'
                    : 'Solid cast-aluminum base, threaded stem & modular tiers expanded'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Interactive Product Dock */}
        <div className="p-4 sm:p-5 border-t border-white/10 bg-obsidian-950/75 flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-400/30">
                  {locale === 'fa' ? activeProduct.badge_fa : activeProduct.badge}
                </span>
                <span className="text-xs text-slate-400">
                  {locale === 'fa' ? currentColor.name_fa : currentColor.name}
                </span>
              </div>
              <h3 className="text-base sm:text-xl font-extrabold text-white mt-1">
                {locale === 'fa' ? activeProduct.name_fa : activeProduct.name}
              </h3>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-end">
                <div className="text-base sm:text-lg font-extrabold text-amber-300">
                  {formatPrice(activeProduct.price, locale, activeProduct.price_toman)}
                </div>
                {activeProduct.compare_price && (
                  <div className="text-xs text-slate-500 line-through">
                    {formatPrice(
                      activeProduct.compare_price,
                      locale,
                      activeProduct.compare_price_toman
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={() => addToCart(activeProduct, 1, currentColor)}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500 text-slate-950 font-extrabold text-xs sm:text-sm hover:brightness-110 transition-all shadow-neon-cyan flex items-center gap-1.5"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{dict.common.addToCart}</span>
              </button>

              <Link
                href={`/product/${activeProduct.slug}`}
                className="p-2.5 rounded-xl glass-pill text-slate-200 hover:text-amber-300 hover:border-amber-400/40 transition-colors"
                title={dict.common.viewDetails}
              >
                {locale === 'fa' ? (
                  <ArrowUpLeft className="w-4 h-4" />
                ) : (
                  <ArrowUpRight className="w-4 h-4" />
                )}
              </Link>
            </div>
          </div>

          {/* 4-Piece Quick Selector */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {showcaseProducts.map((item, idx) => {
              const isSelected = idx === activeIdx
              const shortFa = item.name_fa
                .replace('آلومینیومی ', '')
                .replace('مدل ', '')
                .split(' ')
                .slice(0, 2)
                .join(' ')
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveIdx(idx)
                    setSelectedColorIdx(0)
                  }}
                  className={`flex items-center gap-2.5 p-2 rounded-xl border text-start transition-all ${
                    isSelected
                      ? 'bg-white/10 border-amber-400/65 text-white shadow-[0_0_20px_-6px_rgba(245,158,11,0.45)]'
                      : 'bg-white/[0.02] border-white/5 text-slate-400 hover:bg-white/[0.05] hover:text-slate-200'
                  }`}
                >
                  <div className="w-9 h-9 rounded-lg bg-obsidian-900 border border-white/10 p-1 flex-shrink-0 flex items-center justify-center overflow-hidden">
                    <img
                      src={item.images[0]?.url}
                      alt={item.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-bold truncate">
                      {locale === 'fa' ? shortFa : item.name.split(' ').slice(0, 2).join(' ')}
                    </div>
                    <div className="text-[10px] text-amber-400/90 flex items-center gap-1">
                      {getIcon(item.archetype)}
                      <span>3D 360°</span>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
