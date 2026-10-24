'use client'

import React from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useStore } from '@/lib/store/useStore'

export default function Breadcrumb({
  items,
}: {
  items: { label: string; href?: string }[]
}) {
  const locale = useStore((s) => s.locale)
  const Sep = locale === 'fa' ? ChevronLeft : ChevronRight

  return (
    <nav className="flex items-center gap-2 text-xs text-[#8e93a0] mb-6 flex-wrap">
      <Link href="/" className="hover:text-[#f2f2f0] transition-colors">
        {locale === 'fa' ? 'خانه' : 'Home'}
      </Link>
      {items.map((item, idx) => (
        <React.Fragment key={idx}>
          <Sep className="w-3.5 h-3.5 text-[#5c606d]" />
          {item.href ? (
            <Link href={item.href} className="hover:text-[#f2f2f0] transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-[#d4d6dc] font-medium">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  )
}
