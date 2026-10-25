'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Heart, Menu, Search, ShoppingBag, User, X } from 'lucide-react'
import { AruLogo3D } from '@/components/ui/AruLogo3D'
import { useStore } from '@/lib/store/useStore'
import { useCart } from '@/hooks/useCart'
import { getDict } from '@/lib/data/i18n'
import { cn, formatNumber } from '@/lib/utils'

export default function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const locale = useStore((s) => s.locale)
  const toggleLocale = useStore((s) => s.toggleLocale)
  const wishlistIds = useStore((s) => s.wishlistIds)
  const user = useStore((s) => s.user)
  const { itemCount, setCartDrawerOpen } = useCart()
  const dict = getDict(locale)

  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    document.documentElement.dir = locale === 'fa' ? 'rtl' : 'ltr'
    document.documentElement.lang = locale
  }, [locale])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const navLinks = [
    { href: '/', label: locale === 'fa' ? 'صفحه اصلی' : 'Home' },
    { href: '/products', label: locale === 'fa' ? 'محصولات' : 'Products' },
    { href: '/categories', label: locale === 'fa' ? 'مجموعه‌ها' : 'Collections' },
    { href: '/orders', label: locale === 'fa' ? 'پیگیری سفارش' : 'Orders' },
  ]

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    router.push(`/products?q=${encodeURIComponent(searchQuery.trim())}`)
    setSearchOpen(false)
    setMobileOpen(false)
  }

  return (
    <header
      className={cn(
        'sticky top-0 z-40 transition-all duration-300 border-b',
        scrolled
          ? 'bg-[#0b0d16]/86 backdrop-blur-xl border-white/[0.1] shadow-[0_18px_40px_-20px_rgba(0,0,0,0.85)]'
          : 'bg-[#08090f]/72 backdrop-blur-md border-white/[0.06]'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-[4.5rem] flex items-center justify-between gap-6">
        {/* Brand Emblem */}
        <Link href="/" className="group flex items-center gap-3 flex-shrink-0">
          <div className="relative p-1.5 rounded-xl bg-white/[0.03] border border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] group-hover:border-[#dfc08e]/40 transition-colors">
            <AruLogo3D className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>
          <span className="text-lg sm:text-xl font-bold text-[#f4f4f6] tracking-tight">
            {dict.brandName}
          </span>
        </Link>

        {/* Dimensional Glass Capsule Navigation */}
        <nav
          aria-label="Primary"
          className="hidden md:flex items-center gap-1 p-1 rounded-2xl bg-[#0d101a]/90 border border-white/[0.07] shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]"
        >
          {navLinks.map((link) => {
            const active =
              link.href === '/'
                ? pathname === '/'
                : pathname?.startsWith(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-4 py-1.5 rounded-xl text-sm transition-all duration-200',
                  active
                    ? 'bg-gradient-to-b from-[#23293d] to-[#171b29] text-[#dfc08e] font-bold border border-[#dfc08e]/30 shadow-[0_6px_16px_-6px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.12)]'
                    : 'text-[#979fb2] hover:text-[#f4f4f6] hover:bg-white/[0.04]'
                )}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        {/* Tactile Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSearchOpen((v) => !v)}
            aria-label="Search"
            className="p-2.5 rounded-xl text-[#b4bccf] hover:text-[#f4f4f6] bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.07] transition-all"
          >
            <Search className="w-4 h-4" />
          </button>

          <button
            onClick={toggleLocale}
            className="px-3 py-2 rounded-xl text-xs font-semibold text-[#b4bccf] hover:text-[#f4f4f6] bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.07] transition-all"
          >
            {locale === 'fa' ? 'EN' : 'فا'}
          </button>

          <Link
            href="/wishlist"
            className="relative p-2.5 rounded-xl text-[#b4bccf] hover:text-[#f4f4f6] bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.07] transition-all hidden sm:inline-flex"
            title={dict.nav.wishlist}
          >
            <Heart className="w-4 h-4" />
            {wishlistIds.length > 0 && (
              <span className="absolute top-1.5 end-1.5 w-2 h-2 rounded-full bg-[#dfc08e] shadow-[0_0_8px_#dfc08e]" />
            )}
          </Link>

          <Link
            href={user ? '/profile' : '/login'}
            className="hidden sm:inline-flex p-2.5 rounded-xl text-[#b4bccf] hover:text-[#f4f4f6] bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.07] transition-all"
            title={user ? user.full_name : 'Login'}
          >
            <User className="w-4 h-4" />
          </Link>

          <button
            onClick={() => setCartDrawerOpen(true)}
            className="px-4 py-2 rounded-xl champagne-btn font-bold text-xs flex items-center gap-2"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{formatNumber(itemCount, locale)}</span>
          </button>

          <button
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Menu"
            className="md:hidden p-2 rounded-xl text-[#f4f4f6] bg-white/[0.04] border border-white/[0.08]"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {searchOpen && (
        <div className="border-t border-white/[0.08] bg-[#10131c]/95 backdrop-blur-xl">
          <form
            onSubmit={handleSearchSubmit}
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center gap-3"
          >
            <Search className="w-4 h-4 text-[#dfc08e] flex-shrink-0" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                locale === 'fa'
                  ? 'جستجوی نام ظرف (شیرینی‌خوری، میوه‌خوری، سینی...)'
                  : 'Search products...'
              }
              className="w-full bg-transparent text-sm text-[#f4f4f6] placeholder:text-[#6e768a] focus:outline-none"
            />
          </form>
        </div>
      )}

      {mobileOpen && (
        <div className="md:hidden border-t border-white/[0.08] bg-[#10131c]/96 backdrop-blur-xl px-4 py-3 space-y-1.5">
          {navLinks.map((link) => {
            const active =
              link.href === '/'
                ? pathname === '/'
                : pathname?.startsWith(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'block py-2.5 px-3.5 rounded-xl text-sm transition-colors',
                  active
                    ? 'bg-[#1a1f2e] text-[#dfc08e] font-bold border border-[#dfc08e]/25'
                    : 'text-[#d4d6dc] hover:bg-white/[0.04]'
                )}
              >
                {link.label}
              </Link>
            )
          })}
        </div>
      )}
    </header>
  )
}
