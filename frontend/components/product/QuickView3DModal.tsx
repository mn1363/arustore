'use client'

import React, { useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Layers, ShoppingBag, ArrowUpLeft, ArrowUpRight } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import { useStore } from '@/lib/store/useStore'
import {
  formatPrice,
  getProductDescription,
  getProductTitle,
} from '@/lib/utils'
import { getDict } from '@/lib/data/i18n'

const StudioScene3D = dynamic(() => import('@/components/three/StudioScene3D'), {
  ssr: false,
})

export default function QuickView3DModal() {
  const product = useStore((s) => s.quickViewProduct)
  const setQuickViewProduct = useStore((s) => s.setQuickViewProduct)
  const locale = useStore((s) => s.locale)
  const addToCart = useStore((s) => s.addToCart)
  const dict = getDict(locale)

  const [colorIdx, setColorIdx] = useState(0)
  const [exploded, setExploded] = useState(false)

  if (!product) return null

  const activeColor = product.colors[colorIdx] || product.colors[0]

  return (
    <Modal
      open={Boolean(product)}
      onClose={() => {
        setQuickViewProduct(null)
        setExploded(false)
        setColorIdx(0)
      }}
      className="max-w-4xl"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12">
        <div className="lg:col-span-7 relative h-[330px] sm:h-[420px] bg-[#101216] border-b lg:border-b-0 lg:border-e border-white/[0.07]">
          <StudioScene3D
            archetype={product.archetype}
            bodyColor={activeColor.hex}
            accentColor={activeColor.accentHex}
            exploded={exploded}
            wireframe={false}
            allowZoom={true}
            fallbackImage={product.images[0]?.url}
          />

          <div className="absolute bottom-4 inset-x-4 flex justify-center">
            <button
              onClick={() => setExploded((v) => !v)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium border flex items-center gap-1.5 transition-colors ${
                exploded
                  ? 'bg-[#d6b88a] border-transparent text-[#111215] font-bold'
                  : 'glass-pill text-[#d4d6dc]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{locale === 'fa' ? 'نمای قطعات' : 'Parts'}</span>
            </button>
          </div>
        </div>

        <div className="lg:col-span-5 p-6 sm:p-7 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-[#f2f2f0]">
              {getProductTitle(product, locale)}
            </h2>

            <div className="text-xl font-bold text-[#d6b88a]">
              {formatPrice(product.price, locale, product.price_toman)}
            </div>

            <p className="text-xs sm:text-sm text-[#9ca0ab] leading-relaxed">
              {getProductDescription(product, locale)}
            </p>

            <div className="space-y-2 pt-1">
              <div className="text-xs text-[#9ca0ab]">
                {locale === 'fa' ? activeColor.name_fa : activeColor.name}
              </div>
              <div className="flex items-center gap-2.5">
                {product.colors.map((c, idx) => (
                  <button
                    key={c.id}
                    onClick={() => setColorIdx(idx)}
                    className={`w-6 h-6 rounded-full border transition-all ${
                      colorIdx === idx
                        ? 'scale-110 border-white'
                        : 'border-white/20 opacity-70 hover:opacity-100'
                    }`}
                    style={{
                      background: `linear-gradient(135deg, ${c.hex} 45%, ${c.accentHex} 100%)`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2.5 pt-4 border-t border-white/[0.07]">
            <button
              onClick={() => {
                addToCart(product, 1, activeColor)
                setQuickViewProduct(null)
              }}
              className="w-full py-3 rounded-xl champagne-btn font-bold text-sm flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{dict.common.addToCart}</span>
            </button>

            <Link
              href={`/product/${product.slug}`}
              onClick={() => setQuickViewProduct(null)}
              className="w-full py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] text-xs font-medium text-[#d4d6dc] flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>
                {locale === 'fa' ? 'مشاهده صفحه محصول' : 'View Product Page'}
              </span>
              {locale === 'fa' ? (
                <ArrowUpLeft className="w-4 h-4" />
              ) : (
                <ArrowUpRight className="w-4 h-4" />
              )}
            </Link>
          </div>
        </div>
      </div>
    </Modal>
  )
}
