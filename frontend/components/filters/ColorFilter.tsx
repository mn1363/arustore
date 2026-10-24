'use client'

import React from 'react'
import { useStore } from '@/lib/store/useStore'

const FINISH_PALETTE = [
  { id: '#eab308', label: 'Champagne Gold Accent', label_fa: 'طلایی شامپاینی آنودایز', hex: '#eab308' },
  { id: '#e2e8f0', label: 'Mirror Silver Aluminum', label_fa: 'سیلور آینه‌ای خالص', hex: '#e2e8f0' },
  { id: '#d97706', label: 'Antique Bronze Collar', label_fa: 'برنزی آنتیک پتینه', hex: '#d97706' },
  { id: '#cbd5e1', label: 'Smoked Pewter Satin', label_fa: 'دودی تیتانیومی مات', hex: '#64748b' },
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
      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
        {locale === 'fa' ? 'نوع آبکاری و رنگ آلومینیوم' : 'Aluminum Anodize Finish'}
      </h4>
      <div className="flex flex-wrap gap-2">
        {FINISH_PALETTE.map((c) => {
          const active = selectedColor === c.id
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelectColor(active ? undefined : c.id)}
              className={`px-3 py-1.5 rounded-full text-xs flex items-center gap-2 border transition-all ${
                active
                  ? 'bg-amber-500/20 border-amber-400 text-white font-semibold'
                  : 'bg-white/[0.03] border-white/10 text-slate-300 hover:border-white/30'
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
