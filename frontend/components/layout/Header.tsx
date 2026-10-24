'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Globe,
  Heart,
  LayoutDashboard,
  Menu,
  Search,
  ShoppingBag,
  Sparkles,
  User,
  X,
} from 'lucide-react'
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

  // Synchronize HTML dir & lang dynamically whenever locale toggles
  useEffect(() => {
    document.documentElement.dir = locale === 'fa' ? 'rtl' : 'ltr'
    document.documentElement.lang = locale
  }, [locale])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 18)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const navLinks = [
    { href: '/', label: dict.nav.home },
    { href: '/products', label: dict.nav.products },
    { href: '/categories', label: dict.nav.categories },
    { href: '/orders', label: dict.nav.orders },
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
        'sticky top-0 z-40 transition-all duration-300',
        scrolled ? 'py-2.5' : 'py-4'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={cn(
            'glass-panel rounded-2xl px-4 sm:px-6 h-16 flex items-center justify-between gap-4 border transition-all',
            scrolled ? 'border-amber-400/25 shadow-glass-3d' : 'border-white/10'
          )}
        >
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group flex-shrink-0">
            <AruLogo3D className="w-10 h-10 group-hover:scale-110 transition-transform duration-300" />
            <div>
              <div className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                <span>{dict.brandName}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-400/30 font-bold">
                  3D
                </span>
              </div>
              <div className="text-[10px] text-slate-400 hidden sm:block">
                {dict.brandTagline}
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 bg-white/[0.03] border border-white/[0.06] rounded-full p-1">
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
                    'px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all',
                    active
                      ? 'bg-gradient-to-r from-amber-400/20 to-yellow-500/20 text-amber-200 border border-amber-400/35 shadow-[0_0_20px_-6px_rgba(34,211,238,0.5)]'
                      : 'text-slate-300 hover:text-white'
                  )}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>

          {/* Action Icons */}
          <div className="flex items-center gap-2">
            {/* Search Toggle */}
            <button
              onClick={() => setSearchOpen((v) => !v)}
              aria-label="Search"
              className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/10 border border-white/10 text-slate-200 hover:text-amber-300 transition-colors"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Language Switcher FA | EN */}
            <button
              onClick={toggleLocale}
              className="px-2.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/10 border border-white/10 text-xs font-bold text-amber-300 flex items-center gap-1.5 transition-colors"
              title="تغییر زبان / Switch Language"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{locale === 'fa' ? 'EN' : 'فا'}</span>
            </button>

            {/* Wishlist */}
            <Link
              href="/wishlist"
              className="relative p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/10 border border-white/10 text-slate-200 hover:text-rose-400 transition-colors hidden sm:inline-flex"
              title={dict.nav.wishlist}
            >
              <Heart className="w-4 h-4" />
              {wishlistIds.length > 0 && (
                <span className="absolute -top-1 -end-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center">
                  {formatNumber(wishlistIds.length, locale)}
                </span>
              )}
            </Link>

            {/* Quick Cart Drawer Trigger */}
            <button
              onClick={() => setCartDrawerOpen(true)}
              className="relative px-3 py-2 rounded-xl bg-gradient-to-r from-amber-400/20 to-yellow-500/20 hover:from-amber-400/30 hover:to-yellow-500/30 border border-amber-400/35 text-white flex items-center gap-2 transition-all"
            >
              <ShoppingBag className="w-4 h-4 text-amber-300" />
              <span className="text-xs font-extrabold text-amber-200">
                {formatNumber(itemCount, locale)}
              </span>
            </button>

            {/* Admin Studio Shortcut */}
            <Link
              href="/admin"
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-violet-500/15 hover:bg-violet-500/25 border border-violet-400/30 text-xs font-semibold text-violet-200 transition-colors"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-violet-300" />
              <span>{dict.nav.admin}</span>
            </Link>

            {/* Profile / Login */}
            <Link
              href={user ? '/profile' : '/login'}
              className="hidden sm:inline-flex p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/10 border border-white/10 text-slate-200 hover:text-amber-300 transition-colors"
              title={user ? user.full_name : 'Login'}
            >
              <User className="w-4 h-4" />
            </Link>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="md:hidden p-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-slate-200"
            >
              {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Expandable Instant Search Bar */}
        {searchOpen && (
          <form
            onSubmit={handleSearchSubmit}
            className="mt-2 glass-panel rounded-2xl p-3 border border-amber-400/30 flex items-center gap-3 animate-fade-in"
          >
            <Search className="w-4 h-4 text-amber-400 ms-2 flex-shrink-0" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={dict.nav.searchPlaceholder}
              className="w-full bg-transparent text-sm text-white placeholder:text-slate-400 focus:outline-none"
            />
            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs flex-shrink-0"
            >
              {locale === 'fa' ? 'جستجو' : 'Search'}
            </button>
          </form>
        )}

        {/* Mobile Drawer Menu */}
        {mobileOpen && (
          <div className="md:hidden mt-2 glass-panel rounded-2xl p-4 border border-white/15 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-200 hover:bg-white/10"
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-2 border-t border-white/10 grid grid-cols-3 gap-2">
              <Link
                href="/wishlist"
                onClick={() => setMobileOpen(false)}
                className="px-3 py-2 rounded-xl bg-white/5 text-center text-xs text-slate-200"
              >
                {dict.nav.wishlist}
              </Link>
              <Link
                href="/profile"
                onClick={() => setMobileOpen(false)}
                className="px-3 py-2 rounded-xl bg-white/5 text-center text-xs text-slate-200"
              >
                {locale === 'fa' ? 'پروفایل' : 'Profile'}
              </Link>
              <Link
                href="/admin"
                onClick={() => setMobileOpen(false)}
                className="px-3 py-2 rounded-xl bg-violet-500/20 text-center text-xs text-violet-200"
              >
                {dict.nav.admin}
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
