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
            className={`w-10 h-10 rounded-xl text-xs font-bold transition-colors ${
              active
                ? 'champagne-btn'
                : 'bg-[#14161a] border border-white/[0.08] text-[#9ca0ab] hover:text-white'
            }`}
          >
            {formatNumber(page, locale)}
          </button>
        )
      })}
    </div>
  )
}
