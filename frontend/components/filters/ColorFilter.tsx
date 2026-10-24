'use client'

import React from 'react'
import { useStore } from '@/lib/store/useStore'

const FINISH_PALETTE = [
  { id: '#eab308', label: 'Champagne Gold', label_fa: 'شامپاینی مات', hex: '#d6b88a' },
  { id: '#e2e8f0', label: 'Brushed Silver', label_fa: 'نقره‌ای برس‌خورده', hex: '#e2e8f0' },
  { id: '#d97706', label: 'Warm Bronze', label_fa: 'برنزی گرم', hex: '#b6864f' },
  { id: '#cbd5e1', label: 'Smoked Pewter', label_fa: 'دودی مات', hex: '#64748b' },
]

export default function ColorFilter({
  selectedColor,
  onSelectColor,
}: {
  selectedColor?: string
  onSelectColor: (color?: string) => void
}) {
  const locale = useStore((s) => s.locale)

  return (
    <div className="space-y-2.5">
      <h4 className="text-xs font-bold text-[#9ca0ab]">
        {locale === 'fa' ? 'پوشش رنگ' : 'Finish'}
      </h4>
      <div className="flex flex-wrap gap-2">
        {FINISH_PALETTE.map((c) => {
          const active = selectedColor === c.id
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelectColor(active ? undefined : c.id)}
              className={`px-3 py-1.5 rounded-xl text-xs flex items-center gap-2 border transition-colors ${
                active
                  ? 'bg-white/[0.08] border-[#d6b88a] text-[#f2f2f0] font-semibold'
                  : 'bg-transparent border-white/10 text-[#9ca0ab] hover:border-white/25'
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
