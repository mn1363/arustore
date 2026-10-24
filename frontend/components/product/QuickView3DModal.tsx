'use client'

import React, { useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Grid, Layers, Rotate3d, ShoppingBag, ArrowUpLeft, ArrowUpRight } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import { useStore } from '@/lib/store/useStore'
import {
  formatPrice,
  getProductDescription,
  getProductSubtitle,
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
  const [wireframe, setWireframe] = useState(false)

  if (!product) return null

  const activeColor = product.colors[colorIdx] || product.colors[0]

  return (
    <Modal
      open={Boolean(product)}
      onClose={() => {
        setQuickViewProduct(null)
        setExploded(false)
        setWireframe(false)
        setColorIdx(0)
      }}
      className="max-w-5xl"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 bg-[#141210]">
        {/* Interactive 3D Vitrine */}
        <div className="lg:col-span-7 relative h-[340px] sm:h-[440px] bg-[radial-gradient(circle_at_50%_50%,rgba(197,155,95,0.12)_0%,rgba(14,13,11,0.98)_74%)] border-b lg:border-b-0 lg:border-e border-[#ece6dc]/14">
          <StudioScene3D
            archetype={product.archetype}
            bodyColor={activeColor.hex}
            accentColor={activeColor.accentHex}
            exploded={exploded}
            wireframe={wireframe}
            allowZoom={true}
            fallbackImage={product.images[0]?.url}
          />

          <div className="absolute top-3.5 start-3.5 bg-[#0e0d0b]/90 border border-[#ece6dc]/16 px-3 py-1 font-mono text-[10px] tracking-widest text-[#dfc08e] flex items-center gap-1.5">
            <Rotate3d className="w-3.5 h-3.5" />
            <span>360° ROTARY CAD</span>
          </div>

          <div className="absolute bottom-4 inset-x-4 flex items-center justify-center gap-2">
            <button
              onClick={() => setExploded((v) => !v)}
              className={`px-3.5 py-1.5 text-xs font-medium border flex items-center gap-1.5 transition-colors ${
                exploded
                  ? 'bg-[#c59b5f] border-[#c59b5f] text-[#11100e] font-bold'
                  : 'bg-[#0e0d0b]/90 border-[#ece6dc]/18 text-[#d6cfc4]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{locale === 'fa' ? 'تفکیک قطعات' : 'Explode'}</span>
            </button>
            <button
              onClick={() => setWireframe((v) => !v)}
              className={`px-3 py-1.5 font-mono text-[11px] border flex items-center gap-1.5 transition-colors ${
                wireframe
                  ? 'bg-[#d8dce0] border-[#d8dce0] text-[#11100e] font-bold'
                  : 'bg-[#0e0d0b]/90 border-[#ece6dc]/18 text-[#d6cfc4]'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>CAD</span>
            </button>
          </div>
        </div>

        {/* Specimen Dossier */}
        <div className="lg:col-span-5 p-6 sm:p-7 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div>
              <span className="font-mono text-[10px] tracking-[0.2em] text-[#c59b5f] uppercase">
                ARU-{100 + product.id} · {locale === 'fa' ? product.brand.name_fa : product.brand.name}
              </span>
              <h2 className="font-editorial text-3xl font-bold text-[#f7f4ee] mt-1 leading-tight">
                {getProductTitle(product, locale)}
              </h2>
              <p className="text-xs text-[#9e9589] mt-1">
                {getProductSubtitle(product, locale)}
              </p>
            </div>

            <div className="text-2xl font-extrabold text-[#dfc08e] py-2 border-y border-[#ece6dc]/12">
              {formatPrice(product.price, locale, product.price_toman)}
            </div>

            <p className="text-xs sm:text-sm text-[#c9c0b3] leading-[1.85]">
              {getProductDescription(product, locale)}
            </p>

            {/* Finish Selector */}
            <div className="space-y-2 pt-1">
              <div className="text-xs text-[#9e9589]">
                {dict.common.color}:{' '}
                <span className="text-[#f7f4ee] font-semibold">
                  {locale === 'fa' ? activeColor.name_fa : activeColor.name}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                {product.colors.map((c, idx) => (
                  <button
                    key={c.id}
                    onClick={() => setColorIdx(idx)}
                    className={`w-7 h-7 rounded-full border transition-all ${
                      colorIdx === idx
                        ? 'scale-110 border-[#f7f4ee] ring-2 ring-[#c59b5f]'
                        : 'border-[#ece6dc]/25 opacity-75 hover:opacity-100'
                    }`}
                    style={{
                      background: `linear-gradient(135deg, ${c.hex} 45%, ${c.accentHex} 100%)`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2.5 pt-4 border-t border-[#ece6dc]/12">
            <button
              onClick={() => {
                addToCart(product, 1, activeColor)
                setQuickViewProduct(null)
              }}
              className="w-full py-3.5 rounded-[2px] brushed-metal-btn font-bold text-sm flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{dict.common.addToCart}</span>
            </button>

            <Link
              href={`/product/${product.slug}`}
              onClick={() => setQuickViewProduct(null)}
              className="w-full py-2.5 border border-[#ece6dc]/18 text-xs font-medium text-[#d6cfc4] hover:text-[#f7f4ee] hover:border-[#c59b5f] flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>
                {locale === 'fa'
                  ? 'مشاهده شناسنامه کامل و ابعاد اثر'
                  : 'Open Full Object Dossier'}
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
