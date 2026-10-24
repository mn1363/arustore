'use client'

import React, { useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Layers, ShoppingBag } from 'lucide-react'
import { useStore } from '@/lib/store/useStore'
import { formatPrice } from '@/lib/utils'
import { getDict } from '@/lib/data/i18n'

const StudioScene3D = dynamic(() => import('./StudioScene3D'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-9 h-9 border-2 border-white/15 border-t-[#d6b88a] rounded-full animate-spin" />
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
    <div className="rounded-2xl bg-[#14161a] border border-white/[0.07] overflow-hidden shadow-soft">
      {/* Clean 3D Stage */}
      <div className="relative h-[360px] sm:h-[420px] w-full cursor-grab active:cursor-grabbing select-none bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.04)_0%,rgba(16,18,22,1)_75%)]">
        <StudioScene3D
          archetype={activeProduct.archetype}
          bodyColor={currentColor.hex}
          accentColor={currentColor.accentHex}
          exploded={exploded}
          wireframe={false}
          allowZoom={true}
          fallbackImage={activeProduct.images[0]?.url}
        />

        {/* Minimal Floating Finish Dots & Explode Toggle */}
        <div className="absolute top-4 inset-x-4 flex items-center justify-between gap-2 pointer-events-none">
          <div className="pointer-events-auto glass-pill rounded-full px-3 py-1.5 flex items-center gap-2">
            {activeProduct.colors.map((c, idx) => (
              <button
                key={c.id}
                onClick={() => setSelectedColorIdx(idx)}
                title={locale === 'fa' ? c.name_fa : c.name}
                className={`w-4 h-4 rounded-full transition-transform border ${
                  selectedColorIdx === idx
                    ? 'scale-125 border-white'
                    : 'border-white/25 opacity-70 hover:opacity-100'
                }`}
                style={{
                  background: `linear-gradient(135deg, ${c.hex} 48%, ${c.accentHex} 100%)`,
                }}
              />
            ))}
          </div>

          <button
            onClick={() => setExploded((v) => !v)}
            className={`pointer-events-auto glass-pill px-3 py-1.5 rounded-full text-xs flex items-center gap-1.5 transition-colors ${
              exploded
                ? 'bg-[#d6b88a] text-[#111215] font-bold border-transparent'
                : 'text-[#d4d6dc] hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{locale === 'fa' ? 'نمای قطعات' : 'Parts'}</span>
          </button>
        </div>
      </div>

      {/* Calm Product Bar */}
      <div className="px-5 py-4 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href={`/product/${activeProduct.slug}`}>
            <h3 className="text-base sm:text-lg font-bold text-[#f2f2f0] hover:text-[#d6b88a] transition-colors">
              {locale === 'fa' ? activeProduct.name_fa : activeProduct.name}
            </h3>
          </Link>
          <div className="text-xs text-[#8e93a0] mt-0.5">
            {locale === 'fa' ? currentColor.name_fa : currentColor.name}
          </div>
        </div>

        <div className="flex items-center gap-3 ms-auto">
          <span className="text-sm sm:text-base font-bold text-[#f2f2f0]">
            {formatPrice(activeProduct.price, locale, activeProduct.price_toman)}
          </span>
          <button
            onClick={() => addToCart(activeProduct, 1, currentColor)}
            className="px-4 py-2 rounded-xl champagne-btn font-bold text-xs flex items-center gap-1.5 transition-colors"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>{dict.common.addToCart}</span>
          </button>
        </div>
      </div>

      {/* 4 Minimal Switcher Thumbnails */}
      <div className="grid grid-cols-4 border-t border-white/[0.06] divide-x divide-x-reverse divide-white/[0.06] bg-[#101216]">
        {showcaseProducts.map((item, idx) => {
          const selected = idx === activeIdx
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveIdx(idx)
                setSelectedColorIdx(0)
              }}
              className={`p-2.5 flex items-center justify-center gap-2 transition-colors ${
                selected ? 'bg-[#1a1d24]' : 'opacity-60 hover:opacity-100'
              }`}
            >
              <img
                src={item.images[0]?.url}
                alt={item.name_fa}
                className="w-11 h-8 object-cover rounded-md"
              />
              <span className="text-xs font-medium text-[#e4e6eb] truncate hidden sm:inline">
                {locale === 'fa' ? item.name_fa.split(' ')[0] : item.name.split(' ')[0]}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
