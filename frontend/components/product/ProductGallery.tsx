'use client'

import React, { useState } from 'react'
import dynamic from 'next/dynamic'
import { Box, Image as ImageIcon, Layers } from 'lucide-react'
import { Product, ProductColorOption } from '@/types'
import { useStore } from '@/lib/store/useStore'

const StudioScene3D = dynamic(() => import('@/components/three/StudioScene3D'), {
  ssr: false,
})

interface ProductGalleryProps {
  product: Product
  selectedColor: ProductColorOption
}

export default function ProductGallery({ product, selectedColor }: ProductGalleryProps) {
  const locale = useStore((s) => s.locale)

  const [mode, setMode] = useState<'3d' | 'render'>('render')
  const [activeImageIdx, setActiveImageIdx] = useState(0)
  const [exploded, setExploded] = useState(false)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="inline-flex p-1 rounded-xl bg-[#14161a] border border-white/[0.07]">
          <button
            onClick={() => setMode('render')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              mode === 'render'
                ? 'champagne-btn font-bold'
                : 'text-[#9ca0ab] hover:text-[#f2f2f0]'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>{locale === 'fa' ? 'تصویر محصول' : 'Photo'}</span>
          </button>
          <button
            onClick={() => setMode('3d')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              mode === '3d'
                ? 'champagne-btn font-bold'
                : 'text-[#9ca0ab] hover:text-[#f2f2f0]'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>{locale === 'fa' ? 'نمای سه‌بعدی' : '3D View'}</span>
          </button>
        </div>

        {mode === '3d' && (
          <button
            onClick={() => setExploded((v) => !v)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-colors ${
              exploded
                ? 'bg-[#d6b88a] border-transparent text-[#111215] font-bold'
                : 'bg-[#14161a] border-white/10 text-[#d4d6dc]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{locale === 'fa' ? 'نمای قطعات' : 'Parts'}</span>
          </button>
        )}
      </div>

      <div className="relative h-[380px] sm:h-[470px] rounded-2xl bg-[#121317] border border-white/[0.07] overflow-hidden">
        {mode === '3d' ? (
          <div className="w-full h-full cursor-grab active:cursor-grabbing">
            <StudioScene3D
              archetype={product.archetype}
              bodyColor={selectedColor.hex}
              accentColor={selectedColor.accentHex}
              exploded={exploded}
              wireframe={false}
              allowZoom={true}
              fallbackImage={product.images[0]?.url}
            />
          </div>
        ) : (
          <img
            src={product.images[activeImageIdx]?.url || product.images[0]?.url}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        )}
      </div>
    </div>
  )
}
