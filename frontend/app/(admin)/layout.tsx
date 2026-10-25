'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  BarChart3,
  Box,
  LayoutDashboard,
  ShoppingCart,
  ArrowLeft,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react'
import AtmosphericBackdrop from '@/components/layout/AtmosphericBackdrop'
import { AruLogo3D } from '@/components/ui/AruLogo3D'
import { useStore } from '@/lib/store/useStore'

type AccessState = 'checking' | 'authorized' | 'unauthenticated' | 'forbidden'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const locale = useStore((s) => s.locale)
  const verifyAdminAccess = useStore((s) => s.verifyAdminAccess)

  const [accessState, setAccessState] = useState<AccessState>('checking')

  useEffect(() => {
    let active = true
    setAccessState('checking')

    verifyAdminAccess().then((result) => {
      if (!active) return
      setAccessState(result)
      if (result === 'unauthenticated') {
        const nextParam = encodeURIComponent(pathname || '/admin')
        router.replace(`/login?next=${nextParam}`)
      }
    })

    return () => {
      active = false
    }
  }, [pathname, router, verifyAdminAccess])

  if (accessState === 'checking' || accessState === 'unauthenticated') {
    return (
      <div className="relative min-h-screen flex items-center justify-center p-6 isolate">
        <AtmosphericBackdrop />
        <div className="relative z-10 w-full max-w-md rounded-3xl glass-panel p-8 text-center space-y-4">
          <div className="w-9 h-9 rounded-full border-2 border-[#dfc08e]/30 border-t-[#dfc08e] animate-spin mx-auto" />
          <p className="text-xs text-[#979fb2]">
            {accessState === 'unauthenticated'
              ? locale === 'fa'
                ? 'در حال انتقال به صفحه ورود...'
                : 'Redirecting to sign in...'
              : locale === 'fa'
              ? 'در حال بررسی مجوز دسترسی مدیریت...'
              : 'Verifying administrator permissions...'}
          </p>
        </div>
      </div>
    )
  }

  if (accessState === 'forbidden') {
    return (
      <div className="relative min-h-screen flex items-center justify-center p-6 isolate">
        <AtmosphericBackdrop />
        <div className="relative z-10 w-full max-w-md rounded-3xl glass-panel p-8 text-center space-y-5">
          <ShieldAlert className="w-10 h-10 text-[#dfc08e] mx-auto" />
          <div className="space-y-1.5">
            <h1 className="text-lg font-bold text-[#f4f4f6]">
              {locale === 'fa'
                ? 'دسترسی محدود به مدیر سیستم'
                : 'Administrator Access Required'}
            </h1>
            <p className="text-xs text-[#979fb2]">
              {locale === 'fa'
                ? 'حساب کاربری شما مجوز ورود به پنل مدیریت را ندارد.'
                : 'Your account does not have permission to view the admin panel.'}
            </p>
          </div>
          <div className="flex justify-center gap-3 pt-1">
            <Link
              href="/profile"
              className="px-5 py-2.5 rounded-xl secondary-3d-btn text-xs font-medium"
            >
              {locale === 'fa' ? 'حساب کاربری' : 'My Account'}
            </Link>
            <Link
              href="/"
              className="px-5 py-2.5 rounded-xl champagne-btn font-bold text-xs"
            >
              {locale === 'fa' ? 'بازگشت به فروشگاه' : 'Back to Store'}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const links = [
    {
      href: '/admin',
      label: locale === 'fa' ? 'داشبورد مدیریتی' : 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      href: '/admin/products',
      label: locale === 'fa' ? 'مدیریت محصولات' : 'Products',
      icon: Box,
    },
    {
      href: '/admin/orders',
      label: locale === 'fa' ? 'سفارش‌ها' : 'Orders',
      icon: ShoppingCart,
    },
    {
      href: '/admin/analytics',
      label: locale === 'fa' ? 'آمار تعامل ۳بعدی' : '3D Analytics',
      icon: BarChart3,
    },
  ]

  return (
    <div className="relative min-h-screen flex flex-col lg:flex-row">
      <AtmosphericBackdrop />
      <aside className="relative z-10 w-full lg:w-72 border-b lg:border-b-0 lg:border-e border-white/[0.08] bg-[#0b0e17]/90 backdrop-blur-xl p-6 flex flex-col justify-between gap-6">
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="p-1.5 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                <AruLogo3D className="w-8 h-8" />
              </div>
              <div>
                <div className="font-bold text-base text-[#f4f4f6]">
                  {locale === 'fa' ? 'مدیریت آرو استور' : 'AruStore Admin'}
                </div>
                <div className="text-[11px] text-[#dfc08e]">
                  {locale === 'fa' ? 'کنترل یکپارچه فروشگاه' : 'Store Control Center'}
                </div>
              </div>
            </Link>
          </div>

          <nav className="grid grid-cols-2 lg:grid-cols-1 gap-2">
            {links.map((item) => {
              const Icon = item.icon
              const active = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                    active
                      ? 'champagne-btn font-bold'
                      : 'text-[#979fb2] hover:bg-white/[0.05] hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        <Link
          href="/"
          className="px-4 py-3 rounded-xl secondary-3d-btn text-xs font-bold flex items-center justify-between"
        >
          <span>{locale === 'fa' ? 'بازگشت به ویترین فروشگاه' : 'Back to Storefront'}</span>
          {locale === 'fa' ? (
            <ArrowLeft className="w-4 h-4 text-[#dfc08e]" />
          ) : (
            <ArrowRight className="w-4 h-4 text-[#dfc08e]" />
          )}
        </Link>
      </aside>

      <main className="relative z-10 flex-1 p-5 sm:p-8 lg:p-10 overflow-x-hidden">
        {children}
      </main>
    </div>
  )
}
