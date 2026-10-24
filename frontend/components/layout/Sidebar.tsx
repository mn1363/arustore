'use client'

import React from 'react'
import { SlidersHorizontal } from 'lucide-react'
import { useStore } from '@/lib/store/useStore'

export default function Sidebar({
  title,
  children,
  onReset,
}: {
  title?: string
  children: React.ReactNode
  onReset?: () => void
}) {
  const locale = useStore((s) => s.locale)

  return (
    <aside className="rounded-2xl bg-[#14161a] p-5 border border-white/[0.07] space-y-6 h-fit">
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.07]">
        <div className="flex items-center gap-2 font-bold text-sm text-[#f2f2f0]">
          <SlidersHorizontal className="w-4 h-4 text-[#d6b88a]" />
          <span>{title || (locale === 'fa' ? 'فیلترها' : 'Filters')}</span>
        </div>
        {onReset && (
          <button
            onClick={onReset}
            className="text-xs text-[#9ca0ab] hover:text-[#f2f2f0] transition-colors"
          >
            {locale === 'fa' ? 'پاک کردن' : 'Reset'}
          </button>
        )}
      </div>
      {children}
    </aside>
  )
}
