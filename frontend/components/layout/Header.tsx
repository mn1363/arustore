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
        'sticky top-0 z-40 transition-colors duration-300 border-b',
        scrolled
          ? 'bg-[#0d0e11]/92 backdrop-blur-md border-white/[0.08]'
          : 'bg-[#0d0e11] border-white/[0.05]'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-[4.25rem] flex items-center justify-between gap-6">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 flex-shrink-0">
          <AruLogo3D className="w-9 h-9" />
          <span className="text-lg sm:text-xl font-bold text-[#f2f2f0] tracking-tight">
            {dict.brandName}
          </span>
        </Link>

        {/* Simple Clean Navigation */}
        <nav className="hidden md:flex items-center gap-7">
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
                  'text-sm transition-colors',
                  active
                    ? 'text-[#d6b88a] font-bold'
                    : 'text-[#9ca0ab] hover:text-[#f2f2f0]'
                )}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        {/* Minimal Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSearchOpen((v) => !v)}
            aria-label="Search"
            className="p-2 rounded-xl text-[#b4b8c2] hover:text-[#f2f2f0] hover:bg-white/[0.05] transition-colors"
          >
            <Search className="w-4 h-4" />
          </button>

          <button
            onClick={toggleLocale}
            className="px-2.5 py-1.5 rounded-xl text-xs font-medium text-[#b4b8c2] hover:text-[#f2f2f0] hover:bg-white/[0.05] transition-colors"
          >
            {locale === 'fa' ? 'EN' : 'فا'}
          </button>

          <Link
            href="/wishlist"
            className="relative p-2 rounded-xl text-[#b4b8c2] hover:text-[#f2f2f0] hover:bg-white/[0.05] transition-colors hidden sm:inline-flex"
            title={dict.nav.wishlist}
          >
            <Heart className="w-4 h-4" />
            {wishlistIds.length > 0 && (
              <span className="absolute top-1 end-1 w-2 h-2 rounded-full bg-[#d6b88a]" />
            )}
          </Link>

          <Link
            href={user ? '/profile' : '/login'}
            className="hidden sm:inline-flex p-2 rounded-xl text-[#b4b8c2] hover:text-[#f2f2f0] hover:bg-white/[0.05] transition-colors"
            title={user ? user.full_name : 'Login'}
          >
            <User className="w-4 h-4" />
          </Link>

          <button
            onClick={() => setCartDrawerOpen(true)}
            className="px-3.5 py-2 rounded-xl champagne-btn font-bold text-xs flex items-center gap-2 transition-colors"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{formatNumber(itemCount, locale)}</span>
          </button>

          <button
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Menu"
            className="md:hidden p-2 rounded-xl text-[#f2f2f0] hover:bg-white/[0.05]"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {searchOpen && (
        <div className="border-t border-white/[0.06] bg-[#14161a]">
          <form
            onSubmit={handleSearchSubmit}
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-3"
          >
            <Search className="w-4 h-4 text-[#9ca0ab] flex-shrink-0" />
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
              className="w-full bg-transparent text-sm text-[#f2f2f0] placeholder:text-[#6e7380] focus:outline-none"
            />
          </form>
        </div>
      )}

      {mobileOpen && (
        <div className="md:hidden border-t border-white/[0.06] bg-[#14161a] px-4 py-3 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block py-2.5 px-3 rounded-lg text-sm text-[#d4d6dc] hover:bg-white/[0.04]"
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  )
}
