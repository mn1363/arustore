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
    { href: '/', label: locale === 'fa' ? 'صفحه اصلی' : 'Home' },
    { href: '/products', label: locale === 'fa' ? 'محصولات' : 'Products' },
    { href: '/categories', label: locale === 'fa' ? 'دسته‌بندی‌ها' : 'Collections' },
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
      <div
        className={cn(
          'border-b transition-colors duration-300 backdrop-blur-md',
          scrolled
            ? 'bg-[#11100e]/95 border-[#c59b5f]/30'
            : 'bg-[#11100e]/90 border-[#ece6dc]/12'
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[4.4rem] flex items-center justify-between gap-6">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-3 group flex-shrink-0">
            <AruLogo3D className="w-10 h-10 group-hover:scale-105 transition-transform duration-300" />
            <div>
              <div className="font-editorial text-xl sm:text-2xl font-extrabold text-[#f7f4ee] leading-none">
                {dict.brandName}
              </div>
              <div className="text-[11px] text-[#9e9589] mt-1 hidden sm:block">
                {locale === 'fa' ? 'تولیدی ظروف آلومینیوم' : 'Cast-Aluminum Workshop'}
              </div>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center h-full gap-1">
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
                    'relative h-full px-4 flex items-center text-[13px] font-semibold transition-colors',
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
              )
            })}
          </nav>

          {/* Actions */}
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
            >
              {locale === 'fa' ? 'EN' : 'فا'}
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
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-2 rounded-[3px] border border-[#ece6dc]/14 hover:border-[#c59b5f]/55 text-xs font-medium text-[#d6cfc4] hover:text-[#f7f4ee] transition-colors"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#c59b5f]" />
              <span>{locale === 'fa' ? 'پنل کارگاه' : 'Admin'}</span>
            </Link>

            <Link
              href={user ? '/profile' : '/login'}
              className="hidden sm:inline-flex p-2.5 rounded-[3px] border border-[#ece6dc]/12 hover:border-[#c59b5f]/50 text-[#d6cfc4] hover:text-[#f7f4ee] transition-colors"
              title={user ? user.full_name : 'Login'}
            >
              <User className="w-4 h-4" />
            </Link>

            <button
              onClick={() => setCartDrawerOpen(true)}
              className="px-3.5 py-2 rounded-[3px] satin-brass-btn font-bold text-xs flex items-center gap-2 transition-all"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {locale === 'fa' ? 'سبد خرید' : 'Bag'}
              </span>
              <span className="text-[11px] px-1.5 bg-[#11100e]/15 rounded-[2px]">
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

        {searchOpen && (
          <div className="border-t border-[#ece6dc]/12 bg-[#171512]">
            <form
              onSubmit={handleSearchSubmit}
              className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-3"
            >
              <Search className="w-4 h-4 text-[#c59b5f] flex-shrink-0" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  locale === 'fa'
                    ? 'جستجوی شیرینی‌خوری، میوه‌خوری، سینی، کشکول...'
                    : 'Search stands, bowls, trays, kashkools...'
                }
                className="w-full bg-transparent text-sm text-[#f7f4ee] placeholder:text-[#8c8377] focus:outline-none"
              />
              <button
                type="submit"
                className="px-4 py-1.5 rounded-[2px] satin-brass-btn text-xs font-bold flex-shrink-0"
              >
                {locale === 'fa' ? 'جستجو' : 'Search'}
              </button>
            </form>
          </div>
        )}

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
          </div>
        )}
      </div>
    </header>
  )
}
