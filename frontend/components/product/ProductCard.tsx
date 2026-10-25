'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Box, Heart, Plus, ShoppingBag } from 'lucide-react'
import Card3DTilt from '@/components/ui/Card3DTilt'
import { cn, formatPrice, getProductTitle } from '@/lib/utils'
import { Product } from '@/types'
import {
  getProductPrimaryFinish,
  isProductAvailable,
} from '@/lib/data/catalog'
import { useStore } from '@/lib/store/useStore'
import { getDict } from '@/lib/data/i18n'

interface ProductCardProps {
  product: Product
  variant?: 'grid' | 'list'
  tone?: 'dark' | 'stone'
  indexNumber?: number
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
  const activeColor = getProductPrimaryFinish(product, colorIdx)
  const available = isProductAvailable(product)
  const primaryImage = product.images[0]?.url
  const isWishlisted = wishlistIds.includes(product.id)

  if (variant === 'list') {
    return (
      <div
        className={cn(
          'rounded-2xl card-level-2 overflow-hidden flex flex-col sm:flex-row items-stretch group',
          className
        )}
      >
        <Link
          href={`/product/${product.slug}`}
          className="relative w-full sm:w-64 h-48 sm:h-auto overflow-hidden flex-shrink-0 product-pedestal-stage"
        >
          {primaryImage ? (
            <img
              src={primaryImage}
              alt={getProductTitle(product, locale)}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#dfc08e]/50">
              <Box className="w-10 h-10" />
            </div>
          )}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-[#08090f]/75 to-transparent"
          />
        </Link>

        <div className="flex-1 p-5 flex flex-col justify-between gap-4">
          <div className="space-y-2.5">
            <Link href={`/product/${product.slug}`}>
              <h3 className="text-lg font-bold text-[#f4f4f6] hover:text-[#dfc08e] transition-colors">
                {getProductTitle(product, locale)}
              </h3>
            </Link>
            {product.colors.length > 0 && (
              <div className="flex items-center gap-2">
                {product.colors.map((c, idx) => (
                  <button
                    key={c.id}
                    onClick={() => setColorIdx(idx)}
                    aria-label={locale === 'fa' ? c.name_fa : c.name}
                    className={cn(
                      'w-4 h-4 rounded-full border transition-transform',
                      colorIdx === idx
                        ? 'scale-125 border-white shadow-[0_0_8px_rgba(223,192,142,0.45)]'
                        : 'border-white/25 opacity-70 hover:opacity-100'
                    )}
                    style={{
                      background: `linear-gradient(135deg, ${c.hex} 42%, ${c.accentHex} 100%)`,
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-4 pt-3 border-t border-white/[0.07]">
            <div className="flex items-baseline gap-2">
              <span className="text-base font-bold text-[#dfc08e]">
                {formatPrice(product.price, locale, product.price_toman)}
              </span>
              {product.compare_price && product.compare_price > product.price && (
                <span className="text-xs text-[#6e768a] line-through">
                  {formatPrice(
                    product.compare_price,
                    locale,
                    product.compare_price_toman
                  )}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setQuickViewProduct(product)}
                className="px-3.5 py-2 rounded-xl secondary-3d-btn text-xs flex items-center gap-1.5"
              >
                <Box className="w-3.5 h-3.5 text-[#dfc08e]" />
                <span>3D</span>
              </button>
              <button
                onClick={() => addToCart(product, 1, activeColor)}
                disabled={!available}
                className="px-4 py-2 rounded-xl champagne-btn font-bold text-xs flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>
                  {available
                    ? dict.common.addToCart
                    : locale === 'fa'
                    ? 'ناموجود'
                    : 'Out of stock'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Card3DTilt className={cn('rounded-2xl h-full', className)}>
      <article className="rounded-2xl card-level-2 overflow-hidden flex flex-col justify-between group h-full">
        {/* Dimensional Pedestal Image Stage (Real Product Undistorted) */}
        <div className="relative aspect-[16/11] w-full overflow-hidden product-pedestal-stage border-b border-white/[0.06]">
          <Link href={`/product/${product.slug}`} className="block w-full h-full">
            {primaryImage ? (
              <img
                src={primaryImage}
                alt={getProductTitle(product, locale)}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.045]"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#dfc08e]/50">
                <Box className="w-10 h-10" />
              </div>
            )}
          </Link>

          {/* Subtle Environmental Rim & Ground Shadow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-16 opacity-80 transition-opacity duration-300 group-hover:opacity-100"
            style={{
              background: `linear-gradient(to top, rgba(10, 12, 20, 0.72) 0%, transparent 100%)`,
            }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-5 left-1/2 -translate-x-1/2 w-2/3 h-8 rounded-full blur-xl opacity-0 group-hover:opacity-55 transition-opacity duration-500"
            style={{ backgroundColor: activeColor.accentHex }}
          />

          {/* Floating Level-4 Utility Pills */}
          <div className="absolute top-3 end-3 z-10 flex items-center gap-1.5 opacity-95 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100 transition-opacity duration-200">
            <button
              onClick={(e) => {
                e.preventDefault()
                setQuickViewProduct(product)
              }}
              title={dict.common.quickView3D}
              aria-label={dict.common.quickView3D}
              className="p-2 rounded-full glass-pill text-[#e8ebf2] hover:text-[#dfc08e] transition-colors"
            >
              <Box className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.preventDefault()
                void toggleWishlist(product.id, product)
              }}
              aria-label="Wishlist"
              className={cn(
                'p-2 rounded-full glass-pill transition-colors',
                isWishlisted ? 'text-[#dfc08e]' : 'text-[#e8ebf2] hover:text-white'
              )}
            >
              <Heart className={cn('w-3.5 h-3.5', isWishlisted && 'fill-current')} />
            </button>
          </div>
        </div>

        {/* Clear Product Hierarchy: Title -> Swatches -> Price -> Physical CTA */}
        <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
          <div className="space-y-2.5">
            <Link href={`/product/${product.slug}`} className="block">
              <h3 className="text-base font-bold text-[#f4f4f6] group-hover:text-[#dfc08e] transition-colors line-clamp-1">
                {getProductTitle(product, locale)}
              </h3>
            </Link>

            {product.colors.length > 0 && (
              <div className="flex items-center gap-2">
                {product.colors.map((c, idx) => (
                  <button
                    key={c.id}
                    onClick={() => setColorIdx(idx)}
                    title={locale === 'fa' ? c.name_fa : c.name}
                    aria-label={locale === 'fa' ? c.name_fa : c.name}
                    className={cn(
                      'w-3.5 h-3.5 rounded-full border transition-transform',
                      colorIdx === idx
                        ? 'scale-125 border-white shadow-[0_0_8px_rgba(223,192,142,0.4)]'
                        : 'border-white/25 opacity-70 hover:opacity-100'
                    )}
                    style={{
                      background: `linear-gradient(135deg, ${c.hex} 42%, ${c.accentHex} 100%)`,
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="pt-3.5 border-t border-white/[0.07] flex items-center justify-between gap-2">
            <span className="text-sm sm:text-base font-bold text-[#dfc08e]">
              {formatPrice(product.price, locale, product.price_toman)}
            </span>

            <button
              onClick={() => addToCart(product, 1, activeColor)}
              disabled={!available}
              className="px-3.5 py-1.5 rounded-xl champagne-btn text-xs font-bold flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {available ? (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>{locale === 'fa' ? 'افزودن' : 'Add'}</span>
                </>
              ) : (
                <span>{locale === 'fa' ? 'ناموجود' : 'Sold out'}</span>
              )}
            </button>
          </div>
        </div>
      </article>
    </Card3DTilt>
  )
}
