'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Box, Heart, Plus, ShoppingBag } from 'lucide-react'
import { cn, formatPrice, getProductTitle } from '@/lib/utils'
import { Product } from '@/types'
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
  const activeColor = product.colors[colorIdx] || product.colors[0]
  const isWishlisted = wishlistIds.includes(product.id)

  if (variant === 'list') {
    return (
      <div
        className={cn(
          'rounded-2xl bg-[#14161a] border border-white/[0.07] hover:border-white/[0.16] overflow-hidden flex flex-col sm:flex-row items-stretch transition-colors group',
          className
        )}
      >
        <Link
          href={`/product/${product.slug}`}
          className="relative w-full sm:w-64 h-48 sm:h-auto overflow-hidden flex-shrink-0 bg-[#121317]"
        >
          <img
            src={product.images[0]?.url}
            alt={getProductTitle(product, locale)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </Link>

        <div className="flex-1 p-5 flex flex-col justify-between gap-4">
          <div className="space-y-2">
            <Link href={`/product/${product.slug}`}>
              <h3 className="text-lg font-bold text-[#f2f2f0] hover:text-[#d6b88a] transition-colors">
                {getProductTitle(product, locale)}
              </h3>
            </Link>
            <div className="flex items-center gap-1.5">
              {product.colors.map((c, idx) => (
                <button
                  key={c.id}
                  onClick={() => setColorIdx(idx)}
                  className={cn(
                    'w-4 h-4 rounded-full border transition-transform',
                    colorIdx === idx ? 'scale-125 border-white' : 'border-white/20 opacity-70'
                  )}
                  style={{
                    background: `linear-gradient(135deg, ${c.hex} 42%, ${c.accentHex} 100%)`,
                  }}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 pt-3 border-t border-white/[0.06]">
            <div className="text-base font-bold text-[#f2f2f0]">
              {formatPrice(product.price, locale, product.price_toman)}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setQuickViewProduct(product)}
                className="px-3 py-2 rounded-xl border border-white/10 text-xs text-[#d4d6dc] hover:border-white/25 flex items-center gap-1.5"
              >
                <Box className="w-3.5 h-3.5" />
                <span>3D</span>
              </button>
              <button
                onClick={() => addToCart(product, 1, activeColor)}
                className="px-4 py-2 rounded-xl champagne-btn font-bold text-xs flex items-center gap-1.5"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>{dict.common.addToCart}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'rounded-2xl bg-[#14161a] border border-white/[0.07] hover:border-white/[0.16] overflow-hidden flex flex-col justify-between transition-all duration-300 group h-full',
        className
      )}
    >
      {/* Seamless Studio Packshot Stage */}
      <div className="relative aspect-[16/11] w-full overflow-hidden bg-[#121317]">
        <Link href={`/product/${product.slug}`} className="block w-full h-full">
          <img
            src={product.images[0]?.url}
            alt={getProductTitle(product, locale)}
            className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
          />
        </Link>

        {/* Quiet Corner Icons */}
        <div className="absolute top-3 end-3 z-10 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.preventDefault()
              setQuickViewProduct(product)
            }}
            title={dict.common.quickView3D}
            className="p-2 rounded-full bg-[#0d0e11]/80 backdrop-blur-md border border-white/10 text-[#e4e6eb] hover:text-[#d6b88a] transition-colors"
          >
            <Box className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault()
              toggleWishlist(product.id)
            }}
            aria-label="Wishlist"
            className={cn(
              'p-2 rounded-full bg-[#0d0e11]/80 backdrop-blur-md border border-white/10 transition-colors',
              isWishlisted ? 'text-[#d6b88a]' : 'text-[#e4e6eb]'
            )}
          >
            <Heart className={cn('w-3.5 h-3.5', isWishlisted && 'fill-current')} />
          </button>
        </div>
      </div>

      {/* Minimal Calm Footer */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2.5">
          <Link href={`/product/${product.slug}`} className="block">
            <h3 className="text-base font-bold text-[#f2f2f0] group-hover:text-[#d6b88a] transition-colors line-clamp-1">
              {getProductTitle(product, locale)}
            </h3>
          </Link>

          <div className="flex items-center gap-1.5">
            {product.colors.map((c, idx) => (
              <button
                key={c.id}
                onClick={() => setColorIdx(idx)}
                title={locale === 'fa' ? c.name_fa : c.name}
                className={cn(
                  'w-3.5 h-3.5 rounded-full border transition-transform',
                  colorIdx === idx
                    ? 'scale-125 border-white'
                    : 'border-white/20 opacity-65 hover:opacity-100'
                )}
                style={{
                  background: `linear-gradient(135deg, ${c.hex} 42%, ${c.accentHex} 100%)`,
                }}
              />
            ))}
          </div>
        </div>

        <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between gap-2">
          <span className="text-sm font-bold text-[#f2f2f0]">
            {formatPrice(product.price, locale, product.price_toman)}
          </span>

          <button
            onClick={() => addToCart(product, 1, activeColor)}
            disabled={product.stock_quantity <= 0}
            className="px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-[#d6b88a] text-[#e4e6eb] hover:text-[#111215] text-xs font-semibold transition-colors flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{locale === 'fa' ? 'افزودن' : 'Add'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
