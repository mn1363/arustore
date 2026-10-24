'use client'

import React, { useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import {
  ArrowUpLeft,
  ArrowUpRight,
  Grid,
  Layers,
  Rotate3d,
  ShoppingBag,
} from 'lucide-react'
import { useStore } from '@/lib/store/useStore'
import { formatPrice } from '@/lib/utils'
import { getDict } from '@/lib/data/i18n'

const StudioScene3D = dynamic(() => import('./StudioScene3D'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center gap-3">
      <div className="w-11 h-11 border border-[#c59b5f]/40 border-t-[#c59b5f] rounded-full animate-spin" />
      <span className="font-mono text-[11px] text-[#9e9589] tracking-widest uppercase">
        LOADING 3D TURNTABLE...
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
    'mowj-sculptural-aluminum-kashkool',
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

  const ExternalIcon = locale === 'fa' ? ArrowUpLeft : ArrowUpRight

  return (
    <div className="relative w-full">
      <div className="atelier-corners border border-[#ece6dc]/18 bg-[#151310] overflow-hidden">
        {/* Top Engraved Vitrine Instrument Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-5 py-2.5 border-b border-[#ece6dc]/12 bg-[#0e0d0b]">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-[10px] tracking-[0.2em] text-[#c59b5f] uppercase">
              VITRINE 0{activeIdx + 1} / 04
            </span>
            <span className="text-[#ece6dc]/20">|</span>
            <span className="text-[11px] text-[#c9c0b3]">
              {locale === 'fa'
                ? 'میز گردان وارسی سه‌بعدی اثر'
                : '360° Rotary Specimen Plinth'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-[#9e9589]">
            <Rotate3d className="w-3.5 h-3.5 text-[#c59b5f]" />
            <span>{dict.hero.dragHint}</span>
          </div>
        </div>

        {/* Main 3D Rotary Viewport with Subtle Persian Arch Silhouette */}
        <div className="relative h-[370px] sm:h-[430px] lg:h-[455px] w-full cursor-grab active:cursor-grabbing select-none bg-[radial-gradient(circle_at_50%_48%,rgba(197,155,95,0.11)_0%,rgba(17,16,14,0.96)_72%)]">
          {/* Architectural Persian Arch Outline Behind 3D Vessel */}
          <div className="pointer-events-none absolute inset-x-12 sm:inset-x-20 top-7 bottom-9 arch-niche border border-[#ece6dc]/[0.08]" />

          <StudioScene3D
            archetype={activeProduct.archetype}
            bodyColor={currentColor.hex}
            accentColor={currentColor.accentHex}
            exploded={exploded}
            wireframe={wireframe}
            allowZoom={true}
            fallbackImage={activeProduct.images[0]?.url}
          />

          {/* Top-Overlay: Machined Anodize Swatches & CAD / Explode Switches */}
          <div className="absolute top-3.5 inset-x-3.5 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
            <div className="pointer-events-auto bg-[#0e0d0b]/90 border border-[#ece6dc]/16 px-3 py-1.5 flex items-center gap-2">
              <span className="font-mono text-[10px] tracking-wider uppercase text-[#9e9589] hidden sm:inline">
                {locale === 'fa' ? 'پوشش آنودایز:' : 'ANODIZE:'}
              </span>
              {activeProduct.colors.map((c, idx) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedColorIdx(idx)}
                  title={locale === 'fa' ? c.name_fa : c.name}
                  className={`w-5 h-5 rounded-full transition-all duration-200 border ${
                    selectedColorIdx === idx
                      ? 'scale-110 border-[#f7f4ee] ring-1 ring-[#c59b5f]'
                      : 'border-[#ece6dc]/30 opacity-75 hover:opacity-100'
                  }`}
                  style={{
                    background: `linear-gradient(135deg, ${c.hex} 48%, ${c.accentHex} 100%)`,
                  }}
                />
              ))}
            </div>

            <div className="pointer-events-auto flex items-center gap-1.5">
              <button
                onClick={() => setExploded((v) => !v)}
                className={`px-3 py-1.5 text-[11px] font-medium border flex items-center gap-1.5 transition-colors ${
                  exploded
                    ? 'bg-[#c59b5f] border-[#c59b5f] text-[#11100e] font-bold'
                    : 'bg-[#0e0d0b]/90 border-[#ece6dc]/16 text-[#d6cfc4] hover:border-[#c59b5f]/60'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{locale === 'fa' ? 'تفکیک قطعات' : 'Explode'}</span>
              </button>

              <button
                onClick={() => setWireframe((v) => !v)}
                title={dict.hero.wireframeToggle}
                className={`px-2.5 py-1.5 font-mono text-[10px] border flex items-center gap-1 transition-colors ${
                  wireframe
                    ? 'bg-[#d8dce0] border-[#d8dce0] text-[#11100e] font-bold'
                    : 'bg-[#0e0d0b]/90 border-[#ece6dc]/16 text-[#d6cfc4] hover:border-[#ece6dc]/40'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                <span>CAD</span>
              </button>
            </div>
          </div>

          {/* Bottom Vernier Degree Scale Bar */}
          <div
            className="pointer-events-none absolute bottom-0 inset-x-0 px-5 py-1.5 border-t border-[#ece6dc]/8 bg-[#0e0d0b]/70 flex items-center justify-between font-mono text-[9px] tracking-[0.22em] text-[#8a8175]"
            dir="ltr"
          >
            <span>000°</span>
            <span>|</span>
            <span>090°</span>
            <span className="text-[#c59b5f]">
              {exploded ? 'Z-AXIS // EXPANDED' : '180° // LIVE MESH'}
            </span>
            <span>270°</span>
            <span>|</span>
            <span>360°</span>
          </div>
        </div>

        {/* Museum Placard & Direct Commission Bar */}
        <div className="p-4 sm:p-5 border-t border-[#ece6dc]/14 bg-[#12110e] flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 font-mono text-[10px] tracking-wider text-[#c59b5f] uppercase">
              <span>ARU-{100 + activeProduct.id}</span>
              <span>·</span>
              <span className="font-sans text-[11px] text-[#a89f93]">
                {locale === 'fa' ? currentColor.name_fa : currentColor.name}
              </span>
            </div>
            <Link
              href={`/product/${activeProduct.slug}`}
              className="group inline-flex items-center gap-1.5 mt-0.5"
            >
              <h3 className="font-editorial text-2xl sm:text-[1.65rem] font-bold text-[#f7f4ee] group-hover:text-[#dfc08e] transition-colors leading-tight">
                {locale === 'fa' ? activeProduct.name_fa : activeProduct.name}
              </h3>
              <ExternalIcon className="w-4 h-4 text-[#9e9589] group-hover:text-[#dfc08e]" />
            </Link>
          </div>

          <div className="flex items-center gap-3.5 ms-auto">
            <div className="text-end">
              <div className="text-base sm:text-lg font-extrabold text-[#f7f4ee]">
                {formatPrice(activeProduct.price, locale, activeProduct.price_toman)}
              </div>
              {activeProduct.compare_price && (
                <div className="text-[11px] text-[#7e766b] line-through">
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
              className="px-4 py-2.5 rounded-[2px] satin-brass-btn font-bold text-xs flex items-center gap-1.5 transition-all"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>{dict.common.addToCart}</span>
            </button>
          </div>
        </div>

        {/* 4-Specimen Architectural Switcher Strip */}
        <div className="grid grid-cols-4 border-t border-[#ece6dc]/14 divide-x divide-x-reverse divide-[#ece6dc]/12 bg-[#0d0c0a]">
          {showcaseProducts.map((item, idx) => {
            const selected = idx === activeIdx
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveIdx(idx)
                  setSelectedColorIdx(0)
                }}
                className={`p-3 text-start transition-colors relative ${
                  selected
                    ? 'bg-[#1c1915] text-[#f7f4ee]'
                    : 'text-[#8c8377] hover:bg-[#151310] hover:text-[#d6cfc4]'
                }`}
              >
                {selected && (
                  <span className="absolute top-0 inset-x-0 h-[2px] bg-[#c59b5f]" />
                )}
                <div className="font-mono text-[10px] text-[#c59b5f]">
                  0{idx + 1}
                </div>
                <div className="text-[11px] sm:text-xs font-semibold truncate mt-0.5">
                  {locale === 'fa' ? item.name_fa : item.name}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
