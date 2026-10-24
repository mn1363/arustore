'use client'

import React from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Home } from 'lucide-react'
import { useStore } from '@/lib/store/useStore'

export interface BreadcrumbItem {
  label: string
  href?: string
}

export default function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  const locale = useStore((s) => s.locale)
  const Sep = locale === 'fa' ? ChevronLeft : ChevronRight

  return (
    <nav className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400 mb-6">
      <Link href="/" className="hover:text-cyan-300 flex items-center gap-1">
        <Home className="w-3.5 h-3.5" />
        <span>{locale === 'fa' ? 'آرو استور' : 'Home'}</span>
      </Link>
      {items.map((item, idx) => (
        <React.Fragment key={idx}>
          <Sep className="w-3.5 h-3.5 text-slate-600" />
          {item.href ? (
            <Link href={item.href} className="hover:text-cyan-300 transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-cyan-200 font-semibold">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  )
}
