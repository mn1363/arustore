'use client'

import React, { useEffect, useState } from 'react'
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

export default function ProductGallery({
  product,
  selectedColor,
}: ProductGalleryProps) {
  const locale = useStore((s) => s.locale)
  const hasImages = product.images.length > 0

  const [mode, setMode] = useState<'3d' | 'render'>(hasImages ? 'render' : '3d')
  const [activeImageIdx, setActiveImageIdx] = useState(0)
  const [exploded, setExploded] = useState(false)

  useEffect(() => {
    setActiveImageIdx(0)
    setMode(product.images.length > 0 ? 'render' : '3d')
  }, [product.id, product.images.length])

  const activeImage =
    product.images[activeImageIdx] || product.images[0] || undefined

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="inline-flex p-1 rounded-2xl bg-[#0e111b] border border-white/[0.08]">
          {hasImages && (
            <button
              onClick={() => setMode('render')}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                mode === 'render'
                  ? 'champagne-btn font-bold'
                  : 'text-[#979fb2] hover:text-[#f4f4f6]'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>{locale === 'fa' ? 'تصویر محصول' : 'Photo'}</span>
            </button>
          )}
          <button
            onClick={() => setMode('3d')}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              mode === '3d'
                ? 'champagne-btn font-bold'
                : 'text-[#979fb2] hover:text-[#f4f4f6]'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>{locale === 'fa' ? 'صحنه سه‌بعدی' : '3D Stage'}</span>
          </button>
        </div>

        {mode === '3d' && (
          <button
            onClick={() => setExploded((v) => !v)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all ${
              exploded
                ? 'champagne-btn font-bold'
                : 'secondary-3d-btn text-[#d4d6dc]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{locale === 'fa' ? 'نمای قطعات' : 'Parts'}</span>
          </button>
        )}
      </div>

      <div className="relative h-[380px] sm:h-[470px] rounded-3xl hero-sanctuary-stage overflow-hidden">
        {mode === '3d' || !activeImage ? (
          <div className="w-full h-full cursor-grab active:cursor-grabbing">
            <StudioScene3D
              archetype={product.archetype}
              bodyColor={selectedColor.hex}
              accentColor={selectedColor.accentHex}
              exploded={exploded}
              wireframe={false}
              allowZoom={true}
              fallbackImage={activeImage?.url}
            />
          </div>
        ) : (
          <div className="relative w-full h-full">
            <img
              src={activeImage.url}
              alt={activeImage.alt || product.name}
              className="w-full h-full object-cover"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 h-20"
              style={{
                background:
                  'linear-gradient(to top, rgba(8, 9, 15, 0.65) 0%, transparent 100%)',
              }}
            />
          </div>
        )}
      </div>

      {hasImages && product.images.length > 1 && mode === 'render' && (
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
          {product.images.map((img, idx) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActiveImageIdx(idx)}
              className={`w-16 h-14 rounded-xl overflow-hidden border transition-all flex-shrink-0 ${
                activeImageIdx === idx
                  ? 'border-[#dfc08e] shadow-[0_0_12px_rgba(223,192,142,0.3)]'
                  : 'border-white/[0.08] opacity-65 hover:opacity-100'
              }`}
            >
              <img
                src={img.url}
                alt={img.alt || product.name}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
