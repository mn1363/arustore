'use client'

import React from 'react'
import { useStore } from '@/lib/store/useStore'
import { formatNumber } from '@/lib/utils'

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}) {
  const locale = useStore((s) => s.locale)
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-center gap-2 pt-8">
      {Array.from({ length: totalPages }).map((_, idx) => {
        const page = idx + 1
        const active = page === currentPage
        return (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`w-10 h-10 rounded-xl text-xs font-bold transition-all ${
              active
                ? 'bg-gradient-to-r from-cyan-400 to-violet-500 text-slate-950 shadow-neon-cyan'
                : 'glass-panel border-white/10 text-slate-300 hover:text-white'
            }`}
          >
            {formatNumber(page, locale)}
          </button>
        )
      })}
    </div>
  )
}
