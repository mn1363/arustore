'use client'

import React from 'react'
import { Search, X } from 'lucide-react'
import { useStore } from '@/lib/store/useStore'
import { getDict } from '@/lib/data/i18n'

export default function SearchBar({
  value,
  onChange,
}: {
  value: string
  onChange: (val: string) => void
}) {
  const locale = useStore((s) => s.locale)
  const dict = getDict(locale)

  return (
    <div className="relative flex-1">
      <Search className="w-4 h-4 text-cyan-400 absolute top-1/2 -translate-y-1/2 start-3.5 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={dict.nav.searchPlaceholder}
        className="w-full rounded-2xl bg-white/[0.04] border border-white/10 ps-10 pe-9 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400/70 transition-colors"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute top-1/2 -translate-y-1/2 end-3 text-slate-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
