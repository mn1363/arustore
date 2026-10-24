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
      {/* Mode Switcher Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex p-1 rounded-2xl glass-panel border border-white/10">
          <button
            onClick={() => setMode('3d')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              mode === '3d'
                ? 'bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500 text-slate-950 shadow-neon-cyan'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Box className="w-4 h-4" />
            <span>
              {locale === 'fa' ? 'استودیو سه‌بعدی زنده ۳۶۰°' : 'Interactive 360° 3D'}
            </span>
          </button>
          <button
            onClick={() => setMode('render')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              mode === 'render'
                ? 'bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500 text-slate-950 shadow-neon-cyan'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>
              {locale === 'fa' ? 'گالری رندر استودیویی' : 'Studio Photography'}
            </span>
          </button>
        </div>

        {mode === '3d' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setExploded((v) => !v)}
              className={`glass-pill px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                exploded
                  ? 'bg-amber-500/25 border-amber-400 text-amber-200 shadow-neon-cyan'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>{dict.hero.explodedToggle}</span>
            </button>

            <button
              onClick={() => setWireframe((v) => !v)}
              className={`glass-pill p-2 rounded-xl text-xs transition-all ${
                wireframe
                  ? 'bg-violet-500/30 border-violet-400 text-violet-200'
                  : 'text-slate-300 hover:text-white'
              }`}
              title={dict.hero.wireframeToggle}
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Main Display Frame */}
      <div className="relative h-[390px] sm:h-[490px] rounded-[2rem] glass-panel border border-white/10 overflow-hidden flex items-center justify-center">
        <div
          className="pointer-events-none absolute inset-0 opacity-35 transition-colors duration-700"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${selectedColor.accentHex}45 0%, transparent 70%)`,
          }}
        />

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
            <div className="pointer-events-none absolute bottom-4 inset-x-4 flex justify-center">
              <div className="glass-pill px-3.5 py-1.5 rounded-full text-[11px] text-slate-300 flex items-center gap-1.5">
                <Rotate3d className="w-3.5 h-3.5 text-amber-400" />
                <span>{dict.hero.dragHint}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative z-10 w-full h-full p-6 sm:p-10 flex items-center justify-center">
            <img
              src={product.images[activeImageIdx]?.url || product.images[0]?.url}
              alt={product.name}
              className="max-w-full max-h-full object-contain rounded-2xl drop-shadow-[0_25px_50px_rgba(0,0,0,0.85)] transition-transform duration-500 hover:scale-105"
            />
          </div>
        )}
      </div>

      {/* Thumbnails Strip */}
      <div className="flex items-center gap-3 overflow-x-auto pb-1">
        <button
          onClick={() => setMode('3d')}
          className={`h-20 w-24 rounded-2xl border p-2 flex flex-col items-center justify-center gap-1 flex-shrink-0 transition-all ${
            mode === '3d'
              ? 'bg-amber-500/15 border-amber-400 text-amber-300'
              : 'glass-panel border-white/10 text-slate-400 hover:text-white'
          }`}
        >
          <Rotate3d className="w-5 h-5" />
          <span className="text-[11px] font-bold">3D 360°</span>
        </button>

        {product.images.map((img, idx) => (
          <button
            key={img.id}
            onClick={() => {
              setMode('render')
              setActiveImageIdx(idx)
            }}
            className={`h-20 w-24 rounded-2xl border p-2 flex-shrink-0 overflow-hidden transition-all ${
              mode === 'render' && activeImageIdx === idx
                ? 'bg-white/10 border-amber-400 ring-2 ring-amber-400/30'
                : 'glass-panel border-white/10 opacity-75 hover:opacity-100'
            }`}
          >
            <img src={img.url} alt={img.alt} className="w-full h-full object-contain" />
          </button>
        ))}
      </div>
    </div>
  )
}
