'use client'

import React, { useState } from 'react'
import dynamic from 'next/dynamic'
import { Box, Grid, Image as ImageIcon, Layers, Rotate3d } from 'lucide-react'
import { Product, ProductColorOption } from '@/types'
import { useStore } from '@/lib/store/useStore'
import { getDict } from '@/lib/data/i18n'

const StudioScene3D = dynamic(() => import('@/components/three/StudioScene3D'), {
  ssr: false,
})

interface ProductGalleryProps {
  product: Product
  selectedColor: ProductColorOption
}

export default function ProductGallery({ product, selectedColor }: ProductGalleryProps) {
  const locale = useStore((s) => s.locale)
  const dict = getDict(locale)

  const [mode, setMode] = useState<'3d' | 'render'>('3d')
  const [activeImageIdx, setActiveImageIdx] = useState(0)
  const [exploded, setExploded] = useState(false)
  const [wireframe, setWireframe] = useState(false)

  return (
    <div className="space-y-4">
      {/* Architectural Mode Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#ece6dc]/14 pb-3">
        <div className="inline-flex border border-[#ece6dc]/16 bg-[#141210]">
          <button
            onClick={() => setMode('3d')}
            className={`px-4 py-2 text-xs font-bold flex items-center gap-2 transition-colors ${
              mode === '3d'
                ? 'satin-brass-btn'
                : 'text-[#b9b0a2] hover:text-[#f7f4ee]'
            }`}
          >
            <Box className="w-4 h-4" />
            <span>
              {locale === 'fa' ? 'میز گردان سه‌بعدی ۳۶۰°' : 'Interactive 360° 3D'}
            </span>
          </button>
          <button
            onClick={() => setMode('render')}
            className={`px-4 py-2 text-xs font-bold flex items-center gap-2 transition-colors border-s border-[#ece6dc]/14 ${
              mode === 'render'
                ? 'satin-brass-btn'
                : 'text-[#b9b0a2] hover:text-[#f7f4ee]'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>
              {locale === 'fa' ? 'تصویر استودیویی اثر' : 'Studio Plate'}
            </span>
          </button>
        </div>

        {mode === '3d' && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setExploded((v) => !v)}
              className={`px-3.5 py-2 text-xs font-medium border flex items-center gap-1.5 transition-colors ${
                exploded
                  ? 'bg-[#c59b5f] border-[#c59b5f] text-[#11100e] font-bold'
                  : 'bg-[#141210] border-[#ece6dc]/16 text-[#d6cfc4] hover:border-[#c59b5f]/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{locale === 'fa' ? 'تفکیک قطعات' : 'Explode'}</span>
            </button>

            <button
              onClick={() => setWireframe((v) => !v)}
              className={`px-2.5 py-2 font-mono text-[11px] border flex items-center gap-1 transition-colors ${
                wireframe
                  ? 'bg-[#d8dce0] border-[#d8dce0] text-[#11100e] font-bold'
                  : 'bg-[#141210] border-[#ece6dc]/16 text-[#d6cfc4]'
              }`}
              title={dict.hero.wireframeToggle}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>CAD</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Vitrine Display */}
      <div className="atelier-corners relative h-[390px] sm:h-[490px] border border-[#ece6dc]/16 bg-[radial-gradient(circle_at_50%_48%,rgba(197,155,95,0.12)_0%,rgba(14,13,11,0.98)_72%)] overflow-hidden flex items-center justify-center">
        <div className="pointer-events-none absolute inset-x-14 sm:inset-x-24 top-8 bottom-10 arch-niche border border-[#ece6dc]/[0.08]" />

        {mode === '3d' ? (
          <div className="w-full h-full cursor-grab active:cursor-grabbing">
            <StudioScene3D
              archetype={product.archetype}
              bodyColor={selectedColor.hex}
              accentColor={selectedColor.accentHex}
              exploded={exploded}
              wireframe={wireframe}
              allowZoom={true}
              fallbackImage={product.images[0]?.url}
            />
            <div className="pointer-events-none absolute bottom-3 inset-x-4 flex justify-between items-center font-mono text-[10px] text-[#8c8377] px-2">
              <span>ALLOY 1070-AL</span>
              <span className="font-sans text-[11px] text-[#b9b0a2] flex items-center gap-1.5">
                <Rotate3d className="w-3.5 h-3.5 text-[#c59b5f]" />
                {dict.hero.dragHint}
              </span>
              <span>360° ROTARY</span>
            </div>
          </div>
        ) : (
          <div className="relative z-10 w-full h-full p-6 sm:p-10 flex items-center justify-center">
            <img
              src={product.images[activeImageIdx]?.url || product.images[0]?.url}
              alt={product.name}
              className="max-w-full max-h-full object-contain drop-shadow-[0_25px_45px_rgba(0,0,0,0.85)] transition-transform duration-500 hover:scale-105"
            />
          </div>
        )}
      </div>

      {/* Specimen Thumbnails Strip */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
        <button
          onClick={() => setMode('3d')}
          className={`h-20 w-24 border p-2 flex flex-col items-center justify-center gap-1 flex-shrink-0 transition-colors ${
            mode === '3d'
              ? 'bg-[#221e19] border-[#c59b5f] text-[#dfc08e]'
              : 'bg-[#141210] border-[#ece6dc]/14 text-[#9e9589] hover:text-[#f7f4ee]'
          }`}
        >
          <Rotate3d className="w-5 h-5" />
          <span className="font-mono text-[10px] font-bold">3D 360°</span>
        </button>

        {product.images.map((img, idx) => (
          <button
            key={img.id}
            onClick={() => {
              setMode('render')
              setActiveImageIdx(idx)
            }}
            className={`h-20 w-24 border p-2 flex-shrink-0 overflow-hidden transition-colors bg-[#141210] ${
              mode === 'render' && activeImageIdx === idx
                ? 'border-[#c59b5f]'
                : 'border-[#ece6dc]/14 opacity-70 hover:opacity-100'
            }`}
          >
            <img src={img.url} alt={img.alt} className="w-full h-full object-contain" />
          </button>
        ))}
      </div>
    </div>
  )
}
