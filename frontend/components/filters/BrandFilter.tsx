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
      <h4 className="text-xs font-bold text-[#9ca0ab]">
        {locale === 'fa' ? 'خط تولید' : 'Line'}
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
                  ? 'bg-[#1b2030] border-[#dfc08e]/60 text-[#f4f4f6] font-semibold'
                  : 'bg-transparent border-transparent text-[#979fb2] hover:bg-white/[0.04] hover:text-[#e8ebf2]'
              }`}
            >
              <span>{locale === 'fa' ? brand.name_fa : brand.name}</span>
              <span className="text-[11px] text-[#666b78]">
                {formatNumber(brand.product_count, locale)}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
