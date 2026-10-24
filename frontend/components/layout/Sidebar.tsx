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
    <aside className="glass-panel rounded-3xl p-5 border border-white/10 space-y-6 h-fit">
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2 font-bold text-sm text-white">
          <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
          <span>{title || (locale === 'fa' ? 'فیلترهای هوشمند' : 'Smart Filters')}</span>
        </div>
        {onReset && (
          <button
            onClick={onReset}
            className="text-xs text-cyan-400 hover:text-cyan-200 transition-colors"
          >
            {locale === 'fa' ? 'پاکسازی همه' : 'Reset'}
          </button>
        )}
      </div>
      {children}
    </aside>
  )
}
