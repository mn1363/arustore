'use client'

import React from 'react'
import { useStore } from '@/lib/store/useStore'
import { formatPrice } from '@/lib/utils'

interface PriceFilterProps {
  maxPrice: number
  onChangeMaxPrice: (val: number) => void
}

export default function PriceFilter({ maxPrice, onChangeMaxPrice }: PriceFilterProps) {
  const locale = useStore((s) => s.locale)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-[#9ca0ab]">
          {locale === 'fa' ? 'حداکثر قیمت' : 'Max Price'}
        </h4>
        <span className="text-xs font-bold text-[#dfc08e]">
          {formatPrice(maxPrice, locale, Math.round(maxPrice * 55000))}
        </span>
      </div>
      <input
        type="range"
        min={55}
        max={150}
        step={5}
        value={maxPrice}
        onChange={(e) => onChangeMaxPrice(Number(e.target.value))}
        className="w-full accent-[#dfc08e] cursor-pointer"
      />
      <div className="flex justify-between text-[10px] text-[#666b78]">
        <span>{formatPrice(55, locale, 3000000)}</span>
        <span>{formatPrice(150, locale, 8250000)}</span>
      </div>
    </div>
  )
}
