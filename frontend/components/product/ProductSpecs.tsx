'use client'

import React from 'react'
import { ProductSpec } from '@/types'
import { useStore } from '@/lib/store/useStore'
import { getDict } from '@/lib/data/i18n'

export default function ProductSpecs({ specs }: { specs: ProductSpec[] }) {
  const locale = useStore((s) => s.locale)
  const dict = getDict(locale)

  return (
    <section className="space-y-5">
      <h2 className="text-xl sm:text-2xl font-bold text-[#f2f2f0]">
        {dict.common.specs}
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {specs.map((spec, idx) => (
          <div
            key={idx}
            className="rounded-2xl bg-[#14161a] p-5 border border-white/[0.07]"
          >
            <div className="text-xs text-[#8e93a0]">
              {locale === 'fa' ? spec.label_fa : spec.label}
            </div>
            <div className="text-sm sm:text-base font-bold text-[#f2f2f0] mt-1.5">
              {locale === 'fa' ? spec.value_fa : spec.value}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
