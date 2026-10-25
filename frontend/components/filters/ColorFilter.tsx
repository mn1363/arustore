'use client'

import React, { useMemo } from 'react'
import { deriveAvailableFinishOptions } from '@/lib/api/catalog'
import { useStore } from '@/lib/store/useStore'

export default function ColorFilter({
  selectedColor,
  onSelectColor,
}: {
  selectedColor?: string
  onSelectColor: (color?: string) => void
}) {
  const locale = useStore((s) => s.locale)
  const catalogProducts = useStore((s) => s.products)

  const finishes = useMemo(
    () => deriveAvailableFinishOptions(catalogProducts),
    [catalogProducts]
  )

  return (
    <div className="space-y-2.5">
      <h4 className="text-xs font-bold text-[#9ca0ab]">
        {locale === 'fa' ? 'پوشش رنگ' : 'Finish'}
      </h4>
      <div className="flex flex-wrap gap-2">
        {finishes.map((c) => {
          const active = selectedColor === c.id
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelectColor(active ? undefined : c.id)}
              className={`px-3 py-1.5 rounded-xl text-xs flex items-center gap-2 border transition-all ${
                active
                  ? 'bg-[#1b2030] border-[#dfc08e]/60 text-[#f4f4f6] font-semibold'
                  : 'bg-[#0a0c14]/70 border-white/[0.08] text-[#979fb2] hover:border-white/20'
              }`}
            >
              <span
                className="w-3 h-3 rounded-full border border-white/30"
                style={{ backgroundColor: c.hex }}
              />
              <span>{locale === 'fa' ? c.label_fa : c.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
