'use client'

import React from 'react'
import { Cpu } from 'lucide-react'
import { ProductSpec } from '@/types'
import { useStore } from '@/lib/store/useStore'
import { getDict } from '@/lib/data/i18n'

export default function ProductSpecs({ specs }: { specs: ProductSpec[] }) {
  const locale = useStore((s) => s.locale)
  const dict = getDict(locale)

  return (
    <section className="space-y-5">
      <div className="flex items-center gap-2.5">
        <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-400/30 text-amber-300">
          <Cpu className="w-5 h-5" />
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-white">
          {dict.common.specs}
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {specs.map((spec, idx) => (
          <div
            key={idx}
            className="glass-panel rounded-2xl p-5 border border-white/10 hover:border-amber-400/35 transition-colors"
          >
            <div className="text-xs text-slate-400">
              {locale === 'fa' ? spec.label_fa : spec.label}
            </div>
            <div className="text-sm sm:text-base font-bold text-white mt-1.5">
              {locale === 'fa' ? spec.value_fa : spec.value}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
