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

  const [mode, setMode] = useState<'3d' | 'render'>('render')
  const [activeImageIdx, setActiveImageIdx] = useState(0)
  const [exploded, setExploded] = useState(false)
  const [wireframe, setWireframe] = useState(false)

  return (
    <div className="space-y-3.5">
      {/* Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#ece6dc]/14 pb-3">
        <div className="inline-flex border border-[#ece6dc]/16 bg-[#141210]">
          <button
            onClick={() => setMode('render')}
            className={`px-4 py-2 text-xs font-bold flex items-center gap-2 transition-colors ${
              mode === 'render'
                ? 'satin-brass-btn'
                : 'text-[#b9b0a2] hover:text-[#f7f4ee]'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>{locale === 'fa' ? 'عکس کارگاه' : 'Workshop Photo'}</span>
          </button>
          <button
            onClick={() => setMode('3d')}
            className={`px-4 py-2 text-xs font-bold flex items-center gap-2 transition-colors border-s border-[#ece6dc]/14 ${
              mode === '3d'
                ? 'satin-brass-btn'
                : 'text-[#b9b0a2] hover:text-[#f7f4ee]'
            }`}
          >
            <Box className="w-4 h-4" />
            <span>{locale === 'fa' ? 'مدل سه‌بعدی ۳۶۰°' : '360° 3D Model'}</span>
          </button>
        </div>

        {mode === '3d' && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setExploded((v) => !v)}
              className={`px-3 py-2 text-xs font-medium border flex items-center gap-1.5 transition-colors ${
                exploded
                  ? 'bg-[#c59b5f] border-[#c59b5f] text-[#11100e] font-bold'
                  : 'bg-[#141210] border-[#ece6dc]/16 text-[#d6cfc4]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{locale === 'fa' ? 'تفکیک قطعات' : 'Explode'}</span>
            </button>
            <button
              onClick={() => setWireframe((v) => !v)}
              className={`px-2.5 py-2 font-mono text-[11px] border flex items-center gap-1 ${
                wireframe
                  ? 'bg-[#d8dce0] border-[#d8dce0] text-[#11100e] font-bold'
                  : 'bg-[#141210] border-[#ece6dc]/16 text-[#d6cfc4]'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>CAD</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Frame */}
      <div className="atelier-corners relative h-[380px] sm:h-[470px] border border-[#ece6dc]/16 bg-[#100f0d] overflow-hidden">
        {mode === '3d' ? (
          <div className="w-full h-full cursor-grab active:cursor-grabbing bg-[radial-gradient(circle_at_50%_48%,rgba(197,155,95,0.12)_0%,rgba(14,13,11,0.98)_72%)]">
            <StudioScene3D
              archetype={product.archetype}
              bodyColor={selectedColor.hex}
              accentColor={selectedColor.accentHex}
              exploded={exploded}
              wireframe={wireframe}
              allowZoom={true}
              fallbackImage={product.images[0]?.url}
            />
            <div className="pointer-events-none absolute bottom-3 inset-x-4 flex justify-center text-[11px] text-[#b9b0a2] gap-1.5 items-center">
              <Rotate3d className="w-3.5 h-3.5 text-[#c59b5f]" />
              <span>{dict.hero.dragHint}</span>
            </div>
          </div>
        ) : (
          <img
            src={product.images[activeImageIdx]?.url || product.images[0]?.url}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Thumbnails */}
      <div className="flex items-center gap-2.5">
        {product.images.map((img, idx) => (
          <button
            key={img.id}
            onClick={() => {
              setMode('render')
              setActiveImageIdx(idx)
            }}
            className={`h-16 w-24 border overflow-hidden transition-colors ${
              mode === 'render' && activeImageIdx === idx
                ? 'border-[#c59b5f]'
                : 'border-[#ece6dc]/14 opacity-70 hover:opacity-100'
            }`}
          >
            <img src={img.url} alt={img.alt} className="w-full h-full object-cover" />
          </button>
        ))}

        <button
          onClick={() => setMode('3d')}
          className={`h-16 w-24 border flex flex-col items-center justify-center gap-1 transition-colors ${
            mode === '3d'
              ? 'bg-[#221e19] border-[#c59b5f] text-[#dfc08e]'
              : 'bg-[#141210] border-[#ece6dc]/14 text-[#9e9589] hover:text-[#f7f4ee]'
          }`}
        >
          <Rotate3d className="w-4 h-4" />
          <span className="font-mono text-[10px] font-bold">3D 360°</span>
        </button>
      </div>
    </div>
  )
}
