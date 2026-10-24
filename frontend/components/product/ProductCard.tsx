'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Box, Heart, ShoppingBag, Star, Sparkles } from 'lucide-react'
import {
  calculateDiscount,
  cn,
  formatNumber,
  formatPrice,
  getProductSubtitle,
  getProductTitle,
} from '@/lib/utils'
import { Product } from '@/types'
import { useStore } from '@/lib/store/useStore'
import { getDict } from '@/lib/data/i18n'
import Card3DTilt from '@/components/ui/Card3DTilt'

interface ProductCardProps {
  product: Product
  variant?: 'grid' | 'list'
  className?: string
}

export default function ProductCard({
  product,
  variant = 'grid',
  className,
}: ProductCardProps) {
  const locale = useStore((s) => s.locale)
  const addToCart = useStore((s) => s.addToCart)
  const wishlistIds = useStore((s) => s.wishlistIds)
  const toggleWishlist = useStore((s) => s.toggleWishlist)
  const setQuickViewProduct = useStore((s) => s.setQuickViewProduct)
  const dict = getDict(locale)

  const [colorIdx, setColorIdx] = useState(0)
  const activeColor = product.colors[colorIdx] || product.colors[0]
  const isWishlisted = wishlistIds.includes(product.id)
  const discount = calculateDiscount(product.price, product.compare_price)

  if (variant === 'list') {
    return (
      <div
        className={cn(
          'glass-panel rounded-3xl p-4 sm:p-6 flex flex-col sm:flex-row items-center gap-6 border border-white/10 hover:border-amber-400/40 transition-all group',
          className
        )}
      >
        <Link
          href={`/product/${product.slug}`}
          className="relative w-full sm:w-56 h-52 rounded-2xl bg-obsidian-950/90 border border-white/5 overflow-hidden flex-shrink-0 flex items-center justify-center p-4"
        >
          <div
            className="absolute inset-0 opacity-30 transition-opacity group-hover:opacity-55"
            style={{
              background: `radial-gradient(circle at 50% 50%, ${activeColor.accentHex}50 0%, transparent 70%)`,
            }}
          />
          <img
            src={product.images[0]?.url}
            alt={getProductTitle(product, locale)}
            className="relative z-10 w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
          />
        </Link>

        <div className="flex-1 min-w-0 space-y-2.5 w-full">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-amber-400">
              {locale === 'fa' ? product.brand.name_fa : product.brand.name}
            </span>
            <div className="flex items-center gap-1 text-amber-400 text-xs">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span className="font-bold text-white">
                {formatNumber(product.rating_avg, locale === 'fa' ? 'en' : 'en')}
              </span>
              <span className="text-slate-400">
                ({formatNumber(product.rating_count, locale)})
              </span>
            </div>
          </div>

          <Link href={`/product/${product.slug}`}>
            <h3 className="text-lg sm:text-xl font-bold text-white hover:text-amber-300 transition-colors">
              {getProductTitle(product, locale)}
            </h3>
          </Link>
          <p className="text-xs sm:text-sm text-slate-400 line-clamp-2">
            {getProductSubtitle(product, locale)}
          </p>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <div>
              <div className="text-lg font-extrabold text-white">
                {formatPrice(product.price, locale, product.price_toman)}
              </div>
              {product.compare_price && (
                <div className="text-xs text-slate-500 line-through">
                  {formatPrice(
                    product.compare_price,
                    locale,
                    product.compare_price_toman
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setQuickViewProduct(product)}
                className="px-3.5 py-2.5 rounded-xl glass-pill text-xs font-medium text-amber-300 hover:bg-amber-500/20 flex items-center gap-1.5"
              >
                <Box className="w-4 h-4" />
                <span>{dict.common.quickView3D}</span>
              </button>
              <button
                onClick={() => addToCart(product, 1, activeColor)}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-1.5 hover:brightness-110"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{dict.common.addToCart}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Card3DTilt
      glowColor={`${activeColor.accentHex}30`}
      className={cn(
        'glass-panel rounded-[1.75rem] p-4 flex flex-col justify-between border border-white/10 hover:border-white/25 group h-full',
        className
      )}
    >
      <div>
        {/* Visual Stage with Z-Depth Pop */}
        <div className="relative rounded-2xl bg-gradient-to-b from-obsidian-800/90 to-obsidian-950/95 border border-white/[0.06] aspect-[4/3.4] overflow-hidden p-4 flex items-center justify-center preserve-3d">
          {/* Dynamic Color Aura */}
          <div
            className="pointer-events-none absolute inset-0 opacity-35 group-hover:opacity-65 transition-opacity duration-500"
            style={{
              background: `radial-gradient(circle at 50% 55%, ${activeColor.accentHex}55 0%, transparent 68%)`,
            }}
          />

          {/* Top Badges */}
          <div className="absolute top-3 start-3 z-20 flex flex-col gap-1.5">
            {discount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/90 text-white backdrop-blur-md">
                {formatNumber(discount, locale)}٪ {dict.common.off}
              </span>
            )}
            {(product.badge || product.badge_fa) && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-obsidian-950/80 text-amber-300 border border-amber-400/30 backdrop-blur-md flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" />
                {locale === 'fa' ? product.badge_fa : product.badge}
              </span>
            )}
          </div>

          {/* Wishlist & Quick 3D Action Buttons */}
          <div className="absolute top-3 end-3 z-20 flex flex-col gap-1.5">
            <button
              onClick={(e) => {
                e.preventDefault()
                toggleWishlist(product.id)
              }}
              aria-label="Wishlist"
              className={cn(
                'p-2 rounded-full backdrop-blur-md border transition-all',
                isWishlisted
                  ? 'bg-rose-500/20 border-rose-400/50 text-rose-400'
                  : 'bg-obsidian-950/70 border-white/10 text-slate-300 hover:text-white hover:border-white/30'
              )}
            >
              <Heart className={cn('w-4 h-4', isWishlisted && 'fill-current')} />
            </button>

            <button
              onClick={(e) => {
                e.preventDefault()
                setQuickViewProduct(product)
              }}
              title={dict.common.quickView3D}
              className="p-2 rounded-full bg-obsidian-950/75 border border-amber-400/30 text-amber-300 hover:bg-amber-400 hover:text-slate-950 transition-all backdrop-blur-md"
            >
              <Box className="w-4 h-4" />
            </button>
          </div>

          {/* Product Studio Render Popping Out in 3D Z-Space */}
          <Link
            href={`/product/${product.slug}`}
            className="relative z-10 w-full h-full flex items-center justify-center translate-z-20"
          >
            <img
              src={product.images[0]?.url}
              alt={getProductTitle(product, locale)}
              className="w-full h-full object-contain group-hover:scale-110 group-hover:-translate-y-1 transition-transform duration-500 drop-shadow-[0_18px_28px_rgba(0,0,0,0.75)]"
            />
          </Link>

          {/* Bottom Interactive 3D Tag */}
          <button
            onClick={() => setQuickViewProduct(product)}
            className="absolute bottom-2.5 inset-x-3 z-20 py-1.5 px-3 rounded-xl bg-obsidian-950/85 border border-white/15 text-[11px] font-medium text-amber-200 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 flex items-center justify-center gap-1.5 backdrop-blur-md hover:border-amber-400/60"
          >
            <Box className="w-3.5 h-3.5 text-amber-400" />
            <span>{dict.common.quickView3D} • 360°</span>
          </button>
        </div>

        {/* Product Meta */}
        <div className="mt-4 space-y-2 px-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-medium text-slate-400 truncate">
              {locale === 'fa' ? product.brand.name_fa : product.brand.name}
            </span>
            <div className="flex items-center gap-1 text-xs">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-current" />
              <span className="font-semibold text-slate-200">
                {product.rating_avg.toFixed(1)}
              </span>
              <span className="text-[11px] text-slate-500">
                ({formatNumber(product.rating_count, locale)})
              </span>
            </div>
          </div>

          <Link href={`/product/${product.slug}`} className="block">
            <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-1">
              {getProductTitle(product, locale)}
            </h3>
            <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
              {getProductSubtitle(product, locale)}
            </p>
          </Link>

          {/* Color Finish Dots */}
          <div className="flex items-center gap-1.5 pt-1">
            {product.colors.map((c, idx) => (
              <button
                key={c.id}
                onClick={() => setColorIdx(idx)}
                title={locale === 'fa' ? c.name_fa : c.name}
                className={cn(
                  'w-4 h-4 rounded-full border transition-transform',
                  colorIdx === idx
                    ? 'scale-125 border-white ring-1 ring-amber-400'
                    : 'border-white/25 opacity-70 hover:opacity-100'
                )}
                style={{
                  background: `linear-gradient(135deg, ${c.hex} 40%, ${c.accentHex} 100%)`,
                }}
              />
            ))}
            <span className="text-[11px] text-slate-500 ms-1 truncate">
              {locale === 'fa' ? activeColor.name_fa : activeColor.name}
            </span>
          </div>
        </div>
      </div>

      {/* Price & Add to Cart Footer */}
      <div className="mt-4 pt-3 border-t border-white/[0.07] flex items-center justify-between gap-2 px-1">
        <div>
          <div className="text-sm sm:text-base font-extrabold text-white">
            {formatPrice(product.price, locale, product.price_toman)}
          </div>
          {product.compare_price && (
            <div className="text-[11px] text-slate-500 line-through">
              {formatPrice(
                product.compare_price,
                locale,
                product.compare_price_toman
              )}
            </div>
          )}
        </div>

        <button
          onClick={() => addToCart(product, 1, activeColor)}
          disabled={product.stock_quantity <= 0}
          className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-gradient-to-r hover:from-amber-300 hover:to-yellow-500 text-white hover:text-slate-950 font-bold text-xs transition-all flex items-center gap-1.5 border border-white/10 hover:border-transparent"
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>{locale === 'fa' ? 'افزودن' : 'Add'}</span>
        </button>
      </div>
    </Card3DTilt>
  )
}
