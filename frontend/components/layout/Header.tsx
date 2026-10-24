'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Heart,
  Menu,
  Search,
  ShoppingBag,
  SlidersHorizontal,
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

  useEffect(() => {
    document.documentElement.dir = locale === 'fa' ? 'rtl' : 'ltr'
    document.documentElement.lang = locale
  }, [locale])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const navLinks = [
    { href: '/', label: locale === 'fa' ? 'تالار اصلی' : 'Salon' },
    { href: '/products', label: locale === 'fa' ? 'آثار و ظروف' : 'Objects' },
    { href: '/categories', label: locale === 'fa' ? 'مجموعه‌ها' : 'Collections' },
    { href: '/orders', label: locale === 'fa' ? 'سفارش‌ها' : 'Orders' },
  ]

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    router.push(`/products?q=${encodeURIComponent(searchQuery.trim())}`)
    setSearchOpen(false)
    setMobileOpen(false)
  }

  return (
    <header className="sticky top-0 z-40">
      {/* Top Foundry Specification Strip */}
      <div className="bg-[#0b0a09] border-b border-[#ece6dc]/10 text-[11px] text-[#b9b0a2]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 truncate">
            <span className="font-mono text-[10px] tracking-widest text-[#c59b5f] uppercase">
              ALLOY 1070 · 99.7% AL
            </span>
            <span className="hidden sm:inline text-[#ece6dc]/20">|</span>
            <span className="truncate">
              {locale === 'fa'
                ? 'ریخته‌گری شمش خالص خوراکی و آنودایز کوره‌ای ۲۲۰ درجه با ضمانت ۵ ساله'
                : 'Pure food-safe cast aluminum · 220°C kiln anodize · 5-year guarantee'}
            </span>
          </div>
          <div className="hidden md:flex items-center gap-4 flex-shrink-0 font-mono text-[10px] tracking-wider text-[#d8dce0]">
            <span>{locale === 'fa' ? 'کد مستقیم کارگاه: ARU3D' : 'ATELIER CODE: ARU3D'}</span>
          </div>
        </div>
      </div>

      {/* Main Architectural Masthead */}
      <div
        className={cn(
          'border-b transition-colors duration-300 backdrop-blur-md',
          scrolled
            ? 'bg-[#11100e]/95 border-[#c59b5f]/30'
            : 'bg-[#11100e]/88 border-[#ece6dc]/12'
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[4.5rem] flex items-center justify-between gap-6">
          {/* Atelier Seal & Wordmark */}
          <Link href="/" className="flex items-center gap-3.5 group flex-shrink-0">
            <AruLogo3D className="w-10 h-10 group-hover:scale-105 transition-transform duration-300" />
            <div className="leading-none">
              <div className="font-editorial text-2xl sm:text-[1.7rem] font-bold tracking-tight text-[#f7f4ee] flex items-baseline gap-2">
                <span>{dict.brandName}</span>
                <span className="font-mono text-[9px] tracking-[0.22em] text-[#c59b5f] uppercase">
                  ATELIER
                </span>
              </div>
              <div className="text-[10px] text-[#9e9589] mt-0.5 hidden sm:block">
                {locale === 'fa'
                  ? 'صنایع فلزتراشی و ظروف پذیرایی آلومینیوم'
                  : 'Architectural Cast-Aluminum Tableware'}
              </div>
            </div>
          </Link>

          {/* Editorial Hairline Navigation */}
          <nav className="hidden md:flex items-center h-full">
            {navLinks.map((link, idx) => {
              const active =
                link.href === '/'
                  ? pathname === '/'
                  : pathname?.startsWith(link.href)
              return (
                <React.Fragment key={link.href}>
                  {idx > 0 && (
                    <span className="h-3.5 w-px bg-[#ece6dc]/12 mx-1" aria-hidden="true" />
                  )}
                  <Link
                    href={link.href}
                    className={cn(
                      'relative h-full px-4 flex items-center text-xs sm:text-[13px] font-medium tracking-wide transition-colors',
                      active
                        ? 'text-[#f7f4ee]'
                        : 'text-[#a89f93] hover:text-[#f7f4ee]'
                    )}
                  >
                    <span>{link.label}</span>
                    {active && (
                      <span className="absolute bottom-0 inset-x-3 h-[2px] bg-[#c59b5f]" />
                    )}
                  </Link>
                </React.Fragment>
              )
            })}
          </nav>

          {/* Precision Utility Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setSearchOpen((v) => !v)}
              aria-label="Search"
              className="p-2.5 rounded-[3px] border border-[#ece6dc]/12 hover:border-[#c59b5f]/50 text-[#d6cfc4] hover:text-[#f7f4ee] transition-colors"
            >
              <Search className="w-4 h-4" />
            </button>

            <button
              onClick={toggleLocale}
              className="px-2.5 py-2 rounded-[3px] border border-[#ece6dc]/12 hover:border-[#c59b5f]/50 font-mono text-[11px] font-semibold text-[#dfc08e] transition-colors"
              title="تغییر زبان / Switch Language"
            >
              {locale === 'fa' ? 'EN' : 'FA'}
            </button>

            <Link
              href="/wishlist"
              className="relative p-2.5 rounded-[3px] border border-[#ece6dc]/12 hover:border-[#c59b5f]/50 text-[#d6cfc4] hover:text-[#f7f4ee] transition-colors hidden sm:inline-flex"
              title={dict.nav.wishlist}
            >
              <Heart className="w-4 h-4" />
              {wishlistIds.length > 0 && (
                <span className="absolute -top-1.5 -end-1.5 min-w-[17px] h-[17px] px-1 rounded-[2px] bg-[#c59b5f] text-[10px] font-bold text-[#11100e] flex items-center justify-center">
                  {formatNumber(wishlistIds.length, locale)}
                </span>
              )}
            </Link>

            <Link
              href="/admin"
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-2 rounded-[3px] border border-[#ece6dc]/14 hover:border-[#c59b5f]/55 text-[11px] font-medium text-[#d6cfc4] hover:text-[#f7f4ee] transition-colors"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#c59b5f]" />
              <span>{locale === 'fa' ? 'دفتر کارگاه' : 'Foundry Desk'}</span>
            </Link>

            <Link
              href={user ? '/profile' : '/login'}
              className="hidden sm:inline-flex p-2.5 rounded-[3px] border border-[#ece6dc]/12 hover:border-[#c59b5f]/50 text-[#d6cfc4] hover:text-[#f7f4ee] transition-colors"
              title={user ? user.full_name : 'Login'}
            >
              <User className="w-4 h-4" />
            </Link>

            {/* Tactile Brushed-Metal Order Bag Trigger */}
            <button
              onClick={() => setCartDrawerOpen(true)}
              className="px-3.5 py-2 rounded-[3px] satin-brass-btn font-bold text-xs flex items-center gap-2 transition-all"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {locale === 'fa' ? 'سبد سفارش' : 'Order'}
              </span>
              <span className="font-mono text-[11px] px-1.5 py-0.2 bg-[#11100e]/15 rounded-[2px]">
                {formatNumber(itemCount, locale)}
              </span>
            </button>

            <button
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Menu"
              className="md:hidden p-2.5 rounded-[3px] border border-[#ece6dc]/15 text-[#f7f4ee]"
            >
              {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Expandable Search Drawer */}
        {searchOpen && (
          <div className="border-t border-[#ece6dc]/12 bg-[#171512]">
            <form
              onSubmit={handleSearchSubmit}
              className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center gap-3"
            >
              <Search className="w-4 h-4 text-[#c59b5f] flex-shrink-0" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  locale === 'fa'
                    ? 'جستجوی شیرینی‌خوری، میوه‌خوری، کشکول، سینی آلومینیوم...'
                    : 'Search stands, fluted bowls, trays, kashkools...'
                }
                className="w-full bg-transparent text-sm text-[#f7f4ee] placeholder:text-[#8c8377] focus:outline-none"
              />
              <button
                type="submit"
                className="px-4 py-1.5 rounded-[2px] satin-brass-btn text-xs font-bold flex-shrink-0"
              >
                {locale === 'fa' ? 'جستجو' : 'Find'}
              </button>
            </form>
          </div>
        )}

        {/* Mobile Drawer */}
        {mobileOpen && (
          <div className="md:hidden border-t border-[#ece6dc]/12 bg-[#141311] px-4 py-4 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block py-2.5 px-3 border-b border-[#ece6dc]/8 text-sm font-medium text-[#ece6dc] hover:text-[#c59b5f]"
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-2 flex items-center gap-3">
              <Link
                href="/wishlist"
                onClick={() => setMobileOpen(false)}
                className="flex-1 py-2 text-center rounded-[3px] border border-[#ece6dc]/15 text-xs text-[#d6cfc4]"
              >
                {dict.nav.wishlist} ({formatNumber(wishlistIds.length, locale)})
              </Link>
              <Link
                href="/admin"
                onClick={() => setMobileOpen(false)}
                className="flex-1 py-2 text-center rounded-[3px] border border-[#c59b5f]/40 text-xs text-[#dfc08e]"
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
