'use client'

import React from 'react'
import { BRANDS } from '@/lib/data/catalog'
import { useStore } from '@/lib/store/useStore'
import { formatNumber } from '@/lib/utils'

interface BrandFilterProps {
  selectedBrands: string[]
  onToggleBrand: (slug: string) => void
}

export default function BrandFilter({ selectedBrands, onToggleBrand }: BrandFilterProps) {
  const locale = useStore((s) => s.locale)

  return (
    <div className="space-y-2.5">
      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
        {locale === 'fa' ? 'برند سازنده' : 'Studio Brand'}
      </h4>
      <div className="space-y-1.5">
        {BRANDS.map((brand) => {
          const checked = selectedBrands.includes(brand.slug)
          return (
            <button
              key={brand.id}
              type="button"
              onClick={() => onToggleBrand(brand.slug)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all border ${
                checked
                  ? 'bg-cyan-500/15 border-cyan-400/50 text-cyan-200 font-semibold'
                  : 'bg-white/[0.02] border-transparent text-slate-300 hover:bg-white/[0.06]'
              }`}
            >
              <span>{locale === 'fa' ? brand.name_fa : brand.name}</span>
              <span className="text-[11px] text-slate-500">
                {formatNumber(brand.product_count, locale)}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
