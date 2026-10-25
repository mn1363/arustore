'use client'

import React, { useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Layers, Rotate3d, ShoppingBag } from 'lucide-react'
import { useStore } from '@/lib/store/useStore'
import { formatPrice } from '@/lib/utils'
import { getDict } from '@/lib/data/i18n'

const StudioScene3D = dynamic(() => import('./StudioScene3D'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-9 h-9 border-2 border-white/15 border-t-[#dfc08e] rounded-full animate-spin" />
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

  const currentColor =
    activeProduct.colors[selectedColorIdx] || activeProduct.colors[0]

  return (
    <div className="relative rounded-3xl hero-sanctuary-stage overflow-hidden">
      {/* Subtle Sanctuary Portal Arch Line (Level 4 Decorative Framing) */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 w-full h-44 opacity-35"
        viewBox="0 0 600 180"
        fill="none"
        preserveAspectRatio="none"
      >
        <path
          d="M40 180C40 72 156 14 300 14C444 14 560 72 560 180"
          stroke="url(#heroPortalGlow)"
          strokeWidth="1.2"
        />
        <defs>
          <linearGradient id="heroPortalGlow" x1="300" y1="14" x2="300" y2="180" gradientUnits="userSpaceOnUse">
            <stop stopColor="#dfc08e" stopOpacity="0.85" />
            <stop offset="1" stopColor="#7ea6e0" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      {/* Interactive 3D Sanctuary Stage */}
      <div className="relative h-[350px] sm:h-[420px] w-full cursor-grab active:cursor-grabbing select-none">
        <StudioScene3D
          archetype={activeProduct.archetype}
          bodyColor={currentColor.hex}
          accentColor={currentColor.accentHex}
          exploded={exploded}
          wireframe={false}
          allowZoom={true}
          fallbackImage={activeProduct.images[0]?.url}
        />

        {/* Level 4 Floating Controls */}
        <div className="absolute top-4 inset-x-4 flex items-center justify-between gap-2 pointer-events-none">
          <div className="pointer-events-auto glass-pill rounded-full px-3 py-1.5 flex items-center gap-2">
            {activeProduct.colors.map((c, idx) => (
              <button
                key={c.id}
                onClick={() => setSelectedColorIdx(idx)}
                title={locale === 'fa' ? c.name_fa : c.name}
                aria-label={locale === 'fa' ? c.name_fa : c.name}
                className={`w-4 h-4 rounded-full transition-transform border ${
                  selectedColorIdx === idx
                    ? 'scale-125 border-white shadow-[0_0_10px_rgba(223,192,142,0.55)]'
                    : 'border-white/25 opacity-75 hover:opacity-100'
                }`}
                style={{
                  background: `linear-gradient(135deg, ${c.hex} 48%, ${c.accentHex} 100%)`,
                }}
              />
            ))}
          </div>

          <button
            onClick={() => setExploded((v) => !v)}
            className={`pointer-events-auto px-3.5 py-1.5 rounded-full text-xs flex items-center gap-1.5 transition-all ${
              exploded
                ? 'champagne-btn font-bold'
                : 'glass-pill text-[#e4e6eb] hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{locale === 'fa' ? 'نمای قطعات' : 'Parts'}</span>
          </button>
        </div>

        {/* Quiet 360° Interaction Cue */}
        <div className="pointer-events-none absolute bottom-3 start-4 hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#08090f]/65 border border-white/[0.08] text-[11px] text-[#979fb2]">
          <Rotate3d className="w-3.5 h-3.5 text-[#dfc08e]" />
          <span>{locale === 'fa' ? 'چرخش ۳۶۰ درجه با لمس یا ماوس' : 'Drag to rotate 360°'}</span>
        </div>
      </div>

      {/* Product Information & Physical CTA Dock */}
      <div className="px-5 py-4 border-t border-white/[0.08] bg-[#0e111b]/85 backdrop-blur-md flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href={`/product/${activeProduct.slug}`}>
            <h3 className="text-base sm:text-lg font-bold text-[#f4f4f6] hover:text-[#dfc08e] transition-colors">
              {locale === 'fa' ? activeProduct.name_fa : activeProduct.name}
            </h3>
          </Link>
          <div className="text-xs text-[#979fb2] mt-0.5">
            {locale === 'fa' ? currentColor.name_fa : currentColor.name}
          </div>
        </div>

        <div className="flex items-center gap-3 ms-auto">
          <span className="text-sm sm:text-base font-bold text-[#dfc08e]">
            {formatPrice(activeProduct.price, locale, activeProduct.price_toman)}
          </span>
          <button
            onClick={() => addToCart(activeProduct, 1, currentColor)}
            className="px-4 py-2 rounded-xl champagne-btn font-bold text-xs flex items-center gap-1.5"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>{dict.common.addToCart}</span>
          </button>
        </div>
      </div>

      {/* 4 Dimensional Pedestal Switcher Tiles */}
      <div className="grid grid-cols-4 border-t border-white/[0.07] divide-x divide-x-reverse divide-white/[0.06] bg-[#090b12]">
        {showcaseProducts.map((item, idx) => {
          const selected = idx === activeIdx
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveIdx(idx)
                setSelectedColorIdx(0)
              }}
              className={`p-2.5 flex items-center justify-center gap-2.5 transition-all ${
                selected
                  ? 'bg-gradient-to-b from-[#1a2032] to-[#111522] shadow-[inset_0_2px_0_#dfc08e]'
                  : 'opacity-65 hover:opacity-100 hover:bg-white/[0.03]'
              }`}
            >
              <img
                src={item.images[0]?.url}
                alt={item.name_fa}
                className="w-11 h-8 object-cover rounded-md border border-white/[0.08]"
              />
              <span className="text-xs font-medium text-[#e8ebf2] truncate hidden sm:inline">
                {locale === 'fa' ? item.name_fa.split(' ')[0] : item.name.split(' ')[0]}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
