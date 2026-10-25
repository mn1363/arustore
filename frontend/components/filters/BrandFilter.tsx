'use client'

import React from 'react'
import { useCatalogBrands } from '@/hooks/useProducts'
import { useStore } from '@/lib/store/useStore'
import { formatNumber } from '@/lib/utils'

interface BrandFilterProps {
  selectedBrands: string[]
  onToggleBrand: (slug: string) => void
}

export default function BrandFilter({
  selectedBrands,
  onToggleBrand,
}: BrandFilterProps) {
  const locale = useStore((s) => s.locale)
  const { brands, isLoading, error, reload } = useCatalogBrands()

  return (
    <div className="space-y-2.5">
      <h4 className="text-xs font-bold text-[#9ca0ab]">
        {locale === 'fa' ? 'خط تولید' : 'Line'}
      </h4>

      {isLoading ? (
        <div className="space-y-1.5">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className="h-8 rounded-xl bg-white/[0.04] animate-pulse"
            />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl bg-[#0a0c14]/70 border border-white/[0.08] p-3 space-y-2">
          <p className="text-[11px] text-[#979fb2]">
            {locale === 'fa'
              ? 'خطا در دریافت فهرست برندها'
              : 'Unable to load brands'}
          </p>
          <button
            type="button"
            onClick={reload}
            className="text-xs text-[#dfc08e] hover:underline"
          >
            {locale === 'fa' ? 'تلاش مجدد' : 'Retry'}
          </button>
        </div>
      ) : brands.length === 0 ? (
        <p className="text-xs text-[#666b78]">
          {locale === 'fa' ? 'برندی ثبت نشده است' : 'No brands available'}
        </p>
      ) : (
        <div className="space-y-1.5">
          {brands.map((brand) => {
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
      )}
    </div>
  )
}
