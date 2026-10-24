'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BarChart3,
  Boxes,
  ExternalLink,
  Globe,
  LayoutDashboard,
  ShoppingCart,
} from 'lucide-react'
import { AruLogo3D } from '@/components/ui/AruLogo3D'
import { useStore } from '@/lib/store/useStore'
import { cn } from '@/lib/utils'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const locale = useStore((s) => s.locale)
  const toggleLocale = useStore((s) => s.toggleLocale)

  const navItems = [
    {
      href: '/admin',
      label: locale === 'fa' ? 'پیشخوان هوشمند' : 'Overview',
      icon: LayoutDashboard,
    },
    {
      href: '/admin/products',
      label: locale === 'fa' ? 'مدیریت محصولات ۳بعدی' : '3D Products',
      icon: Boxes,
    },
    {
      href: '/admin/orders',
      label: locale === 'fa' ? 'مدیریت سفارش‌ها' : 'Orders',
      icon: ShoppingCart,
    },
    {
      href: '/admin/analytics',
      label: locale === 'fa' ? 'آنالیتیکس زنده' : 'Analytics',
      icon: BarChart3,
    },
  ]

  return (
    <div className="min-h-screen flex flex-col lg:flex-row max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-6">
      {/* Sidebar */}
      <aside className="lg:w-64 flex-shrink-0 glass-panel rounded-3xl p-5 border border-white/10 h-fit lg:sticky lg:top-6 space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <AruLogo3D className="w-9 h-9" />
            <div>
              <div className="text-sm font-black text-white">AruAdmin 3D</div>
              <div className="text-[10px] text-violet-300">
                {locale === 'fa' ? 'مرکز کنترل استودیو' : 'Spatial Control'}
              </div>
            </div>
          </Link>
          <button
            onClick={toggleLocale}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-amber-300"
          >
            <Globe className="w-3.5 h-3.5" />
          </button>
        </div>

        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all',
                  active
                    ? 'bg-gradient-to-r from-amber-400/20 to-yellow-500/20 text-amber-200 border border-amber-400/35'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="pt-4 border-t border-white/10">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-200"
          >
            <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
            <span>{locale === 'fa' ? 'مشاهده فروشگاه زنده' : 'Back to Storefront'}</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  )
}
