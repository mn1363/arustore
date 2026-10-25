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
      <Search className="w-4 h-4 text-[#979fb2] absolute top-1/2 -translate-y-1/2 start-3.5 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={dict.nav.searchPlaceholder}
        className="w-full rounded-xl bg-[#0a0c14] border border-white/[0.1] ps-10 pe-9 py-2 text-sm text-[#f4f4f6] placeholder:text-[#666e82] shadow-[inset_0_2px_4px_rgba(0,0,0,0.45)] focus:outline-none focus:border-[#dfc08e]/60 transition-colors"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute top-1/2 -translate-y-1/2 end-3 text-[#8e93a0] hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
